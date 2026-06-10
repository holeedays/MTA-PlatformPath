from django.shortcuts import render
from django.http import HttpRequest, HttpResponse

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Line, Station, StationLine, Edge, Node
from .serializers import LineSerializer, StationSerializer, EdgeSerializer, NodeSerializer

from typing import cast, Any
from django.db.models import QuerySet

# for fetching all available lines (the request body doesn't really matter here)
@api_view(["POST"])
def fetch_lines(request: HttpRequest) -> Response:

    # line_queryset (when serialized) will be organized like this:
    # [
    #   line_1_json_obj,
    #   line_2_json_obj,
    #   ...
    # ]

    lines_queryset: QuerySet[Line] = Line.objects.all()

    return Response(LineSerializer(lines_queryset, many=True).data)


# for fetching stations (given an array of line names)
@api_view(["POST"])
def fetch_stations(request: HttpRequest) -> Response:

    # line_data will be organized like this:
    # {
    #   "line_1_name": [station_1_json_obj, station_2_json_obj, ...],
    #   "line_2_name": [station_1_json_obj, station_2_json_obj, ...],
    #   ...
    # }
    line_names: list[str] = cast(list[str], request.data)
    line_data: dict[str, Any] = {name: [] for name in line_names}

    lines_queryset: QuerySet[Line] = Line.objects.filter(name__in=line_names)
    lines_dict: dict[str, Line] = {line.name: line for line in lines_queryset}
    # checking if all aforementioned lines exist in the database
    for name in line_names:
        if (not name in lines_dict):
            raise Exception(f"Cannot find line {name} in the database")
    
    # get our through objects (this gives us crucial metadata between the stations and lines tables)
    station_line_queryset: QuerySet[StationLine] = (StationLine.objects
                                                    .filter(line__in=lines_queryset)
                                                    .select_related("station", "line")
                                                    .order_by("line__name", "order")) #returns the queryset sorted based on line name and then order (of station relative to the line)
    
    for station_line in station_line_queryset:
        station_model: Station = station_line.station
        line_data[station_line.line.name].append(StationSerializer(station_model).data)
    
    return Response(line_data)


# for fetching edges and nodes (given an array of station names)
@api_view(["POST"])
def fetch_edges_nodes(request: HttpRequest) -> Response:

    # station_data will be organized like this:
    # {
    #   "station_name_1": {
    #       "station_model": station_json_obj
    #       "edge_models": [edge_1_json_obj, edge_2_json_obj, ...]
    #       "node_models": [node_1_json_obj, node_2_json_obj, ...]
    
            # TODO: Add layer field here and update in frontend js
            # unique_layers = Node.objects.values_list('layer', flat=True).distinct()
    #   }
    #   ...
    # }
    station_data: dict[str, Any] = dict()
    station_names: list[str] = cast(list[str], request.data)

    # do a single db call to fetch all stations
    station_queryset: QuerySet[Station] = Station.objects.filter(name__in=station_names) 
    stations_dict: dict[str, Station] = {station.name: station for station in station_queryset}
    
    # check if all station names are found within the database
    for name in station_names:
        if (not name in stations_dict):
            # will raise an exception on the backend for now
            raise Exception(f"Cannot find station {name} in the database")
    
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
            "node_models": NodeSerializer(list(station_nodes), many=True).data
        }

    return Response(station_data)