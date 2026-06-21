from rest_framework.serializers import BaseSerializer

from .models import Line, Station, StationLine, Edge, Node
from .serializers import LineSerializer, StationSerializer, NodeSerializer, EdgeSerializer

from django.db.models import QuerySet
from django.shortcuts import get_list_or_404
from typing import Any

from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response

class LinesFetchAPI(ListAPIView[Line]):
    serializer_class = LineSerializer
    paginate_by: int = 1

    # no filtering is required
    def get_queryset(self) -> QuerySet[Line, Line]:
        return Line.objects.all()
    
class StationsFetchAPI(ListAPIView[Station]):
    serializer_class = StationSerializer

    def get_queryset(self) -> QuerySet[Station, Station]:
        # pull out our line_slug param from the URL request
        line_slug: str = self.kwargs["line_slug"]

        return Station.objects.filter(name__in=line_slug)
    

class EdgesNodesFetchAPI(APIView):
    
    def get(self, request: Request, line_slug: str, station_slug: str) -> Response:
        # get all stations that have the same name
        stations: list[Station] = get_list_or_404(
            Station.objects.filter(name__in=station_slug)
            .prefetch_related("lines"))
        
        # since we're selecting one station, we'll have a placeholder variable for the singular Station object
        target_station: Station | None = None
        # check for the station that correctly belongs to the line we selected
        for station in stations:
            if (station.lines.name == line_slug):
                target_station = station
                break

        if (target_station is None):
            print(f"{station_slug} station doesn't exist for the {line_slug} in the database currently")
            return Response("")
        
        edges: QuerySet[Edge] = (Edge.objects.filter(station__in=target_station)
                                 .select_related("station", "edges_from", "edges_to")
                                 .select_related("edges_from__station", "edges_to___station"))

        return Response(request)



