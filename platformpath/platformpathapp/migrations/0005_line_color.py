from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("platformpathapp", "0004_alter_stationline_line_alter_stationline_station")]

    operations = [
        migrations.AddField(
            model_name="line",
            name="color",
            field=models.CharField(default="", max_length=50),
        ),
    ]
