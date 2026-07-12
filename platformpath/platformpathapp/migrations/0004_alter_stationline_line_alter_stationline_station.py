import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("platformpathapp", "0003_stationline_alter_station_lines_and_more")]

    operations = [
        migrations.AlterField(
            model_name="stationline",
            name="line",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="line_station", to="platformpathapp.line"),
        ),
        migrations.AlterField(
            model_name="stationline",
            name="station",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="station_line", to="platformpathapp.station"),
        ),
    ]
