from django.urls import path
from . import views
from . import views_api

urlpatterns = [
    path('', views.index, name='index'),
    path('test/', views.test, name='test'),



    path('fetchStationsAPI/', views_api.fetch_station, name='api_request')
]
