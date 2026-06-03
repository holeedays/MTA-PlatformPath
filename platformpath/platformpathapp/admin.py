from django.contrib import admin
from .models import Station, Line, Node, Edge

# Register your models here.
admin.site.register(Station)
admin.site.register(Line)
admin.site.register(Node)
admin.site.register(Edge)
