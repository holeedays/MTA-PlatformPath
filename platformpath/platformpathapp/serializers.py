from rest_framework import serializers
from .models import Line, Station, Edge, Node

class LineSerializer(serializers.ModelSerializer[Line]):
    # here we state what information we want the API to serialize and send
    class Meta:
        model = Line
        fields: list[str] = ["name"]

class StationSerializer(serializers.ModelSerializer[Station]):
    class Meta:
        model = Station
        fields: list[str] = ["name", "diagram_path", "lines"]

class NodeSerializer(serializers.ModelSerializer[Node]):
    class Meta:
        model = Node
        fields: list[str] = ["id","station", "node_type", "label", "svg_id", "layer", "is_accessible"]

class EdgeSerializer(serializers.ModelSerializer[Edge]):
    class Meta:
        model = Edge
        fields: list[str] = ["station", "from_node", "to_node", "instruction_forward", "instruction_backward", "is_active"]