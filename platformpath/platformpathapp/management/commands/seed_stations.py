from django.core.management import BaseCommand
from platformpathapp.models import Station, Line, Node, Edge

# Import individual stations
from platformpathapp.management.stations import bay_50_st

class Command(BaseCommand):
    help = 'Seed initial station data'

    def handle(self, *args, **kwargs):
        self.stdout.write("Clearing old station data....")

        Station.objects.all().delete()
        Line.objects.all().delete()

        self.stdout.write("Starting database seed...\n")

        # Seed each station
        bay_50_st.seed(self.stdout, self.style)

        self.stdout.write(self.style.SUCCESS("\nAll station data seeded successfully!"))
