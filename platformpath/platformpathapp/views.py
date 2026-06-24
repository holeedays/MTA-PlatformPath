from django.shortcuts import render
from django.http import HttpRequest, HttpResponse

# Create your views here.
# ALL PAGES BELOW ARE FOR TESTING

def index(request: HttpRequest) -> HttpResponse:
    return render(request, "platformpathapp/index.html")

def full_path(request:HttpRequest) -> HttpResponse:
    return render(request, "platformpathapp/full_path_test.html")

def lines_selection(request: HttpRequest) -> HttpResponse:
    return render(request, "platformpathapp/lines_selection.html")

def stations_selection(request: HttpRequest, line_slug: str) -> HttpResponse:
    return render(request, "platformpathapp/stations_selection.html")

def interactive_map(request: HttpRequest, line_slug: str, station_slug: str) -> HttpResponse:
    return render(request, "platformpathapp/station_map.html")