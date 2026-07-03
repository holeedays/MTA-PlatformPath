from django.db import models
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

class Node(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    node_type = models.CharField(max_length=20)
    label = models.CharField(max_length=200)
    svg_id = models.CharField(max_length=100)
    layer = models.ForeignKey(Layer, on_delete=models.CASCADE)
    is_accessible = models.BooleanField(default=False) 

    def __str__(self):
        return f"{self.station.name} - {self.label}"

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
