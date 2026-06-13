from platformpathapp.models import Station, Line, Node, Edge, StationLine

def seed(stdout=None, style=None):
    if stdout and style:
        stdout.write("Seeding 25 Av...")

        # 1. Create station
        station = Station.objects.create(
            name="25 Av",
            diagram_path="/static/platformpathapp/diagrams/25Av.svg"
        )

        # 2. Create line and attach to station
        line_d, _ = Line.objects.get_or_create(name="D")
        StationLine.objects.create(
            station=station,
            line=line_d,
            order=2
        )

        # 3. Create nodes
        # --- Street Level Stairs (Exits/Entrances) ---
        stair_se = Node.objects.create(
            station=station,
            node_type="stair",
            label="Stairs at SE corner of 25th Av and 86th St",
            svg_id="25_AV_86_ST_SE_STAIRS",
            layer="MEZZANINE",
            is_accessible=False
        )
        stair_sw = Node.objects.create(
            station=station,
            node_type="stair",
            label="Stairs at SW corner of 25th Av and 86th St",
            svg_id="25_AV_86_ST_SW_STAIRS",
            layer="MEZZANINE",
            is_accessible=False
        )
        stair_ne = Node.objects.create(
            station=station,
            node_type="stair",
            label="Stairs at NE corner of 25th Av and 86th St",
            svg_id="25_AV_86_ST_NE_STAIRS",
            layer="MEZZANINE",
            is_accessible=False
        )
        stair_nw = Node.objects.create(
            station=station,
            node_type="stair",
            label="Stairs at NW corner of 25th Av and 86th St",
            svg_id="25_AV_86_ST_NW_STAIRS",
            layer="MEZZANINE",
            is_accessible=False
        )

        # --- Mezzanine level ---
        mezz_main = Node.objects.create(
            station=station,
            node_type="mezzanine",
            label="Main Mezzanine",
            svg_id="MEZZANINE",
            layer="MEZZANINE",
            is_accessible=False
        )

        # --- Stairs connecting mezzanine to platforms ---
        stair_mezz_to_downtown = Node.objects.create(
            station=station,
            node_type="stair",
            label="Stairs to downtown platform",
            svg_id="MEZZ_TO_DOWNTOWN_STAIRS",
            layer="MEZZANINE",
            is_accessible=False
        )
        stair_mezz_to_uptown = Node.objects.create(
            station=station,
            node_type="stair",
            label="Stairs to uptown platform",
            svg_id="MEZZ_TO_UPTOWN_STAIRS",
            layer="MEZZANINE",
            is_accessible=False
        )

        # --- Stairs connecting platforms to mezzanine ---
        stair_downtown_to_mezz = Node.objects.create(
            station=station,
            node_type="stair",
            label="Stairs from downtown platform to mezzanine",
            svg_id="DOWNTOWN_TO_MEZZ_STAIRS",
            layer="DOWNTOWN PLATFORM",
            is_accessible=False
        )
        stair_uptown_to_mezz = Node.objects.create(
            station=station,
            node_type="stair",
            label="Stairs from uptown platform to mezzanine",
            svg_id="UPTOWN_TO_MEZZ_STAIRS",
            layer="UPTOWN PLATFORM",
            is_accessible=False
        )

        # --- Platform level ---
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

        # 4. Create edges (Paired directed edges into bidirectional model)
        # --- Entrances to Mezzanine ---
        Edge.objects.create(
            station=station,
            from_node=stair_se,
            to_node=mezz_main,
            instruction_forward="Take the stairs up to the mezzanine level",
            instruction_backward="Take the stairs down to the SE corner of 25th Av and 86th St",
            is_active=True
        )
        Edge.objects.create(
            station=station,
            from_node=stair_sw,
            to_node=mezz_main,
            instruction_forward="Take the stairs up to the mezzanine level",
            instruction_backward="Take the stairs down to the SW corner of 25th Av and 86th St",
            is_active=True
        )
        Edge.objects.create(
            station=station,
            from_node=stair_ne,
            to_node=mezz_main,
            instruction_forward="Take the stairs up to the mezzanine level",
            instruction_backward="Take the stairs down to the NE corner of 25th Av and 86th St",
            is_active=True
        )
        Edge.objects.create(
            station=station,
            from_node=stair_nw,
            to_node=mezz_main,
            instruction_forward="Take the stairs up to the mezzanine level",
            instruction_backward="Take the stairs down to the NW corner of 25th Av and 86th St",
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
            stdout.write(style.SUCCESS("Successfully seeded 25 Av!"))