from django.db import models
from django.core.exceptions import ValidationError
from typing import Any
from .services.slugs import slugify

class Line(models.Model):
    name = models.CharField(max_length=10, unique=True)
    slug_name = models.CharField(max_length=10, unique=True, null=True)
    color = models.CharField(max_length=50, default="")

    def __str__(self):
        return self.name

    # whenever we save a new instance, we ovverride the save method to slugify the name
    def save(self, *args, **kwargs):
        if not self.slug_name:
            self.slug_name = slugify(self.name)
        super().save(*args, **kwargs)

class Station(models.Model):
    name = models.CharField(max_length=200)
    slug_name = models.CharField(max_length=200, null=True, blank=True)
    diagram_path = models.CharField(max_length=100)
    lines = models.ManyToManyField(
        to=Line, 
        blank=True,
        through="StationLine")

    def __str__(self):
        return self.name
    
    # whenever we save a new instance, we ovverride the save method to slugify the name
    def save(self, *args, **kwargs):
        if not self.slug_name:
            self.slug_name = slugify(self.name)
        super().save(*args, **kwargs)
    
class StationLine(models.Model):
    # added related name for the foreign keys to allow direct access from Station/Line models to the through model
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name="station_line")
    line = models.ForeignKey(Line, on_delete=models.CASCADE, related_name="line_station")
    # position of a station relative to a line (is it the 10th stop..20th stop or last stop??)
    order = models.IntegerField()

    # include some constraints to prevent the same station and line to have multiple orders
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["station", "line"],
                name="unique_station_line",
            ), 
            models.UniqueConstraint(
                fields=["line", "order"],
                name="unique_line_order"
            )
        ]


class Layer(models.Model):
    # stations do not share layers
    # each station will have its own set of layers
    name = models.CharField(max_length=100)
    layerOrder = models.IntegerField()
    color = models.CharField(max_length=7)  # For hex color codes (e.g., "#FF0000")
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    svg_id = models.CharField(max_length=100)

    def __str__(self):
        return self.name


# models.TextChoices or models.IntChoices function like enums
# declaring a choice requires a tuple (the value + label [the human readable value])
# this will be used in nodes
class NodeTypes(models.TextChoices):
    NONE = ("NONE", "None") # default value
    EXIT_STAIRS = ("EXT_STRS", "Exit Stairs")
    STAIRS = ("STRS", "Stairs")
    UPTOWN_PLATFORM = ("PLTFRM_UPTWN", "Uptown Platform")
    DOWNTOWN_PLATFORM = ("PLTFRM_DWNTWN", "Downtown Platform")
    MEZZANINE = ("MEZZ", "Mezzanine")
    MEZZANINE_B = ("MEZZ_B", "Mezzanine B")
    RAMP = ("RMP", "Ramp")
    ELEVATOR = ("ELVTR", "Elevator")
    ESCALATOR = ("ESCLTR", "Escalator")

    # used as a validator method when creating a node JSONField
    @staticmethod
    def validate_types(json_field: Any | dict[str, str]) -> None:
        if (not (isinstance(json_field, dict))):
            raise ValidationError("This is not a dict")
        # convert the list of (values, labels) into a dict (so we can check through the hash for valid entries)
        type_choices = dict(NodeTypes.choices)
        # the jsonfield will be a dict with the key being the value (e.g. "MEZZ") and the value being the label (e.g. "Mezzanine")
        for value, label in json_field.items():
            if (not (value in type_choices) or type_choices[value] != label):
                raise ValidationError("The value or value:type combination is not found in the Types enum. Please select a valid one")
    # used to assign a default node type value to a JSONField
    @classmethod
    def get_default(cls) -> dict[str, str]:
        return {cls.NONE: cls.NONE.label}

class Node(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    label = models.CharField(max_length=200)
    svg_id = models.CharField(max_length=100)
    layer = models.ForeignKey(Layer, on_delete=models.CASCADE)
    is_accessible = models.BooleanField(default=False) 
                
    types = models.JSONField(
        name="types_dict", #NOTE: this will be the default name now
        default=NodeTypes.get_default,
        validators=[NodeTypes.validate_types]
    )
    
    def __str__(self):
        return f"{self.station.name} - {self.label}"

    # overriding the save method (mainly for making sure our jsonfield is valid)
    def save(self, *args, **kwargs) -> None:
        # this is because django doesnt trigger validators when creating the object (for performance or smthing or whatever...)
        # .full_clean() does trigger it so we're gonna add this when saving the object
        self.full_clean() 
        super().save(*args, **kwargs)

class Edge(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    from_node = models.ForeignKey(Node, related_name='edges_from',
                                             on_delete=models.CASCADE)
    to_node = models.ForeignKey(Node, related_name='edges_to',
                                             on_delete=models.CASCADE)
    instruction_forward = models.CharField(max_length=300)
    instruction_backward = models.CharField(max_length=300)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.from_node.label} - {self.to_node.label}"
