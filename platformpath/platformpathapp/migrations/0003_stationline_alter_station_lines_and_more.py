import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("platformpathapp", "0002_node_is_accessible")]

    operations = [
        migrations.CreateModel(
            name="StationLine",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("order", models.IntegerField()),
                ("line", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="platformpathapp.line")),
                ("station", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="platformpathapp.station")),
            ],
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterField(
                    model_name="station",
                    name="lines",
                    field=models.ManyToManyField(blank=True, through="platformpathapp.StationLine", to="platformpathapp.line"),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="stationline",
            constraint=models.UniqueConstraint(fields=("station", "line"), name="unique_station_line"),
        ),
        migrations.AddConstraint(
            model_name="stationline",
            constraint=models.UniqueConstraint(fields=("line", "order"), name="unique_line_order"),
        ),
    ]
