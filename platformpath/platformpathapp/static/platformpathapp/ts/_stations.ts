interface NodeData {
    type: string;
    label: string;
    svgId?: string;
    svgID?: string; // Some use svgID, some svgId in the original JS
    layer: string;
}

interface EdgeData {
    from: string;
    to: string;
    instruction: string;
}

interface StationData {
    name: string;
    lines: string[];
    diagram: string;
    nodes: Record<string, NodeData>;
    edges: EdgeData[];
}

interface PathStep {
    svgId: string | undefined;
    layer: string;
    instruction: string;
}

const STATIONS: Record<string, StationData> = {
    "bay-50-st": {
        name: "Bay 50 St",
        lines: ["D"],
        diagram: "/static/platformpathapp/diagrams/Bay50.svg",

        // Stairs, Platforms, and Mezzanines are nodes
        nodes: {
            // Street Level Stairs (Exits/Entrances)
            "stair_harway_av_1_to_mezz": {
                type: "stair",
                label: "Stairs at Harway Av entrance",
                svgId: "HARWAY_AV_STILLWELL_AV_1_STAIRS",
                layer: "MEZZANINE"
            },
            "stair_harway_av_2_to_mezz": {
                type: "stair",
                label: "Stairs at Harway Av entrance",
                svgId: "HARWAY_AV_STILLWELL_AV_2_STAIRS",
                layer: "MEZZANINE"
            },
            "stair_bay_50_st_1_to_mezz": {
                type: "stair",
                label: "Stairs at Bay 50 St entrance",
                svgId: "BAY_50_ST_STILLWELL_AV_1_STAIRS",
                layer: "MEZZANINE"
            },
            "stair_bay_50_st_2_to_mezz": {
                type: "stair",
                label: "Stairs at Bay 50 St entrance",
                svgId: "BAY_50_ST_STILLWELL_AV_2_STAIRS",
                layer: "MEZZANINE"
            },

            // Mezzanine level
            "mezz_main": {
                type: "mezzanine",
                label: "Main Mezzanine",
                svgId: "MEZZANINE",
                layer: "MEZZANINE"
            },

            // Stairs connecting mezzanine to platforms
            "stair_mezz_to_uptown": {
                type: "stair",
                label: "Stairs to downtown platform",
                svgId: "MEZZ_TO_UPTOWN_STAIRS",
                layer: "MEZZANINE"
            },
            "stair_mezz_to_downtown": {
                type: "stair",
                label: "Stairs to uptown platform",
                svgId: "MEZZ_TO_DOWNTOWN_STAIRS",
                layer: "MEZZANINE"
            },

            // Stairs connecting platforms to mezzanine
            "stair_uptown_to_mezz": {
                type: "stair",
                label: "Stairs from uptown platform to mezzanine",
                svgId: "UPTOWN_TO_MEZZ_STAIRS",
                layer: "UPTOWN PLATFORM_2"
            },
            "stair_downtown_to_mezz": {
                type: "stair",
                label: "Stairs from downtown platform to mezzanine",
                svgId: "DOWNTOWN_TO_MEZZ_STAIRS",
                layer: "DOWNTOWN PLATFORM_2"
            },

            // Platform level
            "platform_downtown": {
                type: "platform",
                label: "Downtown D Platform",
                svgId: "DOWNTOWN PLATFORM",
                layer: "DOWNTOWN PLATFORM_2"
            },
            "platform_uptown": {
                type: "platform",
                label: "Uptown D Platform",
                svgID: "UPTOWN PLATFORM",
                layer: "UPTOWN PLATFORM_2"
            },
        },

        edges: [
            // ─── HARWAY AV ENTRANCE 1 <-> MEZZANINE ───
            {
                from: "stair_harway_av_1_to_mezz",
                to: "mezz_main",
                instruction: "Take the stairs up to the mezzanine level"
            },
            {
                from: "mezz_main",
                to: "stair_harway_av_1_to_mezz",
                instruction: "Take the stairs down to the Harway Av exit"
            },

            // ─── HARWAY AV ENTRANCE 2 <-> MEZZANINE ───
            {
                from: "stair_harway_av_2_to_mezz",
                to: "mezz_main",
                instruction: "Take the stairs up to the mezzanine level"
            },
            {
                from: "mezz_main",
                to: "stair_harway_av_2_to_mezz",
                instruction: "Take the stairs down to the Harway Av exit"
            },

            // ─── BAY 50 ST ENTRANCE 1 <-> MEZZANINE ───
            {
                from: "stair_bay_50_st_1_to_mezz",
                to: "mezz_main",
                instruction: "Take the stairs up to the mezzanine level"
            },
            {
                from: "mezz_main",
                to: "stair_bay_50_st_1_to_mezz",
                instruction: "Take the stairs down to the Bay 50 St exit"
            },

            // ─── BAY 50 ST ENTRANCE 2 <-> MEZZANINE ───
            {
                from: "stair_bay_50_st_2_to_mezz",
                to: "mezz_main",
                instruction: "Take the stairs up to the mezzanine level"
            },
            {
                from: "mezz_main",
                to: "stair_bay_50_st_2_to_mezz",
                instruction: "Take the stairs down to the Bay 50 St exit"
            },

            // ─── MEZZANINE <-> DOWNTOWN PLATFORM ───
            // Going to the train (UP)
            {
                from: "mezz_main",
                to: "stair_mezz_to_downtown",
                instruction: "Head to the downtown staircase on the mezzanine"
            },
            {
                from: "stair_mezz_to_downtown",
                to: "stair_downtown_to_mezz",
                instruction: "Take the stairs up to the downtown platform"
            },
            {
                from: "stair_downtown_to_mezz",
                to: "platform_downtown",
                instruction: "Step off the stairs onto the downtown platform"
            },
            // Leaving the train (DOWN)
            {
                from: "platform_downtown",
                to: "stair_downtown_to_mezz",
                instruction: "Head to the stairs on the downtown platform"
            },
            {
                from: "stair_downtown_to_mezz",
                to: "stair_mezz_to_downtown",
                instruction: "Take the stairs down to the mezzanine level"
            },
            {
                from: "stair_mezz_to_downtown",
                to: "mezz_main",
                instruction: "Step off the stairs onto the main mezzanine"
            },

            // ─── MEZZANINE <-> UPTOWN PLATFORM ───
            // Going to the train (UP)
            {
                from: "mezz_main",
                to: "stair_mezz_to_uptown",
                instruction: "Head to the uptown staircase on the mezzanine"
            },
            {
                from: "stair_mezz_to_uptown",
                to: "stair_uptown_to_mezz",
                instruction: "Take the stairs up to the uptown platform"
            },
            {
                from: "stair_uptown_to_mezz",
                to: "platform_uptown",
                instruction: "Step off the stairs onto the uptown platform"
            },
            // Leaving the train (DOWN)
            {
                from: "platform_uptown",
                to: "stair_uptown_to_mezz",
                instruction: "Head to the stairs on the uptown platform"
            },
            {
                from: "stair_uptown_to_mezz",
                to: "stair_mezz_to_uptown",
                instruction: "Take the stairs down to the mezzanine level"
            },
            {
                from: "stair_mezz_to_uptown",
                to: "mezz_main",
                instruction: "Step off the stairs onto the main mezzanine"
            }
        ]

    },

}

// Search function
function findPath(stationId: string, fromNodeId: string, toNodeId: string): PathStep[] | null {
    const station = STATIONS[stationId];
    if (station === undefined) 
        return null;

    const adjacency: Record<string, { neighbor: string; instruction: string }[]> = {};
    station.edges.forEach((edge) => {
        if (adjacency[edge.from] === undefined) 
            adjacency[edge.from] = [];
        adjacency[edge.from]!.push({ neighbor: edge.to, instruction: edge.instruction });
    });

    const visited = new Set<string>();

    // 1. Capture the starting node as the very first step in our sequence
    const startNode = station.nodes[fromNodeId];

    if (startNode === undefined) { // safety check
        console.error(`Error: Could not find a node named "${fromNodeId}"`);
        return null;
    }

    const initialStep: PathStep = {
        svgId: startNode.svgId || startNode.svgID,
        layer: startNode.layer,
        instruction: "Start here"
    };

    // Queue stores: [currentNodeId, sequentialPathArraySoFar] - we're building the path here
    const queue: [string, PathStep[]][] = [[fromNodeId, [initialStep]]];

    while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;
        const [currentNodeId, path] = item;

        if (currentNodeId === toNodeId) {
            return path; // Return the entire route
        }

        if (visited.has(currentNodeId)) 
            continue;
        visited.add(currentNodeId);

        const neighbors = adjacency[currentNodeId] || [];
        neighbors.forEach(({ neighbor, instruction }) => {
            if (!visited.has(neighbor)) {

                // 2. Look up the target node we are stepping onto
                const targetNode = station.nodes[neighbor];
                if (!targetNode) return;

                // 3. Create the next step in the sequence
                const nextStep: PathStep = {
                    svgId: targetNode.svgId || targetNode.svgID,
                    layer: targetNode.layer,
                    instruction: instruction
                };

                queue.push([neighbor, [...path, nextStep]]);
            }
        });
    }

    return null;
}

(window as any).findPath = findPath;

console.log(findPath("bay-50-st", "stair_harway_av_1_to_mezz", "platform_downtown"));
