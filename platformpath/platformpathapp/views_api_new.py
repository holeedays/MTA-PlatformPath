from .models import Line, Station, Edge, Node
from .serializers import LineSerializer, StationSerializer, CompoundEdgesNodesSerializer

from django.db.models import QuerySet, F
from django.shortcuts import get_object_or_404
from typing import Any

from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response

from rest_framework.utils.serializer_helpers import ReturnDict

# fetch a list of all lines 
class LinesFetchAPI(ListAPIView[Line]):
    serializer_class = LineSerializer

    # no filtering is required
    def get_queryset(self) -> QuerySet[Line, Line]:
        return Line.objects.all()
    
# fetch all stations based on a selected line
class StationsFetchAPI(ListAPIView[Station]):
    serializer_class = StationSerializer

    def get_queryset(self) -> QuerySet[Station, Station]:
        # pull out our line_slug param from the URL request... we can also directly access the value as a param
        # in the get() method
        line_id: int = self.kwargs["line_id"]

        # get all our stations...
        stations_data: QuerySet[Station] = (Station.objects.filter(lines__id=line_id)
                                            .prefetch_related("lines")
                                            # add an extra custom field that returns extra metadata
                                            # btw, F means "refer to a database field value inside the SQL query"
                                            .annotate(station_order_value=F("station_line__order"))
                                            # order the stations chronologically
                                            .order_by("station_line__order"))
                    
        return stations_data
    
# fetch all edges and nodes corresponding to the selected station and line
class EdgesNodesFetchAPI(APIView):
    
    def get(self, request: Request, station_id: int) -> Response:
        # get the station that has the right name and line with the right name
        target_station: Station = get_object_or_404(Station,
                                                     id=station_id)

        # get all edges related to our target station
        edges: QuerySet[Edge] = (Edge.objects.filter(station=target_station)
                                 .select_related("station", "from_node", "to_node", "from_node__station", "to_node__station"))
        # get all possible unique nodes -- do union with from & to nodes of the edge model to avoid missing any nodes
        # then cast it back to a list because remember, non-indexable stuff for serializers are a big no no
        nodes: list[Node] = list({edge.from_node for edge in edges} | {edge.to_node for edge in edges})
        
        # get our data arranged in a structure that we can fit into our compound model serializer
        edges_nodes_data: dict[str, QuerySet[Edge] | list[Node]] = {
            "edges": edges,
            "nodes": nodes
        }
        # then serialize it
        serialized_edges_nodes_data: ReturnDict[str, Any] = CompoundEdgesNodesSerializer(edges_nodes_data).data 

        return Response(serialized_edges_nodes_data)



