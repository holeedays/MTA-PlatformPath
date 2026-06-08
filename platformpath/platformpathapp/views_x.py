from django.shortcuts import render
from django.http import HttpRequest, HttpResponse

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Line, Station, Edge, Node
from .serializers import LineSerializer, StationSerializer, EdgeSerializer, NodeSerializer

from typing import cast, Any
from django.db.models import QuerySet

@api_view(["POST"])
def fetch_station_api(request: HttpRequest) -> HttpResponse:

    # dict will be organized like this:
    # {
    # "station_name": {"station_model": ..., "edge_models":..., "node_models": ...}
    station_data: dict[str, Any] = dict()
    station_names: list[str] = cast(list[str], request.data)

    # do a single db call to fetch all stations
    station_queryset: QuerySet[Station] = Station.objects.filter(name__in=station_names) 
    stations_dict: dict[str, Station] = {station.name: station for station in station_queryset}
    
    # check if all station names are found within the database
    for name in station_names:
        if (not name in stations_dict):
            # will raise an exception on the backend for now
            raise Exception(f"{name} is not found in the database")
    
    # make another db query call to get all edges (and nodes **avoids more db calls**)
    edge_queryset: QuerySet[Edge] = (
        Edge.objects.filter(station__in=station_queryset)
        .select_related("from_node", "to_node")
        )
    
    for station_name, station_model in stations_dict.items():
        station_edges: list[Edge] = [edge for edge in edge_queryset if edge.station_id == station_model.id]
        station_nodes: set[Node] = {edge.from_node for edge in station_edges} | {edge.to_node for edge in station_edges}

        station_data[station_name] = {
            "station_model": StationSerializer(station_model).data,
            "edge_models": EdgeSerializer(station_edges, many=True).data,
            # django rest framework usually requires an indexable item (sets cannot ofc...)
            "station_nodes": NodeSerializer(list(station_nodes), many=True).data
        }

    return Response(station_data)