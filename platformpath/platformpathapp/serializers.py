from rest_framework import serializers
from .models import Line, Station, Edge, Node

class LineSerializer(serializers.ModelSerializer[Line]):
    # here we state what information we want the API to serialize and send
    class Meta:
        model = Line
        fields: list[str] = ["name"]

class StationSerializer(serializers.ModelSerializer[Station]):

    lines = serializers.SlugRelatedField(
        many=True, # set this to true for M2M relationships
        slug_field="name", # returns the name attribute of lines
        read_only=True # clients cannot write to the db
    )
    # create a serializable field that we returns a value from a given method
    # in our case, it is the station's order
    station_order = serializers.SerializerMethodField()

    class Meta:
        model = Station
        fields: list[str] = ["name", "diagram_path", "lines", "station_order"]

    # NOTE: get_ prefix has to be linked to the variable name for this to work
    # obj is the current Station instance; 
    # station_line is the related_name of station foreign key in StationLine model, allows us to access the through model
    # directly from the Station model
    def get_station_order(self, obj: Station) -> int:
        return obj.station_line.values_list("order", flat=True).first() # values_list returns a queryset of the type of field (str/int/tuple..)


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

class CompoundEdgesNodesSerializer(serializers.Serializer[EdgeSerializer | NodeSerializer]):
    edges = EdgeSerializer()
    nodes = NodeSerializer()