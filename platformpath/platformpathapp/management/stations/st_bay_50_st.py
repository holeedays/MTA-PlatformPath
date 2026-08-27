from django.core.management.base import OutputWrapper
from django.core.management.color import Style
from platformpathapp.models import Station, Line, Node, Edge, StationLine, Layer
from platformpathapp.models import NodeTypes

def seed(stdout: OutputWrapper | None = None, style: Style | None = None):
    if stdout and style:
        stdout.write("Seeding Bay 50 St...")

        # 1. Create station
        station = Station.objects.create(
            name="Bay 50 St",
            diagram_path="/static/platformpathapp/diagrams/Bay50.svg",
            diagram_rotated_path="/static/platformpathapp/diagrams/Bay50_rotated.svg",
            accessible_station=False
        )

        # 2. Create line and attach to station
        line_d, _ = Line.objects.get_or_create(name="D")
        StationLine.objects.create(
            station=station,
            line=line_d,
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
            station=station, label="Downtown Platform Head", 
            svg_id="DOWNTOWN PLATFORM HEAD", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.DOWNTOWN_PLATFORM: NodeTypes.DOWNTOWN_PLATFORM.label
            }
        )
        dt_plat_mid = Node.objects.create(
            station=station, label="Downtown Platform Middle", 
            svg_id="DOWNTOWN PLATFORM MIDDLE", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.DOWNTOWN_PLATFORM: NodeTypes.DOWNTOWN_PLATFORM.label
            }
        )
        dt_plat_rear = Node.objects.create(
            station=station, label="Downtown Platform Rear", 
            svg_id="DOWNTOWN PLATFORM REAR", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.DOWNTOWN_PLATFORM: NodeTypes.DOWNTOWN_PLATFORM.label
            }
        )
        stair_dt_to_mezz = Node.objects.create(
            station=station, label="Stairs from Downtown Platform to Mezzanine", 
            svg_id="DOWNTOWN_TO_MEZZ_STAIRS", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.DOWNTOWN_PLATFORM: NodeTypes.DOWNTOWN_PLATFORM.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label
            }
        )
        
        ut_plat_head = Node.objects.create(
            station=station, label="Uptown Platform Head", 
            svg_id="UPTOWN PLATFORM HEAD", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.UPTOWN_PLATFORM: NodeTypes.UPTOWN_PLATFORM.label
            }
        )
        ut_plat_mid = Node.objects.create(
            station=station, label="Uptown Platform Middle", 
            svg_id="UPTOWN PLATFORM MIDDLE", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.UPTOWN_PLATFORM: NodeTypes.UPTOWN_PLATFORM.label
            }
        )
        ut_plat_rear = Node.objects.create(
            station=station, label="Uptown Platform Rear", 
            svg_id="UPTOWN PLATFORM REAR", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.UPTOWN_PLATFORM: NodeTypes.UPTOWN_PLATFORM.label
            }
        )
        stair_ut_to_mezz = Node.objects.create(
            station=station, label="Stairs from Uptown Platform to Mezzanine", 
            svg_id="UPTOWN_TO_MEZZ_STAIRS", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.UPTOWN_PLATFORM: NodeTypes.UPTOWN_PLATFORM.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label
            }
        )

        # --- MEZZANINE LAYER NODES ---
        stair_harway_1 = Node.objects.create(
            station=station, label="Stairs at Harway Av entrance 1", 
            svg_id="HARWAY_AV_STILLWELL_AV_1_STAIRS", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label,
                NodeTypes.EXIT: NodeTypes.EXIT.label
            }
        )
        stair_harway_2 = Node.objects.create(
            station=station, label="Stairs at Harway Av entrance 2", 
            svg_id="HARWAY_AV_STILLWELL_AV_2_STAIRS", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label,
                NodeTypes.EXIT: NodeTypes.EXIT.label
            }
        )
        stair_bay_50_1 = Node.objects.create(
            station=station, label="Stairs at Bay 50 St entrance 1", 
            svg_id="BAY_50_ST_STILLWELL_AV_1_STAIRS", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label,
                NodeTypes.EXIT: NodeTypes.EXIT.label
            }
        )
        stair_bay_50_2 = Node.objects.create(
            station=station, label="Stairs at Bay 50 St entrance 2", 
            svg_id="BAY_50_ST_STILLWELL_AV_2_STAIRS", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label,
                NodeTypes.EXIT: NodeTypes.EXIT.label
            }
        )

        stair_mezz_to_ut = Node.objects.create(
            station=station, label="Mezzanine Stairs to Uptown Platform", 
            svg_id="MEZZ_TO_UPTOWN_STAIRS", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label
            }
        )
        stair_mezz_to_dt = Node.objects.create(
            station=station, label="Mezzanine Stairs to Downtown Platform", 
            svg_id="MEZZ_TO_DOWNTOWN_STAIRS", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label
            }
        )

        mezz_ut = Node.objects.create(
            station=station, label="Mezzanine Uptown Area", 
            svg_id="MEZZANINE UPTOWN", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )
        mezz_ut_harway_exit = Node.objects.create(
            station=station, label="Mezzanine Uptown Harway Av Exit",
            svg_id="MEZZANINE UPTOWN HARWAY EXIT", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )
        mezz_ut_bay_50_exit = Node.objects.create(
            station=station, label="Mezzanine Uptown Bay 50 Exit",
            svg_id="MEZZANINE UPTOWN BAY 50 EXIT", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        ) 
        mezz_dt = Node.objects.create(
            station=station, label="Mezzanine Downtown Area", 
            svg_id="MEZZANINE DOWNTOWN", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )
        mezz_dt_harway_exit = Node.objects.create(
            station=station, label="Mezzanine Downtown Harway Av Exit",
            svg_id="MEZZANINE DOWNTOWN HARWAY EXIT", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )
        mezz_dt_bay_50_exit = Node.objects.create(
            station=station, label="Mezzanine Downtown Bay 50 Exit",
            svg_id="MEZZANINE DOWNTOWN BAY 50 EXIT", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        ) 
        mezz_central = Node.objects.create(
            station=station, label="Mezzanine Central Area", 
            svg_id="MEZZANINE CENTRAL", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )
        mezz_booth = Node.objects.create(
            station=station, label="Mezzanine Central Booth", 
            svg_id="MEZZANINE CENTRAL BOOTH", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict = {
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )

        # 5. Create Edges
        edges_data = [
                    # Downtown Platform Chain (Rear <-> Middle <-> Head <-> Stairs)
                    (dt_plat_rear, dt_plat_mid, "Walk towards the middle of the platform", "NONE"),
                    (dt_plat_mid, dt_plat_rear, "Walk towards the rear of the platform", "NONE"),
                    
                    (dt_plat_mid, dt_plat_head, "Walk towards the head of the platform", "NONE"),
                    (dt_plat_head, dt_plat_mid, "Walk towards the middle of the platform", "NONE"),
                    
                    (dt_plat_head, stair_dt_to_mezz, "Approach the stairs leading to the mezzanine", "NONE"),
                    (stair_dt_to_mezz, dt_plat_head, "Step off the stairs onto the head of the platform", "NONE"),
                    
                    (stair_dt_to_mezz, stair_mezz_to_dt, "Take the stairs down to the mezzanine", "DOWN"),
                    (stair_mezz_to_dt, stair_dt_to_mezz, "Take the stairs up to the downtown platform", "UP"),
                    
                    (stair_mezz_to_dt, mezz_dt, "Step off the stairs into the mezzanine", "NONE"),
                    (mezz_dt, stair_mezz_to_dt, "Approach the stairs to the downtown platform", "NONE"),
                    
                    (mezz_dt, mezz_central, "Walk towards the central mezzanine", "NONE"),
                    (mezz_central, mezz_dt, "Walk towards the downtown exit", "NONE"),
                    
                    # Uptown Platform Chain (Head <-> Middle <-> Rear <-> Stairs)
                    (ut_plat_head, ut_plat_mid, "Walk towards the middle of the platform", "NONE"),
                    (ut_plat_mid, ut_plat_head, "Walk towards the head of the platform", "NONE"),
                    
                    (ut_plat_mid, ut_plat_rear, "Walk towards the rear of the platform", "NONE"),
                    (ut_plat_rear, ut_plat_mid, "Walk towards the middle of the platform", "NONE"),
                    
                    (ut_plat_rear, stair_ut_to_mezz, "Approach the stairs leading to the mezzanine", "NONE"),
                    (stair_ut_to_mezz, ut_plat_rear, "Step off the stairs onto the rear of the platform", "NONE"),
                    
                    (stair_ut_to_mezz, stair_mezz_to_ut, "Take the stairs down to the mezzanine", "DOWN"),
                    (stair_mezz_to_ut, stair_ut_to_mezz, "Take the stairs up to the uptown platform", "UP"),
                    
                    (stair_mezz_to_ut, mezz_ut, "Step off the stairs into the mezzanine", "NONE"),
                    (mezz_ut, stair_mezz_to_ut, "Approach the stairs to the uptown platform", "NONE"),
                    
                    (mezz_ut, mezz_central, "Walk towards the central mezzanine", "NONE"),
                    (mezz_central, mezz_ut, "Walk towards the uptown exit", "NONE"),

                    # Mezzanine Core Routing
                    (mezz_central, mezz_booth, "Walk towards the station booth", "NONE"),
                    (mezz_booth, mezz_central, "Walk towards the center of the mezzanine", "NONE"),
                    
                    (mezz_booth, mezz_ut_harway_exit, "Head towards the uptown exit gates", "NONE"),
                    (mezz_ut_harway_exit, mezz_booth, "Head towards the station booth", "NONE"),
                    
                    (mezz_booth, mezz_dt_harway_exit, "Head towards the downtown exit gates", "NONE"),
                    (mezz_dt_harway_exit, mezz_booth, "Head towards the station booth", "NONE"),

                    # Street Exit Chains
                    # Uptown Harway Exit <-> Harway Av 2
                    (stair_harway_2, mezz_ut_harway_exit, "Take the stairs up to the uptown Harway exit area", "UP"),
                    (mezz_ut_harway_exit, stair_harway_2, "Take the stairs down to the Harway Av entrance 2", "DOWN"),

                    # Uptown Harway Exit <-> Uptown Bay 50 Exit
                    (mezz_ut_harway_exit, mezz_ut_bay_50_exit, "Walk towards the uptown Bay 50 exit area", "NONE"),
                    (mezz_ut_bay_50_exit, mezz_ut_harway_exit, "Walk towards the uptown Harway exit area", "NONE"),
                    
                    # Uptown Bay 50 Exit <-> Bay 50 St 2
                    (stair_bay_50_2, mezz_ut_bay_50_exit, "Take the stairs up to the uptown Bay 50 exit area", "UP"),
                    (mezz_ut_bay_50_exit, stair_bay_50_2, "Take the stairs down to the Bay 50 St entrance 2", "DOWN"),
                    
                    # Downtown Harway Exit <-> Harway Av 1
                    (stair_harway_1, mezz_dt_harway_exit, "Take the stairs up to the downtown Harway exit area", "UP"),
                    (mezz_dt_harway_exit, stair_harway_1, "Take the stairs down to the Harway Av entrance 1", "DOWN"),

                    # Downtown Harway Exit <-> Downtown Bay 50 Exit
                    (mezz_dt_harway_exit, mezz_dt_bay_50_exit, "Walk towards the downtown Bay 50 exit area", "NONE"),
                    (mezz_dt_bay_50_exit, mezz_dt_harway_exit, "Walk towards the downtown Harway exit area", "NONE"),
                    
                    # Downtown Bay 50 Exit <-> Bay 50 St 1
                    (stair_bay_50_1, mezz_dt_bay_50_exit, "Take the stairs up to the downtown Bay 50 exit area", "UP"),
                    (mezz_dt_bay_50_exit, stair_bay_50_1, "Take the stairs down to the Bay 50 St entrance 1", "DOWN"),
        ]

        for from_n, to_n, instruction, vertical_direction in edges_data:
            Edge.objects.create(
                station=station,
                from_node=from_n,
                to_node=to_n,
                instruction=instruction,
                vertical_direction=vertical_direction,
                is_active=True,
            )

        stdout.write(style.SUCCESS("Successfully seeded updated Bay 50 St station!"))