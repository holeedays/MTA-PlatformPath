from django.core.management.base import OutputWrapper
from django.core.management.color import Style
from platformpathapp.models import Station, Line, Node, Edge, StationLine, Layer

def seed(stdout: OutputWrapper | None = None, style: Style | None = None):
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

        # 3. Create Layers
        layer_platforms = Layer.objects.create(
            name="PLATFORMS",
            layerOrder=1,
            color="#C8E6FF",
            station=station,
            svg_id="PLATFORMS"
        )

        layer_mezzanine = Layer.objects.create(
            name="MEZZANINE",
            layerOrder=2,
            color="#B4F8CA",
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
        stair_ne = Node.objects.create(
            station=station, node_type="stair", label="Stairs at NE corner", 
            svg_id="25_AV_86_ST_NE_STAIRS", layer=layer_mezzanine, is_accessible=False
        )
        stair_nw = Node.objects.create(
            station=station, node_type="stair", label="Stairs at NW corner", 
            svg_id="25_AV_86_ST_NW_STAIRS", layer=layer_mezzanine, is_accessible=False
        )
        stair_sw = Node.objects.create(
            station=station, node_type="stair", label="Stairs at SW corner", 
            svg_id="25_AV_86_ST_SW_STAIRS", layer=layer_mezzanine, is_accessible=False
        )
        stair_se = Node.objects.create(
            station=station, node_type="stair", label="Stairs at SE corner", 
            svg_id="25_AV_86_ST_SE_STAIRS", layer=layer_mezzanine, is_accessible=False
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
            # Downtown Platform Chain
            (dt_plat_head, dt_plat_mid, "Walk towards the middle of the platform", "Walk towards the head of the platform"),
            (dt_plat_mid, dt_plat_rear, "Walk towards the rear of the platform", "Walk towards the middle of the platform"),
            (dt_plat_rear, stair_dt_to_mezz, "Approach the stairs leading to the mezzanine", "Step off the stairs onto the rear of the platform"),
            (stair_dt_to_mezz, stair_mezz_to_dt, "Take the stairs down to the mezzanine", "Take the stairs up to the downtown platform"),
            (stair_mezz_to_dt, mezz_dt, "Step off the stairs into the downtown mezzanine", "Approach the stairs to the downtown platform"),
            (mezz_dt, mezz_central, "Walk towards the central mezzanine", "Walk towards the downtown exit"),

            # Uptown Platform Chain
            (ut_plat_rear, ut_plat_mid, "Walk towards the middle of the platform", "Walk towards the rear of the platform"),
            (ut_plat_mid, ut_plat_head, "Walk towards the head of the platform", "Walk towards the middle of the platform"),
            (ut_plat_head, stair_ut_to_mezz, "Approach the stairs leading to the mezzanine", "Step off the stairs onto the head of the platform"),
            (stair_ut_to_mezz, stair_mezz_to_ut, "Take the stairs down to the mezzanine", "Take the stairs up to the uptown platform"),
            (stair_mezz_to_ut, mezz_ut, "Step off the stairs into the uptown mezzanine", "Approach the stairs to the uptown platform"),
            (mezz_ut, mezz_central, "Walk towards the central mezzanine", "Walk towards the uptown exit"),

            # Mezzanine Core Routing
            (mezz_central, mezz_booth, "Walk towards the station booth", "Walk towards the center of the mezzanine"),
            (mezz_booth, mezz_ut_exit, "Head towards the uptown exit gates", "Head towards the station booth"),
            (mezz_booth, mezz_dt_exit, "Head towards the downtown exit gates", "Head towards the station booth"),

            # Street Exit Chains
            (stair_se, mezz_ut_exit, "Take the stairs down to the uptown exit area", "Take the stairs up to the SE corner street level"),
            (mezz_ut_exit, stair_ne, "Take the stairs up to the NE corner street level", "Take the stairs down to the uptown exit area"),
            
            (stair_sw, mezz_dt_exit, "Take the stairs down to the downtown exit area", "Take the stairs up to the SW corner street level"),
            (mezz_dt_exit, stair_nw, "Take the stairs up to the NW corner street level", "Take the stairs down to the downtown exit area"),
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
            stdout.write(style.SUCCESS("Successfully seeded updated 25 Av station!"))