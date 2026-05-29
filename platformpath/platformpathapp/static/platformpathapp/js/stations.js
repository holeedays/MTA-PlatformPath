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
