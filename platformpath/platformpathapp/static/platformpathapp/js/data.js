import {MasterNode, Node, Edge, NodeType} from "./data_types";

// MEZZANINE LEVEL

// Stairs
const stair_harway_av_1_to_mezz = new Node("stair_harway_av_1_to_mezz", 
                                            NodeType.STAIRS, 
                                            "Stairs at Harway Av entrance", 
                                            "HARWAY_AV_STILLWELL_AV_1_STAIRS");
const stair_harway_av_2_to_mezz = new Node("stair_harway_av_2_to_mezz",
                                            NodeType.STAIRS, 
                                            "Stairs at Harway Av entrance", 
                                            "HARWAY_AV_STILLWELL_AV_2_STAIRS");
const stair_bay_50_st_1_to_mezz = new Node("stair_bay_50_st_1_to_mezz", 
                                            NodeType.STAIRS, 
                                            "Stairs at Bay 50 St entrance", 
                                            "BAY_50_ST_STILLWELL_AV_1_STAIRS");
const stair_bay_50_st_2_to_mezz = new Node("stair_bay_50_st_2_to_mezz",
                                            NodeType.STAIRS, 
                                            "Stairs at Bay 50 St entrance", 
                                            "BAY_50_ST_STILLWELL_AV_2_STAIRS");

const stair_mezz_to_uptown = new Node("stair_mezz_to_uptown",
                                        NodeType.STAIRS, 
                                        "Stairs to downtown platform", 
                                        "MEZZ_TO_UPTOWN_STAIRS");
const stair_mezz_to_downtown = new Node("stair_mezz_to_downtown",
                                        NodeType.STAIRS, 
                                        "Stairs to uptown platform", 
                                        "MEZZ_TO_DOWNTOWN_STAIRS");

// Mezzanine Platform
const mezz_main = new Node("mezz_main",
                            NodeType.MEZZANINE, 
                            "Main Mezzanine", 
                            "MEZZANINE");

// PLATFORM LEVEL

// Stairs
const stair_uptown_to_mezz = new Node("stair_uptown_to_mezz",
                                        NodeType.STAIRS, 
                                        "Stairs from uptown platform to mezzanine", 
                                        "UPTOWN_TO_MEZZ_STAIRS");
const stair_downtown_to_mezz = new Node("stair_downtown_to_mezz",
                                        NodeType.STAIRS, 
                                        "Stairs from downtown platform to mezzanine", 
                                        "DOWNTOWN_TO_MEZZ_STAIRS");

// Platforms
const platform_uptown = new Node("platform_uptown",
                                    "platform", 
                                    "Uptown D Platform", 
                                    "UPTOWN PLATFORM");
const platform_downtown = new Node("platform_downtown",
                                    "platform", 
                                    "Downtown D Platform", 
                                    "DOWNTOWN PLATFORM");

// ─── HARWAY AV ENTRANCE 1 <-> MEZZANINE ───
const edge1 = new Edge(
    stair_harway_av_1_to_mezz,
    mezz_main,
    "Take the stairs up to the mezzanine level");
const edge2 = new Edge(
    mezz_main,
    stair_harway_av_1_to_mezz,
    "Take the stairs down to the Harway Av exit"
);

// ─── HARWAY AV ENTRANCE 2 <-> MEZZANINE ───
const edge3 = new Edge(
    stair_harway_av_2_to_mezz,
    mezz_main,
    "Take the stairs up to the mezzanine level");
const edge4 = new Edge(
    mezz_main,
    stair_harway_av_2_to_mezz,
    "Take the stairs down to the Harway Av exit"
);

// ─── BAY 50 ST ENTRANCE 1 <-> MEZZANINE ───
const edge5 = new Edge(
    stair_bay_50_st_1_to_mezz,
    mezz_main,
    "Take the stairs up to the mezzanine level");
const edge6 = new Edge(
    mezz_main,
    stair_bay_50_st_1_to_mezz,
    "Take the stairs down to the Bay 50 St exit"
);

// ─── BAY 50 ST ENTRANCE 2 <-> MEZZANINE ───
const edge7 = new Edge(
    stair_bay_50_st_2_to_mezz,
    mezz_main,
    "Take the stairs up to the mezzanine level");
const edge8 = new Edge(
    mezz_main,
    stair_bay_50_st_2_to_mezz,
    "Take the stairs down to the Bay 50 St exit"
);

// ─── MEZZANINE <-> DOWNTOWN PLATFORM ───
// Going to the train (UP)
const edge9 = new Edge(
    mezz_main,
    stair_mezz_to_downtown,
    "Head to the downtown staircase on the mezzanine"
);
const edge10 = new Edge(
    stair_mezz_to_downtown,
    stair_downtown_to_mezz,
    "Take the stairs up to the downtown platform"
);
const edge11 = new Edge(
    stair_downtown_to_mezz,
    platform_downtown,
    "Step off the stairs onto the downtown platform"
)
// Leaving the train (DOWN)
const edge12 = new Edge(
    platform_downtown,
    stair_downtown_to_mezz,
    "Head to the stairs on the downtown platform"
);
const edge13 = new Edge(
    stair_downtown_to_mezz,
    stair_mezz_to_downtown,
    "Take the stairs down to the mezzanine level"
);
const edge14 = new Edge(
    stair_mezz_to_downtown,
    mezz_main, 
    "Step off the stairs onto the main mezzanine"
)

// ─── MEZZANINE <-> UPTOWN PLATFORM ───
// Going to the train (UP)
const edge15 = new Edge(
    mezz_main,
    stair_mezz_to_uptown,
    "Head to the uptown staircase on the mezzanine"
);
const edge16 = new Edge(
    stair_mezz_to_uptown,
    stair_uptown_to_mezz,
    "Take the stairs up to the uptown platform"
);
const edge17 = new Edge(
    stair_uptown_to_mezz,
    platform_uptown,
    "Step off the stairs onto the uptown platform"
);
 // Leaving the train (DOWN)
const edge18 = new Edge(
    platform_uptown,
    stair_uptown_to_mezz,
    "Head to the stairs on the uptown platform"
);
const edge19 = new Edge(
    stair_uptown_to_mezz,
    stair_mezz_to_uptown,
    "Take the stairs down to the mezzanine level"
);
const edge20 = new Edge(
    stair_mezz_to_uptown,
    mezz_main,
    "Step off the stairs onto the main mezzanine"
);

// STATION
const bay_50_st = new MasterNode(
    // name
    "Bay 50 Street", 
    // file path
    "./static/platformpathapp/diagrams/Bay50.svg", 
    // nodes
    [mezz_main, platform_downtown, platform_uptown, 
    stair_bay_50_st_1_to_mezz, stair_bay_50_st_2_to_mezz,
    stair_harway_av_1_to_mezz, stair_harway_av_2_to_mezz,
    stair_mezz_to_downtown, stair_mezz_to_uptown,
    stair_downtown_to_mezz, stair_uptown_to_mezz],
    //edges
    [edge1, edge2, edge3, edge4, edge5, edge6, edge7, 
    edge8, edge9, edge10, edge11, edge12, edge13, edge14,
    edge15, edge16, edge17, edge18, edge19, edge20
    ] 
)

const D_TRAIN_STATIONS = [bay_50_st]



function findPath(stationName, startNodeName, endNodeName) {
    // find our station in the array of all available stations
    // not as effective compared to hash mapping but this'll be fine for now
    const station = getStation(stationName, D_TRAIN_STATIONS);

    if (station instanceof MasterNode) {
        
        visitedNodes = new Set();
        

        

    }
}

function getStation(stationName, stationsArray) {
    for (const station in stationsArray) {
        if (station.name === stationName) {
            return station;
        }
    }

    return null;
}

