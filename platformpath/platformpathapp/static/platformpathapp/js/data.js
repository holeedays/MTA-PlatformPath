import { MasterNode, Node, Edge, NodeType } from "./data_types.js";
// MEZZANINE LEVEL
// Stairs
const stair_harway_av_1_to_mezz = new Node("stair_harway_av_1_to_mezz", NodeType.STAIRS, "MEZZANINE", "Stairs at Harway Av entrance", "HARWAY_AV_STILLWELL_AV_1_STAIRS");
const stair_harway_av_2_to_mezz = new Node("stair_harway_av_2_to_mezz", NodeType.STAIRS, "MEZZANINE", "Stairs at Harway Av entrance", "HARWAY_AV_STILLWELL_AV_2_STAIRS");
const stair_bay_50_st_1_to_mezz = new Node("stair_bay_50_st_1_to_mezz", NodeType.STAIRS, "MEZZANINE", "Stairs at Bay 50 St entrance", "BAY_50_ST_STILLWELL_AV_1_STAIRS");
const stair_bay_50_st_2_to_mezz = new Node("stair_bay_50_st_2_to_mezz", NodeType.STAIRS, "MEZZANINE", "Stairs at Bay 50 St entrance", "BAY_50_ST_STILLWELL_AV_2_STAIRS");
const stair_mezz_to_uptown = new Node("stair_mezz_to_uptown", NodeType.STAIRS, "MEZZANINE", "Stairs to downtown platform", "MEZZ_TO_UPTOWN_STAIRS");
const stair_mezz_to_downtown = new Node("stair_mezz_to_downtown", NodeType.STAIRS, "MEZZANINE", "Stairs to uptown platform", "MEZZ_TO_DOWNTOWN_STAIRS");
// Mezzanine Platform
const mezz_main = new Node("mezz_main", NodeType.MEZZANINE, "MEZZANINE", "Main Mezzanine", "MEZZANINE");
// PLATFORM LEVEL
// Stairs
const stair_uptown_to_mezz = new Node("stair_uptown_to_mezz", NodeType.STAIRS, "UPTOWN PLATFORM", "Stairs from uptown platform to mezzanine", "UPTOWN_TO_MEZZ_STAIRS");
const stair_downtown_to_mezz = new Node("stair_downtown_to_mezz", NodeType.STAIRS, "DOWNTOWN PLATFORM", "Stairs from downtown platform to mezzanine", "DOWNTOWN_TO_MEZZ_STAIRS");
// Platforms
const platform_uptown = new Node("platform_uptown", NodeType.PLATFORM, "UPTOWN PLATFORM", "Uptown D Platform", "UPTOWN PLATFORM");
const platform_downtown = new Node("platform_downtown", NodeType.PLATFORM, "DOWNTOWN PLATFORM", "Downtown D Platform", "DOWNTOWN PLATFORM");
// ─── HARWAY AV ENTRANCE 1 <-> MEZZANINE ───
const edge1 = new Edge(stair_harway_av_1_to_mezz, mezz_main, "Take the stairs up to the mezzanine level");
const edge2 = new Edge(mezz_main, stair_harway_av_1_to_mezz, "Take the stairs down to the Harway Av exit");
// ─── HARWAY AV ENTRANCE 2 <-> MEZZANINE ───
const edge3 = new Edge(stair_harway_av_2_to_mezz, mezz_main, "Take the stairs up to the mezzanine level");
const edge4 = new Edge(mezz_main, stair_harway_av_2_to_mezz, "Take the stairs down to the Harway Av exit");
// ─── BAY 50 ST ENTRANCE 1 <-> MEZZANINE ───
const edge5 = new Edge(stair_bay_50_st_1_to_mezz, mezz_main, "Take the stairs up to the mezzanine level");
const edge6 = new Edge(mezz_main, stair_bay_50_st_1_to_mezz, "Take the stairs down to the Bay 50 St exit");
// ─── BAY 50 ST ENTRANCE 2 <-> MEZZANINE ───
const edge7 = new Edge(stair_bay_50_st_2_to_mezz, mezz_main, "Take the stairs up to the mezzanine level");
const edge8 = new Edge(mezz_main, stair_bay_50_st_2_to_mezz, "Take the stairs down to the Bay 50 St exit");
// ─── MEZZANINE <-> DOWNTOWN PLATFORM ───
// Going to the train (UP)
const edge9 = new Edge(mezz_main, stair_mezz_to_downtown, "Head to the downtown staircase on the mezzanine");
const edge10 = new Edge(stair_mezz_to_downtown, stair_downtown_to_mezz, "Take the stairs up to the downtown platform");
const edge11 = new Edge(stair_downtown_to_mezz, platform_downtown, "Step off the stairs onto the downtown platform");
// Leaving the train (DOWN)
const edge12 = new Edge(platform_downtown, stair_downtown_to_mezz, "Head to the stairs on the downtown platform");
const edge13 = new Edge(stair_downtown_to_mezz, stair_mezz_to_downtown, "Take the stairs down to the mezzanine level");
const edge14 = new Edge(stair_mezz_to_downtown, mezz_main, "Step off the stairs onto the main mezzanine");
// ─── MEZZANINE <-> UPTOWN PLATFORM ───
// Going to the train (UP)
const edge15 = new Edge(mezz_main, stair_mezz_to_uptown, "Head to the uptown staircase on the mezzanine");
const edge16 = new Edge(stair_mezz_to_uptown, stair_uptown_to_mezz, "Take the stairs up to the uptown platform");
const edge17 = new Edge(stair_uptown_to_mezz, platform_uptown, "Step off the stairs onto the uptown platform");
// Leaving the train (DOWN)
const edge18 = new Edge(platform_uptown, stair_uptown_to_mezz, "Head to the stairs on the uptown platform");
const edge19 = new Edge(stair_uptown_to_mezz, stair_mezz_to_uptown, "Take the stairs down to the mezzanine level");
const edge20 = new Edge(stair_mezz_to_uptown, mezz_main, "Step off the stairs onto the main mezzanine");
// STATION
const bay_50_st = new MasterNode(
// name
"bay-50-st", 
// file path
"./static/platformpathapp/diagrams/Bay50.svg", 
//edges
[edge1, edge2, edge3, edge4, edge5, edge6, edge7,
    edge8, edge9, edge10, edge11, edge12, edge13, edge14,
    edge15, edge16, edge17, edge18, edge19, edge20]);
const D_TRAIN_STATIONS = [bay_50_st];
function findPath(stationName, startNodeName, endNodeName) {
    // find our station in the array of all available stations
    // not as effective compared to hash mapping but this'll be fine for now
    const station = getStation(stationName, D_TRAIN_STATIONS);
    if (station instanceof MasterNode) {
        const adjacentNodes = {};
        station.edges?.forEach((edge) => {
            if (!edge.nodeFrom || !edge.nodeTo)
                return;
            const fromName = edge.nodeFrom.name;
            if (!fromName)
                return;
            // initialize array if does not exist
            if (adjacentNodes[fromName] === undefined)
                adjacentNodes[fromName] = {
                    self: edge.nodeFrom,
                    neighbors: []
                };
            adjacentNodes[fromName].neighbors.push({
                node: edge.nodeTo,
                instruction: edge.instructions
            });
        });
        // since our nodes are bidirectional, prevents nodes traversing backwards
        const visitedNodes = new Set();
        const startNodeEntry = adjacentNodes[startNodeName];
        if (!startNodeEntry)
            return null;
        const startNode = startNodeEntry.self;
        const initialStep = {
            svgID: startNode.svgID,
            layerID: startNode.layerID,
            instruction: "Start here"
        };
        // Breadth First Search Algorithm Pathfinding Implementation
        const queue = [[startNode, [initialStep]]];
        while (queue.length > 0) {
            const item = queue.shift();
            if (!item)
                break;
            const [currentNode, currentPath] = item;
            // if we have reached our current node, we stop!
            if (currentNode.name === endNodeName)
                return currentPath;
            visitedNodes.add(currentNode);
            const neighbors = adjacentNodes[currentNode.name]?.neighbors || [];
            neighbors.forEach((neighbor) => {
                if (!visitedNodes.has(neighbor.node)) {
                    const nextStep = {
                        svgID: neighbor.node.svgID,
                        layerID: neighbor.node.layerID,
                        instruction: neighbor.instruction
                    };
                    queue.push([neighbor.node, [...currentPath, nextStep]]);
                }
            });
        }
    }
    return null;
}
function getStation(stationName, stationsArray) {
    for (const station of stationsArray) {
        if (station.name === stationName) {
            return station;
        }
    }
    return null;
}
console.log(findPath("bay-50-st", "stair_harway_av_1_to_mezz", "platform_downtown"));
//# sourceMappingURL=data.js.map