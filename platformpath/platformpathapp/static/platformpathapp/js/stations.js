const STATIONS = {
    "bay-50-st": {
        name: "Bay 50 St",
        lines: ["D"],
        diagram: "/static/platformpathapp/diagrams/Bay50.svg",

        // Stairs, Platforms, and Mezzanines are nodes
        nodes: {
            // Street Level Stairs (Exits/Entrances)
            "stair_harway_av_1_to_mezz": { type: "stair", label: "Stairs at Harway Av entrance" },
            "stair_harway_av_2_to_mezz": { type: "stair", label: "Stairs at Harway Av entrance" },
            "stair_bay_50_st_1_to_mezz": { type: "stair", label: "Stairs at Bay 50 St entrance" },
            "stair_bay_50_st_2_to_mezz": { type: "stair", label: "Stairs at Bay 50 St entrance" },

            // Mezzanine level
            "mezz_main": { type: "mezzanine", label: "Main Mezzanine", svgId: "MEZZANINE" },

            // Stairs connecting mezzanine to platforms
            "stair_mezz_to_uptown": { type: "stair", label: "Stairs to downtown platform" },
            "stair_mezz_to_downtown": { type: "stair", label: "Stairs to uptown platform" },

            // Platform level
            "platform_downtown": { type: "platform", label: "Downtown D Platform", svgId: "DOWNTOWN PLATFORM" },
            "platform_uptown": { type: "platform", label: "Uptown D Platform", svgID: "UPTOWN PLATFORM" },
        },

        edges: [
            // ─── HARWAY AV ENTRANCE 1 <-> MEZZANINE ───
            {
                from: "stair_harway_av_1_to_mezz",
                to: "mezz_main",
                svgId: "HARWAY_AV_STILLWELL_AV_1_STAIRS",
                instruction: "Take the stairs up to the mezzanine level"
            },
            {
                from: "mezz_main",
                to: "stair_harway_av_1_to_mezz",
                svgId: "HARWAY_AV_STILLWELL_AV_1_STAIRS",
                instruction: "Take the stairs down to the Harway Av exit"
            },

            // ─── HARWAY AV ENTRANCE 2 <-> MEZZANINE ───
            {
                from: "stair_harway_av_2_to_mezz",
                to: "mezz_main",
                svgId: "HARWAY_AV_STILLWELL_AV_2_STAIRS",
                instruction: "Take the stairs up to the mezzanine level"
            },
            {
                from: "mezz_main",
                to: "stair_harway_av_2_to_mezz",
                svgId: "HARWAY_AV_STILLWELL_AV_2_STAIRS",
                instruction: "Take the stairs down to the Harway Av exit"
            },

            // ─── BAY 50 ST ENTRANCE 1 <-> MEZZANINE ───
            {
                from: "stair_bay_50_st_1_to_mezz",
                to: "mezz_main",
                svgId: "BAY_50_ST_STILLWELL_AV_1_STAIRS",
                instruction: "Take the stairs up to the mezzanine level"
            },
            {
                from: "mezz_main",
                to: "stair_bay_50_st_1_to_mezz",
                svgId: "BAY_50_ST_STILLWELL_AV_1_STAIRS",
                instruction: "Take the stairs down to the Bay 50 St exit"
            },

            // ─── BAY 50 ST ENTRANCE 2 <-> MEZZANINE ───
            {
                from: "stair_bay_50_st_2_to_mezz",
                to: "mezz_main",
                svgId: "BAY_50_ST_STILLWELL_AV_2_STAIRS",
                instruction: "Take the stairs up to the mezzanine level"
            },
            {
                from: "mezz_main",
                to: "stair_bay_50_st_2_to_mezz",
                svgId: "BAY_50_ST_STILLWELL_AV_2_STAIRS",
                instruction: "Take the stairs down to the Bay 50 St exit"
            },

            // ─── MEZZANINE <-> DOWNTOWN PLATFORM ───
            {
                from: "mezz_main",
                to: "stair_mezz_to_downtown",
                svgId: "MEZZ_TO_DOWNTOWN_STAIRS",
                instruction: "Head to the downtown staircase on the mezzanine"
            },
            {
                from: "stair_mezz_to_downtown",
                to: "platform_downtown",
                svgId: "MEZZ_TO_DOWNTOWN_STAIRS",
                instruction: "Take the stairs up to the downtown platform"
            },
            {
                from: "platform_downtown",
                to: "stair_mezz_to_downtown",
                svgId: "MEZZ_TO_DOWNTOWN_STAIRS",
                instruction: "Head to the stairs on the downtown platform"
            },
            {
                from: "stair_mezz_to_downtown",
                to: "mezz_main",
                svgId: "MEZZ_TO_DOWNTOWN_STAIRS",
                instruction: "Take the stairs down to the mezzanine level"
            },

            // ─── MEZZANINE <-> UPTOWN PLATFORM ───
            {
                from: "mezz_main",
                to: "stair_mezz_to_uptown",
                svgId: "MEZZ_TO_UPTOWN_STAIRS",
                instruction: "Head to the uptown staircase on the mezzanine"
            },
            {
                from: "stair_mezz_to_uptown",
                to: "platform_uptown",
                svgId: "MEZZ_TO_UPTOWN_STAIRS",
                instruction: "Take the stairs up to the uptown platform"
            },
            {
                from: "platform_uptown",
                to: "stair_mezz_to_uptown",
                svgId: "MEZZ_TO_UPTOWN_STAIRS",
                instruction: "Head to the stairs on the uptown platform"
            },
            {
                from: "stair_mezz_to_uptown",
                to: "mezz_main",
                svgId: "MEZZ_TO_UPTOWN_STAIRS",
                instruction: "Take the stairs down to the mezzanine level"
            }
        ]
    },

}




const stair_harway_av_1_to_mezz = new Node(NodeType.STAIRS, "Stairs at Harway Av entrance", "HARWAY_AV_STILLWELL_AV_1_STAIRS");
const stair_harway_av_2_to_mezz = new Node(NodeType.STAIRS, "Stairs at Harway Av entrance", "HARWAY_AV_STILLWELL_AV_2_STAIRS");
const stair_bay_50_st_1_to_mezz = new Node(NodeType.STAIRS, "Stairs at Bay 50 St entrance", "BAY_50_ST_STILLWELL_AV_1_STAIRS");
const stair_bay_50_st_2_to_mezz = new Node(NodeType.STAIRS, "Stairs at Bay 50 St entrance", "BAY_50_ST_STILLWELL_AV_2_STAIRS");

// Mezzanine level
const mezz_main = new Node(NodeType.MEZZANINE, "Main Mezzanine", "MEZZANINE");

// Stairs connecting mezzanine to platforms
const stair_mezz_to_uptown = new Node(NodeType.STAIRS, "Stairs to downtown platform", "MEZZ_TO_UPTOWN_STAIRS");
const stair_mezz_to_downtown = new Node(NodeType.STAIRS, "Stairs to uptown platform", "MEZZ_TO_DOWNTOWN_STAIRS");

// Platform level
const platform_downtown = new Node("platform", "Downtown D Platform", "DOWNTOWN PLATFORM");
const platform_uptown = new Node("platform", "Uptown D Platform", "UPTOWN PLATFORM");

const edge1 = new Edges(
    stair_harway_av_1_to_mezz, 
    mezz_main, 
    "Take the stairs up to the mezzanine level");
const edge2 = new Edges(
    mezz_main, 
    stair_harway_av_1_to_mezz, 
    "Take the stairs down to the Harway Av exit"
);
const edge3 = new Edges(
    stair_harway_av_2_to_mezz, 
    mezz_main, 
    "Take the stairs up to the mezzanine level");
const edge4 = new Edges(
    mezz_main, 
    stair_harway_av_2_to_mezz, 
    "Take the stairs down to the Harway Av exit"
);
const edge5 = new Edges(
    stair_bay_50_st_1_to_mezz, 
    mezz_main, 
    "Take the stairs up to the mezzanine level");
const edge6 = new Edges(
    mezz_main, 
    stair_bay_50_st_1_to_mezz, 
    "Take the stairs down to the Bay 50 St exit"
);
const edge7 = new Edges(
    stair_bay_50_st_2_to_mezz, 
    mezz_main, 
    "Take the stairs up to the mezzanine level");
const edge8 = new Edges(
    mezz_main, 
    stair_bay_50_st_2_to_mezz, 
    "Take the stairs down to the Bay 50 St exit"
);
const edge9 = new Edges(
    mezz_main,
    stair_mezz_to_downtown,
    "Head to the downtown staircase on the mezzanine"
);
const edge10 = new Edges(
    stair_mezz_to_downtown,
    platform_downtown,
    "Take the stairs up to the downtown platform"
);
const edge11 = new Edges(
    platform_downtown,
    stair_mezz_to_downtown,
    "Head to the stairs on the downtown platform"
);
const edge12 = new Edges(
    stair_mezz_to_downtown,
    mezz_main,
    "Take the stairs down to the mezzanine level"
);
const edge13 = new Edges(
    mezz_main,
    stair_mezz_to_uptown,
    "Head to the uptown staircase on the mezzanine"
);
const edge14 = new Edges(
    stair_mezz_to_uptown,
    platform_uptown,
    "Take the stairs up to the uptown platform"
);
const edge15 = new Edges(
    platform_uptown,
    stair_mezz_to_uptown,
    "Head to the stairs on the uptown platform"
);
const edge16 = new Edges(
    stair_mezz_to_uptown,
    mezz_main,
    "Take the stairs down to the mezzanine level"
);

class NodeType {
    static MEZZANINE = "Mezzazine";
    static STAIRS = "Stairs";
    static PLATFORM = "Platform";
}

class Node {    
    constructor(nodeType, label, svgID = null) {
        this.nodeType = nodeType;
        this.label = label;
        this.svgID = svgID;
    }
}

class Edges {
    constructor(nodeFrom, nodeTo, svgID, instructions = "") {
        this.nodeFrom = nodeFrom;
        this.nodeTo = nodeTo;
        this.svgID = svgID;
        this.instruction = "";
    }
}