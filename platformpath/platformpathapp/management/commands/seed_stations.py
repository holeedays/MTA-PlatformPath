from django.core.management import BaseCommand
from django.db import OperationalError, connection
from platformpathapp.models import Station, Line, StationLine, Node, Edge, Layer

from typing import Any
# Import individual stations
from platformpathapp.management.stations import st_bay_50_st, st_25_av, _test_station_n_1, _test_station_n_2

class Command(BaseCommand):
    help = 'Seed initial station data'

    def handle(self, *args: Any, **kwargs: Any):
        # clear old data first if any
        self.clear_old_db_data()

        self.stdout.write("Starting database seed...\n")

        # Seed each station
        st_bay_50_st.seed(self.stdout, self.style)
        st_25_av.seed(self.stdout, self.style)

        # NOTE: FOR TESTING PURPOSES... REMOVE LATER!
        _test_station_n_1.seed(self.stdout, self.style)
        _test_station_n_2.seed(self.stdout, self.style)

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
        Layer.objects.all().delete()
        StationLine.objects.all().delete()
        Station.objects.all().delete()
        Line.objects.all().delete()

        self.reset_sequence("platformpathapp_station_lines")
        self.reset_sequence("platformpathapp_node")
        self.reset_sequence("platformpathapp_layer")
        self.reset_sequence("platformpathapp_station_line")
        self.reset_sequence("platformpathapp_station")
        self.reset_sequence("platformpathapp_line")
    
    # to make a true reset of the database (resetting id increments etc), we have to reset all tables within the database we use
    def reset_sequence(self, table_name: str):
        with connection.cursor() as cursor:
            # Determine the database engine to run the correct SQL
            engine = connection.vendor

            if engine == 'postgresql':
                # Resets the sequence to the maximum existing ID + 1
                query = f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM {table_name};"
            elif engine == 'mysql':
                # Resets the auto-increment starting point
                query = f"ALTER TABLE {table_name} AUTO_INCREMENT = 1;"
            elif engine == 'sqlite':
                # Resets the counter in SQLite's internal sequence tracking table
                query = f"UPDATE sqlite_sequence SET seq = 0 WHERE name = '{table_name}';"
            else:
                raise NotImplementedError(f"Unsupported database engine: {engine}")

            cursor.execute(query)

