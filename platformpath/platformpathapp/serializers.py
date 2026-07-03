from typing import Any

from rest_framework import serializers
from django.db.models import QuerySet
from .models import Line, Station, Edge, Node, Layer

class LineSerializer(serializers.ModelSerializer[Line]):
    # here we state what information we want the API to serialize and send

    # annotation field denoting whether the line has any available stations in the db
    num_of_available_stations = serializers.IntegerField(read_only=True)

    class Meta:
        model = Line
        fields: list[str] = ["name", "color", "id", "num_of_available_stations"]

    # this deals with annotations that may or may not exist when queried, we're overriding it currently
    def to_representation(self, instance: Line) -> dict[str, Any]:
        # get the default serialized dictionary data
        data: dict[str, Any] = super().to_representation(instance)
        # check if our current Line model instance actually has this field (e.g. we did .annotate with this custom property)
        # if not, remove it from our serialization data
        if (not hasattr(instance, "num_of_available_stations")):
            data.pop("num_of_available_stations", None)
        
        return data

class StationSerializer(serializers.ModelSerializer[Station]):

    lines = serializers.SlugRelatedField(
        many=True, # set this to true for M2M relationships
        slug_field="name", # returns the name attribute of lines
        read_only=True # clients cannot write to the db
    )

    # create a serializable field that is annotated (doesn't exist in the model)
    station_order = serializers.IntegerField(read_only=True)

    class Meta:
        model = Station
        fields: list[str] = ["name", "id", "diagram_path", "lines", "station_order"]

    # this deals with annotations that may or may not exist when queried, we're overriding it currently
    def to_representation(self, instance: Station) -> dict[str, Any]:
        # get the default serialized dictionary data
        data: dict[str, Any] = super().to_representation(instance)
        # check if our current Station model instance actually has this field (e.g. we did .annotate with this custom property)
        # if not, remove it from our serialization data
        if (not hasattr(instance, "station_order")):
            data.pop("station_order", None)
        
        return data


class NodeSerializer(serializers.ModelSerializer[Node]):

    # returns the station foreignkey's name
    # if the variable's name is not the same as the foreign key in the model, you can include the source=""
    # argument to indicate what column we are referring to in this model
    station = serializers.SlugRelatedField(
        slug_field="name", 
        read_only=True 
    )

    class Meta:
        model = Node
        fields: list[str] = ["id", "station", "node_type", "label", "svg_id", "layer", "is_accessible"]

class EdgeSerializer(serializers.ModelSerializer[Edge]):

    # from_node = serializers.SlugRelatedField(
    #     slug_field="label",
    #     read_only=True
    # )
    # to_node = serializers.SlugRelatedField(
    #     slug_field="label",
    #     read_only=True
    # )
    station = serializers.SlugRelatedField(
        slug_field="name", 
        read_only=True 
    )

    class Meta:
        model = Edge
        # from_node and to_node will be returned as ids, which is fine for our case
        fields: list[str] = ["id", "station", "from_node", "to_node", "instruction_forward", "instruction_backward", "is_active"]

class LayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Layer
        fields = '__all__'