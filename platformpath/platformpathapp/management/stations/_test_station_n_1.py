from django.core.management.base import OutputWrapper
from django.core.management.color import Style
from platformpathapp.models import Station, Line, Node, Edge, StationLine, Layer

def seed(stdout: OutputWrapper | None = None, style: Style | None = None):
    if stdout and style:
        stdout.write("Seeding Test Station 1...")

        # 1. Create station
        station = Station.objects.create(
            name="Test Station 1",
            diagram_path="/static/platformpathapp/diagrams/Bay50.svg"
        )

        # 2. Create line and attach to station
        line_n, _ = Line.objects.get_or_create(name="N")
        StationLine.objects.create(
            station=station,
            line=line_n,
            order=1
        )

        # 3. Create Layers
        layer_platforms = Layer.objects.create(
            name="PLATFORMS",
            layerOrder=1,
            color="#00C8FF",
            station=station,
            svg_id="PLATFORMS"
        )

        layer_mezzanine = Layer.objects.create(
            name="MEZZANINE",
            layerOrder=2,
            color="#00FF73",
            station=station,
            svg_id="MEZZANINE"
        )

        # 4. Create Nodes

        # --- PLATFORM LAYER NODES ---
        dt_plat_head = Node.objects.create(
            station=station, node_type="platform", label="Downtown Platform Head", 
            svg_id="DOWNTOWN PLATFORM HEAD", layer=layer_platforms, is_accessible=False
        )
        dt_plat_mid = Node.objects.create(
            station=station, node_type="platform", label="Downtown Platform Middle", 
            svg_id="DOWNTOWN PLATFORM MIDDLE", layer=layer_platforms, is_accessible=False
        )
        dt_plat_rear = Node.objects.create(
            station=station, node_type="platform", label="Downtown Platform Rear", 
            svg_id="DOWNTOWN PLATFORM REAR", layer=layer_platforms, is_accessible=False
        )
        stair_dt_to_mezz = Node.objects.create(
            station=station, node_type="stair", label="Stairs from Downtown Platform to Mezzanine", 
            svg_id="DOWNTOWN_TO_MEZZ_STAIRS", layer=layer_platforms, is_accessible=False
        )
        
        ut_plat_head = Node.objects.create(
            station=station, node_type="platform", label="Uptown Platform Head", 
            svg_id="UPTOWN PLATFORM HEAD", layer=layer_platforms, is_accessible=False
        )
        ut_plat_mid = Node.objects.create(
            station=station, node_type="platform", label="Uptown Platform Middle", 
            svg_id="UPTOWN PLATFORM MIDDLE", layer=layer_platforms, is_accessible=False
        )
        ut_plat_rear = Node.objects.create(
            station=station, node_type="platform", label="Uptown Platform Rear", 
            svg_id="UPTOWN PLATFORM REAR", layer=layer_platforms, is_accessible=False
        )
        stair_ut_to_mezz = Node.objects.create(
            station=station, node_type="stair", label="Stairs from Uptown Platform to Mezzanine", 
            svg_id="UPTOWN_TO_MEZZ_STAIRS", layer=layer_platforms, is_accessible=False
        )

        # --- MEZZANINE LAYER NODES ---
        stair_harway_1 = Node.objects.create(
            station=station, node_type="stair", label="Stairs at Harway Av entrance 1", 
            svg_id="HARWAY_AV_STILLWELL_AV_1_STAIRS", layer=layer_mezzanine, is_accessible=False
        )
        stair_harway_2 = Node.objects.create(
            station=station, node_type="stair", label="Stairs at Harway Av entrance 2", 
            svg_id="HARWAY_AV_STILLWELL_AV_2_STAIRS", layer=layer_mezzanine, is_accessible=False
        )
        stair_bay_50_1 = Node.objects.create(
            station=station, node_type="stair", label="Stairs at Bay 50 St entrance 1", 
            svg_id="BAY_50_ST_STILLWELL_AV_1_STAIRS", layer=layer_mezzanine, is_accessible=False
        )
        stair_bay_50_2 = Node.objects.create(
            station=station, node_type="stair", label="Stairs at Bay 50 St entrance 2", 
            svg_id="BAY_50_ST_STILLWELL_AV_2_STAIRS", layer=layer_mezzanine, is_accessible=False
        )

        stair_mezz_to_ut = Node.objects.create(
            station=station, node_type="stair", label="Mezzanine Stairs to Uptown Platform", 
            svg_id="MEZZ_TO_UPTOWN_STAIRS", layer=layer_mezzanine, is_accessible=False
        )
        stair_mezz_to_dt = Node.objects.create(
            station=station, node_type="stair", label="Mezzanine Stairs to Downtown Platform", 
            svg_id="MEZZ_TO_DOWNTOWN_STAIRS", layer=layer_mezzanine, is_accessible=False
        )

        mezz_ut = Node.objects.create(
            station=station, node_type="mezzanine", label="Mezzanine Uptown Area", 
            svg_id="MEZZANINE UPTOWN", layer=layer_mezzanine, is_accessible=False
        )
        mezz_ut_exit = Node.objects.create(
            station=station, node_type="mezzanine", label="Mezzanine Uptown Exit", 
            svg_id="MEZZANINE UPTOWN EXIT", layer=layer_mezzanine, is_accessible=False
        )
        mezz_dt = Node.objects.create(
            station=station, node_type="mezzanine", label="Mezzanine Downtown Area", 
            svg_id="MEZZANINE DOWNTOWN", layer=layer_mezzanine, is_accessible=False
        )
        mezz_dt_exit = Node.objects.create(
            station=station, node_type="mezzanine", label="Mezzanine Downtown Exit", 
            svg_id="MEZZANINE DOWNTOWN EXIT", layer=layer_mezzanine, is_accessible=False
        )
        mezz_central = Node.objects.create(
            station=station, node_type="mezzanine", label="Mezzanine Central Area", 
            svg_id="MEZZANINE CENTRAL", layer=layer_mezzanine, is_accessible=False
        )
        mezz_booth = Node.objects.create(
            station=station, node_type="mezzanine", label="Mezzanine Central Booth", 
            svg_id="MEZZANINE CENTRAL BOOTH", layer=layer_mezzanine, is_accessible=False
        )

        # 5. Create Edges
        edges_data = [
            # Downtown Platform Chain (Rear -> Middle -> Head -> Stairs)
            (dt_plat_rear, dt_plat_mid, "Walk towards the middle of the platform", "Walk towards the rear of the platform"),
            (dt_plat_mid, dt_plat_head, "Walk towards the head of the platform", "Walk towards the middle of the platform"),
            (dt_plat_head, stair_dt_to_mezz, "Approach the stairs leading to the mezzanine", "Step off the stairs onto the head of the platform"),
            (stair_dt_to_mezz, stair_mezz_to_dt, "Take the stairs down to the mezzanine", "Take the stairs up to the downtown platform"),
            (stair_mezz_to_dt, mezz_central, "Step off the stairs into the central mezzanine", "Approach the stairs to the downtown platform"),
            
            # Uptown Platform Chain (Head -> Middle -> Rear -> Stairs)
            (ut_plat_head, ut_plat_mid, "Walk towards the middle of the platform", "Walk towards the head of the platform"),
            (ut_plat_mid, ut_plat_rear, "Walk towards the rear of the platform", "Walk towards the middle of the platform"),
            (ut_plat_rear, stair_ut_to_mezz, "Approach the stairs leading to the mezzanine", "Step off the stairs onto the rear of the platform"),
            (stair_ut_to_mezz, stair_mezz_to_ut, "Take the stairs down to the mezzanine", "Take the stairs up to the uptown platform"),
            (stair_mezz_to_ut, mezz_central, "Step off the stairs into the central mezzanine", "Approach the stairs to the uptown platform"),

            # Mezzanine Core Routing
            (mezz_central, mezz_booth, "Walk towards the station booth", "Walk towards the center of the mezzanine"),
            (mezz_booth, mezz_ut_exit, "Head towards the uptown exit gates", "Head towards the station booth"),
            (mezz_booth, mezz_dt_exit, "Head towards the downtown exit gates", "Head towards the station booth"),

            # Street Exit Chains
            # Bay 50 St 2 <-> Uptown Exit <-> Harway Av 2
            (stair_bay_50_2, mezz_ut_exit, "Take the stairs down to the uptown exit area", "Take the stairs up to the Bay 50 St entrance 2"),
            (mezz_ut_exit, stair_harway_2, "Take the stairs up to the Harway Av entrance 2", "Take the stairs down to the uptown exit area"),
            
            # Bay 50 St 1 <-> Downtown Exit <-> Harway Av 1
            (stair_bay_50_1, mezz_dt_exit, "Take the stairs down to the downtown exit area", "Take the stairs up to the Bay 50 St entrance 1"),
            (mezz_dt_exit, stair_harway_1, "Take the stairs up to the Harway Av entrance 1", "Take the stairs down to the downtown exit area"),
        ]

        for from_n, to_n, instr_fwd, instr_bwd in edges_data:
            Edge.objects.create(
                station=station,
                from_node=from_n,
                to_node=to_n,
                instruction_forward=instr_fwd,
                instruction_backward=instr_bwd,
                is_active=True
            )

        if stdout and style:
            stdout.write(style.SUCCESS("Successfully seeded updated Bay 50 St station!"))