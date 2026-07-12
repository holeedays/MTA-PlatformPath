from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("platformpathapp", "0005_line_color")]

    operations = [
        migrations.AlterField(
            model_name="line",
            name="name",
            field=models.CharField(max_length=10, unique=True),
        ),
    ]
