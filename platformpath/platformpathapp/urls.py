from django.urls import path
from . import views
from . import views_api

urlpatterns = [
    path('', views.index, name='index'),
    path('test/', views.test, name='test'),

    path('platformpathAPI/fetchLines', views_api.fetch_lines, name='api_request_lines'),
    path('platformpathAPI/fetchStations', views_api.fetch_stations, name='api_request_stations'),
    path('platformPathAPI/fetchEdgesNodes', views_api.fetch_edges_nodes, name='api_request_edges_nodes')
]
