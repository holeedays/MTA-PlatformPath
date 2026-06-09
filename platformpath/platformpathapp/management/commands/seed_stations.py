from django.core.management import BaseCommand
from django.db import OperationalError, connection
from platformpathapp.models import Station, Line, StationLine, Node, Edge

# Import individual stations
from platformpathapp.management.stations import bay_50_st

class Command(BaseCommand):
    help = 'Seed initial station data'

    def handle(self, *args, **kwargs):
        # clear old data first if any
        self.clear_old_db_data()

        self.stdout.write("Starting database seed...\n")

        # Seed each station
        bay_50_st.seed(self.stdout, self.style)

        self.stdout.write(self.style.SUCCESS("\nAll station data seeded successfully!"))

    # clear old database data
    def clear_old_db_data(self):

        self.stdout.write("Clearing old station data....")

        # allows us to talk to the database directly here
        # old M2M data caused some issues before when clearing the table hence this command here
        try:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM platformpathapp_station_lines")
        except OperationalError:
            pass

        Edge.objects.all().delete()
        Node.objects.all().delete()
        StationLine.objects.all().delete()
        Station.objects.all().delete()
        Line.objects.all().delete()

