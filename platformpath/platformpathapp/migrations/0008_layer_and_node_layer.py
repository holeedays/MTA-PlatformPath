import django.db.models.deletion
from django.db import migrations, models


def convert_node_layers(apps, schema_editor):
    Node = apps.get_model("platformpathapp", "Node")
    Layer = apps.get_model("platformpathapp", "Layer")

    layers = {}
    for node in Node.objects.order_by("station_id", "layer", "id"):
        key = (node.station_id, node.layer)
        if key not in layers:
            layers[key] = Layer.objects.create(
                station_id=node.station_id,
                name=node.layer,
                layerOrder=len([k for k in layers if k[0] == node.station_id]),
                color="#000000",
                svg_id=node.layer,
            )
        node.layer = str(layers[key].id)
        node.save(update_fields=["layer"])


class Migration(migrations.Migration):
    dependencies = [("platformpathapp", "0007_line_slug_name_station_slug_name")]

    operations = [
        migrations.CreateModel(
            name="Layer",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)),
                ("layerOrder", models.IntegerField()),
                ("color", models.CharField(max_length=7)),
                ("svg_id", models.CharField(max_length=100)),
                ("station", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="platformpathapp.station")),
            ],
        ),
        migrations.RunPython(convert_node_layers, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="node",
            name="layer",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="platformpathapp.layer"),
        ),
    ]
