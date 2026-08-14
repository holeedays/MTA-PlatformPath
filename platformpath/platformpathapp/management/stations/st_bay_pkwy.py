from django.core.management.base import OutputWrapper
from django.core.management.color import Style
from platformpathapp.models import Station, Line, Node, Edge, StationLine, Layer
from platformpathapp.models import NodeTypes

def seed(stdout: OutputWrapper | None = None, style: Style | None = None):
    if stdout and style:
        stdout.write("Seeding Bay Parkway...")

        # 1. Create station
        station = Station.objects.create(
            name="Bay Parkway",
            diagram_path="/static/platformpathapp/diagrams/BayParkway.svg",
            diagram_rotated_path="/static/platformpathapp/diagrams/BayParkway_rotated.svg",
            accessible_station=True
        )

        # 2. Create line and attach to station
        line_d, _ = Line.objects.get_or_create(name="D")
        StationLine.objects.create(
            station=station,
            line=line_d,
            order=3
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
            types_dict={
                NodeTypes.DOWNTOWN_PLATFORM: NodeTypes.DOWNTOWN_PLATFORM.label
            }
        )
        dt_plat_mid = Node.objects.create(
            station=station, label="Downtown Platform Middle", 
            svg_id="DOWNTOWN PLATFORM MIDDLE", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.DOWNTOWN_PLATFORM: NodeTypes.DOWNTOWN_PLATFORM.label
            }
        )
        dt_plat_rear = Node.objects.create(
            station=station, label="Downtown Platform Rear", 
            svg_id="DOWNTOWN PLATFORM REAR", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.DOWNTOWN_PLATFORM: NodeTypes.DOWNTOWN_PLATFORM.label
            }
        )
        stair_dt_to_mezz = Node.objects.create(
            station=station, label="Stairs from Downtown Platform to Mezzanine", 
            svg_id="DOWNTOWN_TO_MEZZ_STAIRS", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.DOWNTOWN_PLATFORM: NodeTypes.DOWNTOWN_PLATFORM.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label
            }
        )
        stair_dt_to_inter_dt = Node.objects.create(
            station=station, label="Stairs from Downtown Platform to Intermediate Downtown Platform", 
            svg_id="DOWNTOWN_TO_INTERMEDIATE_DOWNTOWN_PLATFORM_STAIRS", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.DOWNTOWN_PLATFORM: NodeTypes.DOWNTOWN_PLATFORM.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label
            }
        )
        elev_dt_to_inter_dt = Node.objects.create(
            station=station, label="Elevator from Downtown Platform to Intermediate Downtown Platform", 
            svg_id="DOWNTOWN_TO_INTERMEDIATE_DOWNTOWN_PLATFORM_ELEVATOR", layer=layer_platforms, is_accessible_infrastructure=True,
            types_dict={
                NodeTypes.DOWNTOWN_PLATFORM: NodeTypes.DOWNTOWN_PLATFORM.label,
                NodeTypes.ELEVATOR: NodeTypes.ELEVATOR.label
            }
        )

        ut_plat_head = Node.objects.create(
            station=station, label="Uptown Platform Head", 
            svg_id="UPTOWN PLATFORM HEAD", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.UPTOWN_PLATFORM: NodeTypes.UPTOWN_PLATFORM.label
            }
        )
        ut_plat_mid = Node.objects.create(
            station=station, label="Uptown Platform Middle", 
            svg_id="UPTOWN PLATFORM MIDDLE", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.UPTOWN_PLATFORM: NodeTypes.UPTOWN_PLATFORM.label
            }
        )
        ut_plat_rear = Node.objects.create(
            station=station, label="Uptown Platform Rear", 
            svg_id="UPTOWN PLATFORM REAR", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.UPTOWN_PLATFORM: NodeTypes.UPTOWN_PLATFORM.label
            }
        )
        stair_ut_to_mezz = Node.objects.create(
            station=station, label="Stairs from Uptown Platform to Mezzanine", 
            svg_id="UPTOWN_TO_MEZZ_STAIRS", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.UPTOWN_PLATFORM: NodeTypes.UPTOWN_PLATFORM.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label
            }
        )
        stair_ut_to_inter_ut = Node.objects.create(
            station=station, label="Stairs from Uptown Platform to Intermediate Uptown Platform", 
            svg_id="UPTOWN_TO_INTERMEDIATE_UPTOWN_PLATFORM_STAIRS", layer=layer_platforms, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.DOWNTOWN_PLATFORM: NodeTypes.DOWNTOWN_PLATFORM.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label
            }
        )
        elev_ut_to_inter_ut = Node.objects.create(
            station=station, label="Elevator from Uptown Platform to Intermediate Uptown Platform", 
            svg_id="UPTOWN_TO_INTERMEDIATE_UPTOWN_PLATFORM_ELEVATOR", layer=layer_platforms, is_accessible_infrastructure=True,
            types_dict={
                NodeTypes.UPTOWN_PLATFORM: NodeTypes.UPTOWN_PLATFORM.label,
                NodeTypes.ELEVATOR: NodeTypes.ELEVATOR.label
            }
        )

        # --- MEZZANINE LAYER NODES ---
        mezz_booth = Node.objects.create(
            station=station, label="Mezzanine Central Booth", 
            svg_id="MEZZANINE CENTRAL BOOTH", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )
        mezz_central_rear_dt = Node.objects.create(
            station=station, label="Mezzanine Central Rear Downtown Area", 
            svg_id="MEZZANINE CENTRAL REAR DOWNTOWN", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )
        mezz_central_rear_ut = Node.objects.create(
            station=station, label="Mezzanine Central Rear Uptown Area", 
            svg_id="MEZZANINE CENTRAL REAR UPTOWN", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )
        mezz_central_mid_dt = Node.objects.create(
            station=station, label="Mezzanine Central Middle Downtown Area", 
            svg_id="MEZZANINE CENTRAL MIDDLE DOWNTOWN", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )
        mezz_central_mid_ut = Node.objects.create(
            station=station, label="Mezzanine Central Middle Uptown Area", 
            svg_id="MEZZANINE CENTRAL MIDDLE UPTOWN", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )
        mezz_central_head_dt = Node.objects.create(
            station=station, label="Mezzanine Central Head Downtown Area", 
            svg_id="MEZZANINE CENTRAL HEAD DOWNTOWN", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )
        mezz_central_head_ut = Node.objects.create(
            station=station, label="Mezzanine Central Head Uptown Area", 
            svg_id="MEZZANINE CENTRAL HEAD UPTOWN", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )

        mezz_dt_south_exit_1 = Node.objects.create(
            station=station, label="Mezzanine Downtown South Side Exit 1",
            svg_id="MEZZANINE DOWNTOWN SOUTH SIDE EXIT 1", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )
        mezz_dt_south_exit_2 = Node.objects.create(
            station=station, label="Mezzanine Downtown South Side Exit 2",
            svg_id="MEZZANINE DOWNTOWN SOUTH SIDE EXIT 2", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )
        mezz_ut_north_exit_1 = Node.objects.create(
            station=station, label="Mezzanine Uptown North Side Exit 1",
            svg_id="MEZZANINE UPTOWN NORTH SIDE EXIT 1", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )
        mezz_ut_north_exit_2 = Node.objects.create(
            station=station, label="Mezzanine Uptown North Side Exit 2",
            svg_id="MEZZANINE UPTOWN NORTH SIDE EXIT 2", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )

        # --- INTERMEDIATE & PLATFORM COMPOUND NODES ---
        inter_ut_plat = Node.objects.create(
            station=station, label="Intermediate Uptown Platform Landing",
            svg_id="INTERMEDIATE_UPTOWN_PLATFORM", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )
        stair_mezz_to_inter_ut = Node.objects.create(
            station=station, label="Stairs from Mezzanine to Intermediate Uptown Platform",
            svg_id="MEZZ_TO_INTERMEDIATE_UPTOWN_PLATFORM_STAIRS", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label
            }
        )
        stair_inter_ut_to_ut = Node.objects.create(
            station=station, label="Stairs from Intermediate Uptown Platform to Uptown Platform",
            svg_id="INTERMEDIATE_UPTOWN_PLATFORM_TO_UPTOWN_STAIRS", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label
            }
        )
        ramp_mezz_to_inter_ut = Node.objects.create(
            station=station, label="Ramp from Mezzanine to Intermediate Uptown Platform",
            svg_id="MEZZ_TO_INTERMEDIATE_UPTOWN_PLATFORM_RAMP", layer=layer_mezzanine, is_accessible_infrastructure=True,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.RAMP: NodeTypes.RAMP.label
            }
        )
        elev_inter_ut_to_ut = Node.objects.create(
            station=station, label="Elevator from Intermediate Uptown Platform to Uptown Platform",
            svg_id="INTERMEDIATE_UPTOWN_PLATFORM_TO_UPTOWN_ELEVATOR", layer=layer_mezzanine, is_accessible_infrastructure=True,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.ELEVATOR: NodeTypes.ELEVATOR.label
            }
        )

        inter_dt_plat = Node.objects.create(
            station=station, label="Intermediate Downtown Platform Landing",
            svg_id="INTERMEDIATE_DOWNTOWN_PLATFORM", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label
            }
        )
        stair_mezz_to_inter_dt = Node.objects.create(
            station=station, label="Stairs from Mezzanine to Intermediate Downtown Platform",
            svg_id="MEZZ_TO_INTERMEDIATE_DOWNTOWN_PLATFORM_STAIRS", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label
            }
        )
        stair_inter_dt_to_dt = Node.objects.create(
            station=station, label="Stairs from Intermediate Downtown Platform to Downtown Platform",
            svg_id="INTERMEDIATE_DOWNTOWN_PLATFORM_TO_DOWNTOWN_STAIRS", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label
            }
        )
        ramp_mezz_to_inter_dt = Node.objects.create(
            station=station, label="Ramp from Mezzanine to Intermediate Downtown Platform",
            svg_id="MEZZ_TO_INTERMEDIATE_DOWNTOWN_PLATFORM_RAMP", layer=layer_mezzanine, is_accessible_infrastructure=True,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.RAMP: NodeTypes.RAMP.label
            }
        )
        elev_inter_dt_to_dt = Node.objects.create(
            station=station, label="Elevator from Intermediate Downtown Platform to Downtown Platform",
            svg_id="INTERMEDIATE_DOWNTOWN_PLATFORM_TO_DOWNTOWN_ELEVATOR", layer=layer_mezzanine, is_accessible_infrastructure=True,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.ELEVATOR: NodeTypes.ELEVATOR.label
            }
        )

        stair_mezz_to_dt = Node.objects.create(
            station=station, label="Mezzanine Stairs to Downtown Platform", 
            svg_id="MEZZ_TO_DOWNTOWN_STAIRS", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label
            }
        )
        stair_mezz_to_ut = Node.objects.create(
            station=station, label="Mezzanine Stairs to Uptown Platform", 
            svg_id="MEZZ_TO_UPTOWN_STAIRS", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label
            }
        )

        # --- STREET EXIT / ENTRANCE NODES (UPDATED WITH NodeTypes.EXIT) ---
        stair_bay_pkwy_north_1 = Node.objects.create(
            station=station, label="Stairs at Bay Pkwy & North Side 86 St entrance 1", 
            svg_id="BAY_PKWY_NORTH_SIDE_STAIRS_1", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label,
                NodeTypes.EXIT: NodeTypes.EXIT.label
            }
        )
        stair_bay_pkwy_north_2 = Node.objects.create(
            station=station, label="Stairs at Bay Pkwy & North Side 86 St entrance 2", 
            svg_id="BAY_PKWY_NORTH_SIDE_STAIRS_2", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label,
                NodeTypes.EXIT: NodeTypes.EXIT.label
            }
        )
        stair_bay_pkwy_south_1 = Node.objects.create(
            station=station, label="Stairs at Bay Pkwy & South Side 86 St entrance 1", 
            svg_id="BAY_PKWY_SOUTH_SIDE_STAIRS_1", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label,
                NodeTypes.EXIT: NodeTypes.EXIT.label
            }
        )
        stair_bay_pkwy_south_2 = Node.objects.create(
            station=station, label="Stairs at Bay Pkwy & South Side 86 St entrance 2", 
            svg_id="BAY_PKWY_SOUTH_SIDE_STAIRS_2", layer=layer_mezzanine, is_accessible_infrastructure=False,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.STAIRS: NodeTypes.STAIRS.label,
                NodeTypes.EXIT: NodeTypes.EXIT.label
            }
        )
        elev_bay_pkwy_north = Node.objects.create(
            station=station, label="Elevator at Bay Pkwy & North Side 86 St entrance", 
            svg_id="MEZZ_TO_BAY_PKWY_NORTH_SIDE_ELEVATOR", layer=layer_mezzanine, is_accessible_infrastructure=True,
            types_dict={
                NodeTypes.MEZZANINE: NodeTypes.MEZZANINE.label,
                NodeTypes.ELEVATOR: NodeTypes.ELEVATOR.label,
                NodeTypes.EXIT: NodeTypes.EXIT.label
            }
        )


        # 5. Create Edges (Grouped logically by space and movement type)
        edges_data = [
            # -------------------------------------------------------------
            # GROUP 1: PLATFORM LEVEL IN-LEVEL WALKING (HORIZONTAL)
            # -------------------------------------------------------------
            # Downtown Platform Sequence
            (dt_plat_rear, dt_plat_mid, "Walk towards the middle of the downtown platform", "NONE"),
            (dt_plat_mid, dt_plat_rear, "Walk towards the rear of the downtown platform", "NONE"),
            (dt_plat_mid, dt_plat_head, "Walk towards the head of the downtown platform", "NONE"),
            (dt_plat_head, dt_plat_mid, "Walk towards the middle of the downtown platform", "NONE"),

            # Uptown Platform Sequence
            (ut_plat_head, ut_plat_mid, "Walk towards the middle of the uptown platform", "NONE"),
            (ut_plat_mid, ut_plat_head, "Walk towards the head of the uptown platform", "NONE"),
            (ut_plat_mid, ut_plat_rear, "Walk towards the rear of the uptown platform", "NONE"),
            (ut_plat_rear, ut_plat_mid, "Walk towards the middle of the uptown platform", "NONE"),

            # -------------------------------------------------------------
            # GROUP 2: MEZZANINE LEVEL NAVIGATION & BOOTH ACCESS
            # -------------------------------------------------------------
            # Downtown Mezzanine Longitudinal Grid
            (mezz_central_rear_dt, mezz_central_mid_dt, "Walk towards the middle of the downtown central mezzanine", "NONE"),
            (mezz_central_mid_dt, mezz_central_rear_dt, "Walk towards the rear of the downtown central mezzanine", "NONE"),
            (mezz_central_mid_dt, mezz_central_head_dt, "Walk towards the head of the downtown central mezzanine", "NONE"),
            (mezz_central_head_dt, mezz_central_mid_dt, "Walk towards the middle of the downtown central mezzanine", "NONE"),

            # Uptown Mezzanine Longitudinal Grid
            (mezz_central_rear_ut, mezz_central_mid_ut, "Walk towards the middle of the uptown central mezzanine", "NONE"),
            (mezz_central_mid_ut, mezz_central_rear_ut, "Walk towards the rear of the uptown central mezzanine", "NONE"),
            (mezz_central_mid_ut, mezz_central_head_ut, "Walk towards the head of the uptown central mezzanine", "NONE"),
            (mezz_central_head_ut, mezz_central_mid_ut, "Walk towards the middle of the uptown central mezzanine", "NONE"),

            # Cross-Mezzanine Transfers (Downtown <-> Uptown) ...e.g. Latitudinal Grid
            (mezz_central_rear_dt, mezz_central_rear_ut, "Cross between downtown and uptown rear central mezzanine areas", "NONE"),
            (mezz_central_rear_ut, mezz_central_rear_dt, "Cross between uptown and downtown rear central mezzanine areas", "NONE"),
            (mezz_central_mid_dt, mezz_central_mid_ut, "Cross between downtown and uptown middle central mezzanine areas", "NONE"),
            (mezz_central_mid_ut, mezz_central_mid_dt, "Cross between uptown and downtown middle central mezzanine areas", "NONE"),
            (mezz_central_head_dt, mezz_central_head_ut, "Cross between downtown and uptown head central mezzanine areas", "NONE"),
            (mezz_central_head_ut, mezz_central_head_dt, "Cross between uptown and downtown head central mezzanine areas", "NONE"),

            # Station Booth & Mezzanine Exit Concourse Transitions
            (mezz_central_head_dt, mezz_booth, "Walk towards the station booth", "NONE"),
            (mezz_booth, mezz_central_head_dt, "Walk towards the central mezzanine", "NONE"),
            (mezz_central_head_ut, mezz_booth, "Walk towards the station booth", "NONE"),
            (mezz_booth, mezz_central_head_ut, "Walk towards the central mezzanine", "NONE"),

            (mezz_booth, mezz_dt_south_exit_2, "Head towards the South Side exit 2 area", "NONE"),
            (mezz_dt_south_exit_2, mezz_booth, "Head towards the station booth", "NONE"),
            (mezz_dt_south_exit_1, mezz_dt_south_exit_2, "Walk towards the South Side exit 2 area", "NONE"),
            (mezz_dt_south_exit_2, mezz_dt_south_exit_1, "Walk towards the South Side exit 1 area", "NONE"),

            (mezz_booth, mezz_ut_north_exit_2, "Head towards the North Side exit 2 area", "NONE"),
            (mezz_ut_north_exit_2, mezz_booth, "Head towards the station booth", "NONE"),
            (mezz_ut_north_exit_1, mezz_ut_north_exit_2, "Walk towards the North Side exit 2 area", "NONE"),
            (mezz_ut_north_exit_2, mezz_ut_north_exit_1, "Walk towards the North Side exit 1 area", "NONE"),

            # -------------------------------------------------------------
            # GROUP 3: DIRECT MEZZANINE <-> PLATFORM CONNECTIONS
            # -------------------------------------------------------------
            # Downtown Platform Direct Stairs
            (dt_plat_mid, stair_dt_to_mezz, "Approach the stairs leading to the mezzanine", "NONE"),
            (stair_dt_to_mezz, dt_plat_mid, "Step off the stairs onto the head of the downtown platform", "NONE"),
            (stair_mezz_to_dt, stair_dt_to_mezz, "Take the stairs up to the downtown platform", "UP"),
            (stair_dt_to_mezz, stair_mezz_to_dt, "Take the stairs down to the mezzanine", "DOWN"),
            (mezz_central_mid_dt, stair_mezz_to_dt, "Approach the stairs to the downtown platform", "NONE"),
            (stair_mezz_to_dt, mezz_central_mid_dt, "Step off the stairs onto the central mezzanine", "NONE"),

            # Uptown Platform Direct Stairs
            (ut_plat_mid, stair_ut_to_mezz, "Approach the stairs leading to the mezzanine", "NONE"),
            (stair_ut_to_mezz, ut_plat_mid, "Step off the stairs onto the rear of the uptown platform", "NONE"),
            (stair_mezz_to_ut, stair_ut_to_mezz, "Take the stairs up to the uptown platform", "UP"),
            (stair_ut_to_mezz, stair_mezz_to_ut, "Take the stairs down to the mezzanine", "DOWN"),
            (mezz_central_mid_ut, stair_mezz_to_ut, "Approach the stairs to the uptown platform", "NONE"),
            (stair_mezz_to_ut, mezz_central_mid_ut, "Step off the stairs onto the central mezzanine", "NONE"),

            # -------------------------------------------------------------
            # GROUP 4: INTERMEDIATE LANDING COMPOUNDS (STAIRS / RAMPS / ELEVATORS)
            # -------------------------------------------------------------
            # Uptown Intermediate Compound

            # mezzanine to intermediate uptown platform stairs
            (mezz_central_rear_ut, stair_mezz_to_inter_ut, "Approach the stairs to the intermediate uptown platform", "NONE"),
            (stair_mezz_to_inter_ut, mezz_central_rear_ut, "Step off the stairs onto the central mezzanine", "NONE"),
            (stair_mezz_to_inter_ut, inter_ut_plat, "Take the stairs up to the intermediate uptown platform landing", "UP"),
            (inter_ut_plat, stair_mezz_to_inter_ut, "Take the stairs down to the central mezzanine", "DOWN"),

            # uptown ramp
            (mezz_central_head_ut, ramp_mezz_to_inter_ut, "Approach the ramp to the intermediate uptown platform", "UP"),
            (ramp_mezz_to_inter_ut, mezz_central_head_ut, "Step off the ramp onto the central mezzanine", "DOWN"),
            (ramp_mezz_to_inter_ut, inter_ut_plat, "Take the ramp up to the intermediate uptown platform landing", "UP"),
            (inter_ut_plat, ramp_mezz_to_inter_ut, "Take the ramp down to the central mezzanine", "DOWN"),

            # uptown platform to intermediate uptown platform stairs
            (stair_ut_to_inter_ut, ut_plat_mid, "Take the stairs up to the uptown platform", "NONE"),
            (ut_plat_mid, stair_ut_to_inter_ut, "Take the stairs down to the intermediate uptown platform landing", "NONE"),
            (stair_inter_ut_to_ut, stair_ut_to_inter_ut, "Take the stairs up to the uptown platform", "UP"),
            (stair_ut_to_inter_ut, stair_inter_ut_to_ut, "Take the stairs down to the intermediate uptown platform landing", "DOWN"),
            (inter_ut_plat, stair_inter_ut_to_ut, "Approach the stairs leading up to the uptown platform", "NONE"),
            (stair_inter_ut_to_ut, inter_ut_plat, "Step off the stairs onto the intermediate uptown platform landing", "NONE"),

            # uptown elevator
            (ut_plat_mid, elev_ut_to_inter_ut, "Approach the elevator on the uptown platform", "NONE"),
            (elev_ut_to_inter_ut, ut_plat_mid, "Step off the elevator onto the uptown platform", "NONE"),
            (elev_ut_to_inter_ut, elev_inter_ut_to_ut, "Take the elevator down to the intermediate uptown platform", "DOWN"),
            (elev_inter_ut_to_ut, elev_ut_to_inter_ut, "Take the elevator up to the uptown platform", "UP"),
            (inter_ut_plat, elev_inter_ut_to_ut, "Approach the elevator to the uptown platform", "NONE"),
            (elev_inter_ut_to_ut, inter_ut_plat, "Step off the elevator onto the intermediate uptown platform landing", "NONE"),

            # Downtown Intermediate Compound

            # mezzanine to intermediate downtown platform stairs
            (mezz_central_rear_dt, stair_mezz_to_inter_dt, "Approach the stairs to the intermediate downtown platform", "NONE"),
            (stair_mezz_to_inter_dt, mezz_central_rear_dt, "Step off the stairs onto the central mezzanine", "NONE"),
            (stair_mezz_to_inter_dt, inter_dt_plat, "Take the stairs up to the intermediate downtown platform landing", "UP"),
            (inter_dt_plat, stair_mezz_to_inter_dt, "Take the stairs down to the central mezzanine", "DOWN"),

            # downtown ramp
            (mezz_central_head_dt, ramp_mezz_to_inter_dt, "Approach the ramp to the intermediate downtown platform", "UP"),
            (ramp_mezz_to_inter_dt, mezz_central_head_dt, "Step off the ramp onto the central mezzanine", "DOWN"),
            (ramp_mezz_to_inter_dt, inter_dt_plat, "Take the ramp up to the intermediate downtown platform landing", "UP"),
            (inter_dt_plat, ramp_mezz_to_inter_dt, "Take the ramp down to the rear central mezzanine", "DOWN"),

            # downtown platform to intermediate downtown platform stairs
            (dt_plat_mid, stair_dt_to_inter_dt, "Approach the stairs to the intermediate downtown platform", "NONE"),
            (stair_dt_to_inter_dt, dt_plat_mid, "Step off the stairs onto the platform", "NONE"),
            (stair_inter_dt_to_dt, stair_dt_to_inter_dt, "Take the stairs up to the downtown platform", "UP"),
            (stair_dt_to_inter_dt, stair_inter_dt_to_dt, "Take the stairs down to the intermediate downtown platform landing", "DOWN"),
            (inter_dt_plat, stair_inter_dt_to_dt, "Approach the stairs leading up to the downtown platform", "NONE"),
            (stair_inter_dt_to_dt, inter_dt_plat, "Step off the stairs onto the intermediate downtown platform landing", "NONE"),

            # downtown elevator
            (dt_plat_mid, elev_dt_to_inter_dt, "Approach the elevator on the downtown platform", "NONE"),
            (elev_dt_to_inter_dt, dt_plat_mid, "Step off the elevator onto the downtown platform", "NONE"),
            (elev_dt_to_inter_dt, elev_inter_dt_to_dt, "Take the elevator down to the intermediate level", "DOWN"),
            (elev_inter_dt_to_dt, elev_dt_to_inter_dt, "Take the elevator up to the downtown platform", "UP"),
            (inter_dt_plat, elev_inter_dt_to_dt, "Approach the elevator to the downtown platform", "NONE"),
            (elev_inter_dt_to_dt, inter_dt_plat, "Step off the elevator onto the intermediate downtown platform landing", "NONE"),

            # -------------------------------------------------------------
            # GROUP 5: STREET EXITS & ENTRANCES (MEZZANINE <-> STREET)
            # -------------------------------------------------------------
            # North Side Street Exits & Elevator (Bay Pkwy & 86 St North)
            (stair_bay_pkwy_north_1, mezz_ut_north_exit_1, "Take the stairs up to the North Side 86 St exit 1 area", "UP"),
            (mezz_ut_north_exit_1, stair_bay_pkwy_north_1, "Take the stairs down to the street level at Bay Pkwy North Side", "DOWN"),

            (stair_bay_pkwy_north_2, mezz_ut_north_exit_2, "Take the stairs up to the North Side 86 St exit 2 area", "UP"),
            (mezz_ut_north_exit_2, stair_bay_pkwy_north_2, "Take the stairs down to the street level at Bay Pkwy North Side", "DOWN"),

            (elev_bay_pkwy_north, mezz_ut_north_exit_2, "Take the elevator up to the mezzanine area", "UP"),
            (mezz_ut_north_exit_2, elev_bay_pkwy_north, "Take the elevator down to the street level at Bay Pkwy North Side", "DOWN"),

            # South Side Street Exits (Bay Pkwy & 86 St South)
            (stair_bay_pkwy_south_1, mezz_dt_south_exit_1, "Take the stairs up to the South Side 86 St exit 1 area", "UP"),
            (mezz_dt_south_exit_1, stair_bay_pkwy_south_1, "Take the stairs down to the street level at Bay Pkwy South Side", "DOWN"),

            (stair_bay_pkwy_south_2, mezz_dt_south_exit_2, "Take the stairs up to the South Side 86 St exit 2 area", "UP"),
            (mezz_dt_south_exit_2, stair_bay_pkwy_south_2, "Take the stairs down to the street level at Bay Pkwy South Side", "DOWN")
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
           
        stdout.write(style.SUCCESS("Successfully seeded updated Bay Parkway station!"))