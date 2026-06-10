from rest_framework import serializers
from .models import Line, Station, Edge, Node

class LineSerializer(serializers.ModelSerializer[Line]):
    # here we state what information we want the API to serialize and send
    class Meta:
        model = Line
        fields: list[str] = ["name"]

class StationSerializer(serializers.ModelSerializer[Station]):
    # helps return the foreign key's - line - name attribute instead of its ID
    lines = serializers.SlugRelatedField(
        many=True, # set true since it is M2M field
        slug_field="name",
        read_only=True # means that the client can't write to the database with this information
    )

    class Meta:
        model = Station
        fields: list[str] = ["name", "diagram_path", "lines"]

class NodeSerializer(serializers.ModelSerializer[Node]):

    station = serializers.SlugRelatedField(
        slug_field="name",
        read_only=True
    )

    class Meta:
        model = Node
        fields: list[str] = ["id","station", "node_type", "label", "svg_id", "layer", "is_accessible"]

class EdgeSerializer(serializers.ModelSerializer[Edge]):

    # from_node = serializers.SlugRelatedField(
    #     slug_field="label",
    #     read_only=True
    # )
    # to_node = serializers.SlugRelatedField(
    #     slug_field="label",
    #     read_only=True
    # )

    class Meta:
        model = Edge
        fields: list[str] = ["station", "from_node", "to_node", "instruction_forward", "instruction_backward", "is_active"]