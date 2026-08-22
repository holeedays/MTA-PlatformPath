from django.shortcuts import render
from django.http import HttpRequest, HttpResponse, Http404, HttpResponseNotFound

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

def stations_selection(request: HttpRequest, line_slug: str) -> HttpResponse | HttpResponseNotFound:
    # check if the line slug is valid
    if (not check_line_slug(line_slug)):
        return HttpResponseNotFound("<h3>Invalid line slug<h3>")

    return render(request, "platformpathapp/stations_selection.html")

def station_map(request: HttpRequest, line_slug: str, station_slug: str) -> HttpResponse | HttpResponseNotFound:
    # check if these slugs actually exist within the database
    line_model: Line | None = check_line_slug(line_slug)
    station_model: Station | None = check_station_slug(station_slug)

    # in our slug verifier, we have prefetched the corresponding line and station models already so we can just compare as is
    # make sure to check that even if the line is valid, does belong with this list of stations
    if (line_model is None or station_model is None):
        return HttpResponseNotFound("<h3>Invalid line and/or station slug<h3>")
    if (not line_model in station_model.lines.all()):
        return HttpResponseNotFound("<h3>Current station does not match with the given subway line<h3>")

    # also we have to decide which template for station map we should show based on the device type
    # -- station map has two dedicated layouts
    if (request.user_agent.is_mobile or request.user_agent.is_tablet):
        return render(request, "platformpathapp/station_map_mobile_tablet.html")
    else:
        return render(request, "platformpathapp/station_map_desktop.html")

def not_found(request: HttpRequest) -> HttpResponseNotFound:
    return HttpResponseNotFound("<h3>This page doesn't exist currently, come back later<h3>")