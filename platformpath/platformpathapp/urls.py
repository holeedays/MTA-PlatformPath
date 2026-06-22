from django.urls import path
from . import views
from . import views_api_new # new api format
from . import views_api # antiquated

urlpatterns = [
    path('', views.index, name='index'),
    path('test/', views.test, name='test'),
    path('full_path/', views.full_path, name='full_path'),

    # discover panel... users can individually interact with maps by themselves
    path('discover/lines/', views.lines_selection, name='lines_selection'),
    path('discover/lines/<slug:line_slug>/stations/', views.stations_selection, name='stations_selection'),
    path('discover/lines/<slug:line_slug>/stations/<slug:station_slug/', views.interactive_map, name='interactive_map'),

    # api panel for discover panel
    path('api/lines/', views_api_new.LinesFetchAPI.as_view(), name='lines_fetch'),
    path('api/lines/<slug:line_slug>/stations/', views_api_new.StationsFetchAPI.as_view(), name='stations_fetch'),
    path('api/lines/<slug:line_slug>/stations/<slug:station_slug/', views_api_new.EdgesNodesFetchAPI.as_view(), name='edges_nodes_fetch'),


    # will change these later, currently, using nested routes causes the api path to route weirdly
    # # e.g. an api call from "test/stations_selection" will prepend "test/" to "platformpathAPI/fetchStations"
    path('test/platformpathAPI/fetchLines', views_api.fetch_lines, name='api_request_lines'),
    path('test/platformpathAPI/fetchStations', views_api.fetch_stations, name='api_request_stations'),
    path('test/platformPathAPI/fetchEdgesNodes', views_api.fetch_edges_nodes, name='api_request_edges_nodes')
]
