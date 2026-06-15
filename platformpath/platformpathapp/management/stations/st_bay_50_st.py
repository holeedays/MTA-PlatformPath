from django.core.management.base import OutputWrapper # for type hint checks
from django.core.management.color import Style # for type hint checks
from platformpathapp.models import Station, Line, StationLine, Node, Edge


def seed(stdout: OutputWrapper | None=None, style: Style | None=None):
    if stdout and style:
        stdout.write("Seeding Bay 50 St...")

        # 1. Create station
        station = Station.objects.create(
            name="Bay 50 St",
            diagram_path="/static/platformpathapp/diagrams/Bay50.svg"
        )

        # 2. Create line and attach to station with through metadata
        line_d, _ = Line.objects.get_or_create(name="D")
        # no more doing station.add(line)... create the through object to establish the M2M relationship
        StationLine.objects.create(
            station=station,
            line=line_d,
            order=1
        )

        # 3. Create nodes
        # Street Level Stairs (Exits/Entrances)
        stair_harway_1 = Node.objects.create(
            station=station,
            node_type="stair",
            label="Stairs at Harway Av entrance",
            svg_id="HARWAY_AV_STILLWELL_AV_1_STAIRS",
            layer="MEZZANINE",
            is_accessible=False
        )
        stair_harway_2 = Node.objects.create(
            station=station,
            node_type="stair",
            label="Stairs at Harway Av entrance",
            svg_id="HARWAY_AV_STILLWELL_AV_2_STAIRS",
            layer="MEZZANINE",
            is_accessible=False
        )
        stair_bay_50_1 = Node.objects.create(
            station=station,
            node_type="stair",
            label="Stairs at Bay 50 St entrance",
            svg_id="BAY_50_ST_STILLWELL_AV_1_STAIRS",
            layer="MEZZANINE",
            is_accessible=False
        )
        stair_bay_50_2 = Node.objects.create(
            station=station,
            node_type="stair",
            label="Stairs at Bay 50 St entrance",
            svg_id="BAY_50_ST_STILLWELL_AV_2_STAIRS",
            layer="MEZZANINE",
            is_accessible=False
        )

        # Mezzanine level
        mezz_main = Node.objects.create(
            station=station,
            node_type="mezzanine",
            label="Main Mezzanine",
            svg_id="MEZZANINE",
            layer="MEZZANINE",
            is_accessible=False
        )

        # Stairs connecting mezzanine to platforms
        stair_mezz_to_uptown = Node.objects.create(
            station=station,
            node_type="stair",
            label="Stairs to downtown platform", # Note: Kept exact label from JS
            svg_id="MEZZ_TO_UPTOWN_STAIRS",
            layer="MEZZANINE",
            is_accessible=False
        )
        stair_mezz_to_downtown = Node.objects.create(
            station=station,
            node_type="stair",
            label="Stairs to uptown platform", # Note: Kept exact label from JS
            svg_id="MEZZ_TO_DOWNTOWN_STAIRS",
            layer="MEZZANINE",
            is_accessible=False
        )

        # Stairs connecting platforms to mezzanine
        stair_uptown_to_mezz = Node.objects.create(
            station=station,
            node_type="stair",
            label="Stairs from uptown platform to mezzanine",
            svg_id="UPTOWN_TO_MEZZ_STAIRS",
            layer="UPTOWN PLATFORM",
            is_accessible=False
        )
        stair_downtown_to_mezz = Node.objects.create(
            station=station,
            node_type="stair",
            label="Stairs from downtown platform to mezzanine",
            svg_id="DOWNTOWN_TO_MEZZ_STAIRS",
            layer="DOWNTOWN PLATFORM",
            is_accessible=False
        )

        # Platform level
        platform_downtown = Node.objects.create(
            station=station,
            node_type="platform",
            label="Downtown D Platform",
            svg_id="DOWNTOWN PLATFORM",
            layer="DOWNTOWN PLATFORM",
            is_accessible=False
        )
        platform_uptown = Node.objects.create(
            station=station,
            node_type="platform",
            label="Uptown D Platform",
            svg_id="UPTOWN PLATFORM",
            layer="UPTOWN PLATFORM",
            is_accessible=False
        )

        # 4. Create edges (Paired from JS directed edges into bidirectional model)
        # --- Entrances to Mezzanine ---
        Edge.objects.create(
            station=station,
            from_node=stair_harway_1,
            to_node=mezz_main,
            instruction_forward="Take the stairs up to the mezzanine level",
            instruction_backward="Take the stairs down to the Harway Av exit",
            is_active=True
        )
        Edge.objects.create(
            station=station,
            from_node=stair_harway_2,
            to_node=mezz_main,
            instruction_forward="Take the stairs up to the mezzanine level",
            instruction_backward="Take the stairs down to the Harway Av exit",
            is_active=True
        )
        Edge.objects.create(
            station=station,
            from_node=stair_bay_50_1,
            to_node=mezz_main,
            instruction_forward="Take the stairs up to the mezzanine level",
            instruction_backward="Take the stairs down to the Bay 50 St exit",
            is_active=True
        )
        Edge.objects.create(
            station=station,
            from_node=stair_bay_50_2,
            to_node=mezz_main,
            instruction_forward="Take the stairs up to the mezzanine level",
            instruction_backward="Take the stairs down to the Bay 50 St exit",
            is_active=True
        )

        # --- Mezzanine to Downtown Platform ---
        Edge.objects.create(
            station=station,
            from_node=mezz_main,
            to_node=stair_mezz_to_downtown,
            instruction_forward="Head to the downtown staircase on the mezzanine",
            instruction_backward="Step off the stairs onto the main mezzanine",
            is_active=True
        )
        Edge.objects.create(
            station=station,
            from_node=stair_mezz_to_downtown,
            to_node=stair_downtown_to_mezz,
            instruction_forward="Take the stairs up to the downtown platform",
            instruction_backward="Take the stairs down to the mezzanine level",
            is_active=True
        )
        Edge.objects.create(
            station=station,
            from_node=stair_downtown_to_mezz,
            to_node=platform_downtown,
            instruction_forward="Step off the stairs onto the downtown platform",
            instruction_backward="Head to the stairs on the downtown platform",
            is_active=True
        )

        # --- Mezzanine to Uptown Platform ---
        Edge.objects.create(
            station=station,
            from_node=mezz_main,
            to_node=stair_mezz_to_uptown,
            instruction_forward="Head to the uptown staircase on the mezzanine",
            instruction_backward="Step off the stairs onto the main mezzanine",
            is_active=True
        )
        Edge.objects.create(
            station=station,
            from_node=stair_mezz_to_uptown,
            to_node=stair_uptown_to_mezz,
            instruction_forward="Take the stairs up to the uptown platform",
            instruction_backward="Take the stairs down to the mezzanine level",
            is_active=True
        )
        Edge.objects.create(
            station=station,
            from_node=stair_uptown_to_mezz,
            to_node=platform_uptown,
            instruction_forward="Step off the stairs onto the uptown platform",
            instruction_backward="Head to the stairs on the uptown platform",
            is_active=True
        )

        if stdout and style:
            stdout.write(style.SUCCESS("Successfully seeded Bay 50 St!"))
