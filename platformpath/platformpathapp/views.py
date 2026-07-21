from django.shortcuts import render
from django.http import HttpRequest, HttpResponse, Http404

from .services.slugs import slugify, check_line_slug, check_station_slug
from .models import Line, Station

# Create your views here.
# ALL PAGES BELOW ARE FOR TESTING

def index(request: HttpRequest) -> HttpResponse:
    return render(request, "platformpathapp/index.html")

# old index page
def index_antiquated(request: HttpRequest) -> HttpResponse:
    return render(request, "platformpathapp/index_antiquated.html")

def full_path(request:HttpRequest) -> HttpResponse:
    return render(request, "platformpathapp/full_path_test.html")

def lines_selection(request: HttpRequest) -> HttpResponse:
    return render(request, "platformpathapp/lines_selection.html")

def stations_selection(request: HttpRequest, line_slug: str) -> HttpResponse:
    if (not check_line_slug(line_slug)):
        raise Http404

    return render(request, "platformpathapp/stations_selection.html")

def interactive_map(request: HttpRequest, line_slug: str, station_slug: str) -> HttpResponse:
    line_model: Line | None = check_line_slug(line_slug)
    station_model: Station | None = check_station_slug(station_slug)

    if (line_model is None or station_model is None):
        raise Http404
    
    # in our slug verifier, we have prefetched the corresponding line and station models already so we can just compare as is
    # we just have to check if these line and station models are related
    if (not line_model in station_model.lines.all()):
        raise Http404
    

    return render(request, "platformpathapp/station_map.html")