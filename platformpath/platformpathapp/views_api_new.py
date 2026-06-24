from .models import Line, Station, Edge, Node, StationLine
from .serializers import EdgeSerializer, LineSerializer, NodeSerializer, StationSerializer

from django.db.models import QuerySet, Count, OuterRef, Subquery
from django.shortcuts import get_object_or_404
from typing import Any

from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response


# fetch a list of all lines 
class LinesFetchAPI(ListAPIView[Line]):
    serializer_class = LineSerializer

    # list api view automatically serializes this queryset (look at fetching edges and nodes for how the function usually works)
    def get_queryset(self) -> QuerySet[Line, Line]:
        return (Line.objects.all()
                # NOTE: since we specify related names in the stationline through model for the line and station model,
                # django changed the reverse relation from "station_set" to "station" to avoid namespace collision
                .annotate(num_of_available_stations=Count("station")))
    
# fetch all stations based on a selected line
class StationsFetchAPI(ListAPIView[Station]):
    serializer_class = StationSerializer

    def get_queryset(self) -> QuerySet[Station, Station]:
        # pull out our line_slug param from the URL request... we can also directly access the value as a param
        # in the get() method
        line_id: int = self.kwargs["line_id"]

        # since we're filtering by stations and calling StationLine, this creates an unneccessary JOIN since StationLine
        # is many to one with the Station model; as such creating a secondary query avoid this join (or we can call
        # StationLine and filter that way BUT we wouldn't be able to get a queryset of Stations)
        order_subquery: QuerySet[StationLine, dict[str, Any]] = StationLine.objects.filter(
            station=OuterRef("id"),
            line_id=line_id
        ).values("order")[:1] # the list slice is required and forces the query to only fetch 1 row

        # get all our stations...
        stations_data: QuerySet[Station] = (Station.objects.filter(lines__id=line_id)
                                            .prefetch_related("lines")
                                            # add an extra custom field that denotes order
                                            .annotate(station_order=Subquery(order_subquery))
                                            # order the stations chronologically
                                            .order_by("station_order"))
                    
        return stations_data
    
# fetch all edges and nodes corresponding to the selected station and line
class EdgesNodesFetchAPI(APIView):
    
    def get(self, request: Request, station_id: int) -> Response:
        # get the station that has the right id and add a custom attribute
        target_station: Station = get_object_or_404(Station.objects.filter(id=station_id)
                                                    .annotate(station_order=F("station_line__order"))
                                                    .prefetch_related("lines"))

        # get all edges related to our target station
        edges: QuerySet[Edge] = (Edge.objects.filter(station=target_station)
                                 .select_related("station", "from_node", "to_node", "from_node__station", "to_node__station"))
        # get all possible unique nodes -- do union with from & to nodes of the edge model to avoid missing any nodes
        # then cast it back to a list because remember, non-indexable stuff for serializers are a big no no
        nodes: list[Node] = list({edge.from_node for edge in edges} | {edge.to_node for edge in edges})

        unique_layers: set[str] = {node.layer for node in nodes}
        
        # get our data arranged in a structure that we can fit into our compound model serializer
        edges_nodes_data = {
            "station_model": StationSerializer(target_station).data,
            "edge_models": EdgeSerializer(edges, many=True).data,
            "unique_layers": list(unique_layers),
            # django rest framework usually requires an indexable item (sets cannot ofc...)
            "node_models": NodeSerializer(list(nodes), many=True).data
        }

        return Response(edges_nodes_data)



