from django.core.management import BaseCommand
from platformpathapp.models import Station, Line, Node, Edge

class Command(BaseCommand):
    help = 'Seed initial station data'

