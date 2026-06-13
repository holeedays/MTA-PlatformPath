from django.shortcuts import render
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect

# Create your views here.
# ALL PAGES BELOW ARE FOR TESTING

def index(request: HttpRequest) -> HttpResponse:
    return render(request, "platformpathapp/index_test.html")

def test(request: HttpRequest) -> HttpResponse:
    return render(request, "platformpathapp/path_test.html")

def lines_selection_test(request: HttpRequest) -> HttpResponse:
    return render(request, "platformpathapp/lines_selection_test.html")

def stations_selection_test(request: HttpRequest) -> HttpResponse:
    return render(request, "platformpathapp/stations_selection_test.html")
