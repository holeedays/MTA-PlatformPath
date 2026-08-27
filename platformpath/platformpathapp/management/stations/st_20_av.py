from django.core.management.base import OutputWrapper
from django.core.management.color import Style
from platformpathapp.models import Station, Line, Node, Edge, StationLine, Layer
from platformpathapp.models import NodeTypes

def seed(stdout: OutputWrapper | None = None, style: Style | None = None):
    if stdout and style:
        stdout.write("Seeding 20 Av...")

        # 1. Create station
        station = Station.objects.create(
            name="20 Av",
            diagram_path="/static/platformpathapp/diagrams/20Av.svg",
            diagram_rotated_path="/static/platformpathapp/diagrams/20Av_rotated.svg",
            accessible_station=False
        )

        # 2. Create line and attach to station
        line_d, _ = Line.objects.get_or_create(name="D")
        StationLine.objects.create(
            station=station,
            line=line_d,
            order=4
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
            types_dict={NodeTypes.DOWNTOWN_PLATFORM: NodeTypes.DOWNTOWN_PLATFORM.label}
        )
        dt_plat_mid = Node.objects.create(
            station=station, label="Downtown Platform Middle", 
            svg_id="DOWNTOWN PLATFORM MIDDLE", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={NodeTypes.DOWNTOWN_PLATFORM: NodeTypes.DOWNTOWN_PLATFORM.label}
        )
        dt_plat_rear = Node.objects.create(
            station=station, label="Downtown Platform Rear", 
            svg_id="DOWNTOWN PLATFORM REAR", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={NodeTypes.DOWNTOWN_PLATFORM: NodeTypes.DOWNTOWN_PLATFORM.label}
        )
        stair_dt_to_mezz_1 = Node.objects.create(
            station=station, label="Downtown to Mezzanine Stairs 1", 
            svg_id="DOWNTOWN_TO_MEZZ_STAIRS_1", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={NodeTypes.DOWNTOWN_PLATFORM: NodeTypes.DOWNTOWN_PLATFORM.label, NodeTypes.STAIRS: NodeTypes.STAIRS.label}
        )
        stair_dt_to_mezz_2 = Node.objects.create(
            station=station, label="Downtown to Mezzanine Stairs 2", 
            svg_id="DOWNTOWN_TO_MEZZ_STAIRS_2", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={NodeTypes.DOWNTOWN_PLATFORM: NodeTypes.DOWNTOWN_PLATFORM.label, NodeTypes.STAIRS: NodeTypes.STAIRS.label}
        )
        
        ut_plat_head = Node.objects.create(
            station=station, label="Uptown Platform Head", 
            svg_id="UPTOWN PLATFORM HEAD", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={NodeTypes.UPTOWN_PLATFORM: NodeTypes.UPTOWN_PLATFORM.label}
        )
        ut_plat_mid = Node.objects.create(
            station=station, label="Uptown Platform Middle", 
            svg_id="UPTOWN PLATFORM MIDDLE", layer=layer_platforms, is_accessible_infrastructure=False, 
            types_dict={NodeTypes.UPTOWN_PLATFORM: NodeTypes.UPTOWN_PLATFORM.label}
        )
        ut_plat_rear = Node.objects.create(
            station=station, label="Uptown Platform Rear", 
            svg_id="UPTOWN PLATFORM REAR", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={NodeTypes.UPTOWN_PLATFORM: NodeTypes.UPTOWN_PLATFORM.label}
        )
        stair_ut_to_mezz_1 = Node.objects.create(
            station=station, label="Uptown to Mezzanine Stairs 1", 
            svg_id="UPTOWN_TO_MEZZ_STAIRS_1", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={NodeTypes.UPTOWN_PLATFORM: NodeTypes.UPTOWN_PLATFORM.label, NodeTypes.STAIRS: NodeTypes.STAIRS.label}
        )
        stair_ut_to_mezz_2 = Node.objects.create(
            station=station, label="Uptown to Mezzanine Stairs 2", 
            svg_id="UPTOWN_TO_MEZZ_STAIRS_2", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={NodeTypes.UPTOWN_PLATFORM: NodeTypes.UPTOWN_PLATFORM.label, NodeTypes.STAIRS: NodeTypes.STAIRS.label}
        )

        # --- MEZZANINE LAYER NODES ---
        stair_20av_south_1 = Node.objects.create(
            station=station, label="20 Av South Side 86 St Stairs 1", 
            svg_id="20_AV_SOUTH_SIDE_86_ST_STAIRS_1", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label, NodeTypes.STAIRS: NodeTypes.STAIRS.label, NodeTypes.EXIT: NodeTypes.EXIT.label}
        )
        stair_20av_south_2 = Node.objects.create(
            station=station, label="20 Av South Side 86 St Stairs 2", 
            svg_id="20_AV_SOUTH_SIDE_86_ST_STAIRS_2", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label, NodeTypes.STAIRS: NodeTypes.STAIRS.label, NodeTypes.EXIT: NodeTypes.EXIT.label}
        )
        stair_20av_north_1 = Node.objects.create(
            station=station, label="20 Av North Side 86 St Stairs 1", 
            svg_id="20_AV_NORTH_SIDE_86_ST_STAIRS_1", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label, NodeTypes.STAIRS: NodeTypes.STAIRS.label, NodeTypes.EXIT: NodeTypes.EXIT.label}
        )
        stair_20av_north_2 = Node.objects.create(
            station=station, label="20 Av North Side 86 St Stairs 2", 
            svg_id="20_AV_NORTH_SIDE_86_ST_STAIRS_2", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label, NodeTypes.STAIRS: NodeTypes.STAIRS.label, NodeTypes.EXIT: NodeTypes.EXIT.label}
        )

        stair_mezz_to_ut_1 = Node.objects.create(
            station=station, label="Mezzanine to Uptown Stairs 1", 
            svg_id="MEZZ_TO_UPTOWN_STAIRS_1", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label, NodeTypes.STAIRS: NodeTypes.STAIRS.label}
        )
        stair_mezz_to_ut_2 = Node.objects.create(
            station=station, label="Mezzanine to Uptown Stairs 2", 
            svg_id="MEZZ_TO_UPTOWN_STAIRS_2", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label, NodeTypes.STAIRS: NodeTypes.STAIRS.label}
        )
        stair_mezz_to_dt_1 = Node.objects.create(
            station=station, label="Mezzanine to Downtown Stairs 1", 
            svg_id="MEZZ_TO_DOWNTOWN_STAIRS_1", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label, NodeTypes.STAIRS: NodeTypes.STAIRS.label}
        )
        stair_mezz_to_dt_2 = Node.objects.create(
            station=station, label="Mezzanine to Downtown Stairs 2", 
            svg_id="MEZZ_TO_DOWNTOWN_STAIRS_2", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label, NodeTypes.STAIRS: NodeTypes.STAIRS.label}
        )

        mezz_ut = Node.objects.create(
            station=station, label="Mezzanine Uptown", 
            svg_id="MEZZANINE UPTOWN", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label}
        )
        mezz_ut_n_exit_1 = Node.objects.create(
            station=station, label="Mezzanine Uptown North Side Exit 1", 
            svg_id="MEZZANINE UPTOWN NORTH SIDE EXIT 1", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label}
        )
        mezz_ut_n_exit_2 = Node.objects.create(
            station=station, label="Mezzanine Uptown North Side Exit 2", 
            svg_id="MEZZANINE UPTOWN NORTH SIDE EXIT 2", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label}
        )

        mezz_dt = Node.objects.create(
            station=station, label="Mezzanine Downtown", 
            svg_id="MEZZANINE DOWNTOWN", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label}
        )
        mezz_dt_s_exit_1 = Node.objects.create(
            station=station, label="Mezzanine Downtown South Side Exit 1", 
            svg_id="MEZZANINE DOWNTOWN SOUTH SIDE EXIT 1", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label}
        )
        mezz_dt_s_exit_2 = Node.objects.create(
            station=station, label="Mezzanine Downtown South Side Exit 2", 
            svg_id="MEZZANINE DOWNTOWN SOUTH SIDE EXIT 2", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label}
        )

        mezz_central = Node.objects.create(
            station=station, label="Mezzanine Central", 
            svg_id="MEZZANINE CENTRAL", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label}
        )
        mezz_booth = Node.objects.create(
            station=station, label="Mezzanine Central Booth", 
            svg_id="MEZZANINE CENTRAL BOOTH", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label}
        )

        # 5. Create Edges
        # Note: Edges are created in pairs to represent bi-directional flow
        edges_data = [
            # --- DOWNTOWN PLATFORM CHAINS ---
            (dt_plat_head, dt_plat_mid, "Walk along the downtown platform", "NONE"),
            (dt_plat_mid, dt_plat_head, "Walk along the downtown platform", "NONE"),
            
            (dt_plat_rear, dt_plat_mid, "Walk along the downtown platform", "NONE"),
            (dt_plat_mid, dt_plat_rear, "Walk along the downtown platform", "NONE"),
            
            (dt_plat_mid, stair_dt_to_mezz_1, "Approach stairs 1", "NONE"),
            (stair_dt_to_mezz_1, dt_plat_mid, "Step off stairs 1 onto the platform", "NONE"),

            (dt_plat_mid, stair_dt_to_mezz_2, "Approach stairs 2", "NONE"),
            (stair_dt_to_mezz_2, dt_plat_mid, "Step off stairs 2 onto the platform", "NONE"),

            # Downtown Stairs (Platform to Mezzanine) - FIXED FOR ELEVATED
            (stair_dt_to_mezz_1, stair_mezz_to_dt_1, "Take stairs down to the mezzanine", "DOWN"),
            (stair_mezz_to_dt_1, stair_dt_to_mezz_1, "Take stairs up to the downtown platform", "UP"),

            (stair_dt_to_mezz_2, stair_mezz_to_dt_2, "Take stairs down to the mezzanine", "DOWN"),
            (stair_mezz_to_dt_2, stair_dt_to_mezz_2, "Take stairs up to the downtown platform", "UP"),

            # Mezzanine Downtown Area
            (stair_mezz_to_dt_1, mezz_dt, "Enter mezzanine downtown area", "NONE"),
            (mezz_dt, stair_mezz_to_dt_1, "Approach stairs to downtown platform", "NONE"),
            
            (stair_mezz_to_dt_2, mezz_dt, "Enter mezzanine downtown area", "NONE"),
            (mezz_dt, stair_mezz_to_dt_2, "Approach stairs to downtown platform", "NONE"),
            
            (mezz_dt, mezz_central, "Walk towards central mezzanine", "NONE"),
            (mezz_central, mezz_dt, "Walk towards downtown mezzanine", "NONE"),

            # --- UPTOWN PLATFORM CHAINS ---
            (ut_plat_head, ut_plat_mid, "Walk along the uptown platform", "NONE"),
            (ut_plat_mid, ut_plat_head, "Walk along the uptown platform", "NONE"),
            
            (ut_plat_mid, ut_plat_rear, "Walk along the uptown platform", "NONE"),
            (ut_plat_rear, ut_plat_mid, "Walk along the uptown platform", "NONE"),

            (ut_plat_head, stair_ut_to_mezz_1, "Approach stairs 1", "NONE"),
            (stair_ut_to_mezz_1, ut_plat_head, "Step off stairs 1 onto the platform", "NONE"),

            (ut_plat_mid, stair_ut_to_mezz_2, "Approach stairs 2", "NONE"),
            (stair_ut_to_mezz_2, ut_plat_mid, "Step off stairs 2 onto the platform", "NONE"),

            # Uptown Stairs (Platform to Mezzanine) - FIXED FOR ELEVATED
            (stair_ut_to_mezz_1, stair_mezz_to_ut_1, "Take stairs down to the mezzanine", "DOWN"),
            (stair_mezz_to_ut_1, stair_ut_to_mezz_1, "Take stairs up to the uptown platform", "UP"),

            (stair_ut_to_mezz_2, stair_mezz_to_ut_2, "Take stairs down to the mezzanine", "DOWN"),
            (stair_mezz_to_ut_2, stair_ut_to_mezz_2, "Take stairs up to the uptown platform", "UP"),

            # Mezzanine Uptown Area
            (stair_mezz_to_ut_1, mezz_ut, "Enter mezzanine uptown area", "NONE"),
            (mezz_ut, stair_mezz_to_ut_1, "Approach stairs to uptown platform", "NONE"),

            (stair_mezz_to_ut_2, mezz_ut, "Enter mezzanine uptown area", "NONE"),
            (mezz_ut, stair_mezz_to_ut_2, "Approach stairs to uptown platform", "NONE"),

            (mezz_ut, mezz_central, "Walk towards central mezzanine", "NONE"),
            (mezz_central, mezz_ut, "Walk towards uptown mezzanine", "NONE"),

            # --- CENTRAL MEZZANINE & EXITS ---
            (mezz_central, mezz_booth, "Walk to the central booth", "NONE"),
            (mezz_booth, mezz_central, "Walk from the central booth", "NONE"),

            # Downtown Exits
            (mezz_booth, mezz_dt_s_exit_2, "Walk to Downtown South Exit 2", "NONE"),
            (mezz_dt_s_exit_2, mezz_booth, "Walk to central booth", "NONE"),

            (mezz_dt_s_exit_2, mezz_dt_s_exit_1, "Walk between Downtown South Exits", "NONE"),
            (mezz_dt_s_exit_1, mezz_dt_s_exit_2, "Walk between Downtown South Exits", "NONE"),

            # Street Stairs (Mezzanine to Street) - FIXED FOR ELEVATED
            (mezz_dt_s_exit_2, stair_20av_south_2, "Take stairs down to street level", "DOWN"),
            (stair_20av_south_2, mezz_dt_s_exit_2, "Take stairs up to the mezzanine", "UP"),

            (mezz_dt_s_exit_1, stair_20av_south_1, "Take stairs down to street level", "DOWN"),
            (stair_20av_south_1, mezz_dt_s_exit_1, "Take stairs up to the mezzanine", "UP"),

            # Uptown Exits
            (mezz_booth, mezz_ut_n_exit_2, "Walk to Uptown North Exit 2", "NONE"),
            (mezz_ut_n_exit_2, mezz_booth, "Walk to central booth", "NONE"),

            (mezz_ut_n_exit_2, mezz_ut_n_exit_1, "Walk between Uptown North Exits", "NONE"),
            (mezz_ut_n_exit_1, mezz_ut_n_exit_2, "Walk between Uptown North Exits", "NONE"),

            # Street Stairs (Mezzanine to Street) - FIXED FOR ELEVATED
            (mezz_ut_n_exit_2, stair_20av_north_2, "Take stairs down to street level", "DOWN"),
            (stair_20av_north_2, mezz_ut_n_exit_2, "Take stairs up to the mezzanine", "UP"),

            (mezz_ut_n_exit_1, stair_20av_north_1, "Take stairs down to street level", "DOWN"),
            (stair_20av_north_1, mezz_ut_n_exit_1, "Take stairs up to the mezzanine", "UP"),
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
        
        stdout.write(style.SUCCESS("Successfully seeded 20 Av station!"))