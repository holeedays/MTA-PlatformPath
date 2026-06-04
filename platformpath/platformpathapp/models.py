from django.db import models

class Line(models.Model):
    name = models.CharField(max_length=10)

    def __str__(self):
        return self.name

class Station(models.Model):
    name = models.CharField(max_length=200)
    diagram_path = models.CharField(max_length=100)
    lines = models.ManyToManyField(Line, blank=True)

    def __str__(self):
        return self.name

class Node(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    node_type = models.CharField(max_length=20)
    label = models.CharField(max_length=200)
    svg_id = models.CharField(max_length=100)
    layer = models.CharField(max_length=100)

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
