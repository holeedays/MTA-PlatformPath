from django.urls import path
from . import views
from . import views_api

urlpatterns = [
    path('', views.index, name='index'),
    path('test/', views.test, name='test'),
    path('full_path/', views.full_path, name='full_path'),
    path('test/lines_selection', views.lines_selection_test, name='lines_selection_test'),
    path('test/stations_selection', views.stations_selection_test, name='stations_selection_test'),

    # will change these later, currently, using nested routes causes the api path to route weirdly
    # e.g. an api call from "test/stations_selection" will prepend "test/" to "platformpathAPI/fetchStations"
    path('test/platformpathAPI/fetchLines', views_api.fetch_lines, name='api_request_lines'),
    path('test/platformpathAPI/fetchStations', views_api.fetch_stations, name='api_request_stations'),
    path('test/platformPathAPI/fetchEdgesNodes', views_api.fetch_edges_nodes, name='api_request_edges_nodes')
]
