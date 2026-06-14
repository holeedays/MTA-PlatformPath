import { DataFetch } from "./data_fetch.js";
export class PathFinder {
    dataFetch;
    stationCache;
    constructor() {
        this.dataFetch = new DataFetch();
        this.stationCache = {};
    }
    async fetchStation(stationName) {
        // Return cached version if we already have it
        const cachedStation = this.stationCache[stationName];
        if (cachedStation) {
            return cachedStation;
        }
        const data = await this.dataFetch.fetchEdgesNodes([stationName], '/platformPathAPI/fetchEdgesNodes');
        if (!data || !data[stationName]) {
            console.error('Station not found in response:', stationName);
            return null;
        }
        // Cache it so we don't re-fetch
        const station = data[stationName];
        this.stationCache[stationName] = station;
        return station;
    }
    findPath(station, fromNodeId, toNodeId, isAccessible = false) {
        const adjAndNode = this.getAdjacencyAndNodeMap(station, isAccessible);
        // check if something went wrong retrieving the adjacency and node maps (should return null)
        if (adjAndNode === null)
            return null;
        const adjacency = adjAndNode[0];
        const nodeMap = adjAndNode[1];
        // BFS for pathfinding paths
        const visited = new Set();
        const startNode = nodeMap[fromNodeId];
        if (!startNode) {
            console.error(`Start node not found: ${fromNodeId}`);
            return null;
        }
        const initialStep = {
            svgId: startNode.svg_id,
            layer: startNode.layer,
            instruction: 'Start here'
        };
        const queue = [[fromNodeId, [initialStep]]];
        while (queue.length > 0) {
            const item = queue.shift();
            if (!item)
                break;
            const [currentNodeId, path] = item;
            if (currentNodeId === toNodeId)
                return path;
            if (visited.has(currentNodeId))
                continue;
            visited.add(currentNodeId);
            const neighbors = adjacency[currentNodeId] || [];
            neighbors.forEach(({ neighbor, instruction }) => {
                if (!visited.has(neighbor)) {
                    const targetNode = nodeMap[neighbor];
                    if (!targetNode)
                        return;
                    queue.push([neighbor, [...path, {
                                svgId: targetNode.svg_id,
                                layer: targetNode.layer,
                                instruction: instruction
                            }]]);
                }
            });
        }
        console.warn(`No path found from ${fromNodeId} to ${toNodeId}`);
        return null;
    }
    // get adjacency and Nodemap
    getAdjacencyAndNodeMap(station, isAccessible = false) {
        // Build node lookup map
        const nodeMap = {};
        station.node_models.forEach(node => {
            nodeMap[node.id] = node;
        });
        // Build adjacency map
        const adjacency = {};
        station.edge_models.forEach((edge) => {
            if (!edge.is_active)
                return null;
            const fromNode = nodeMap[edge.from_node];
            const toNode = nodeMap[edge.to_node];
            // checks
            if (!fromNode || !toNode)
                return null;
            if (isAccessible && !fromNode.is_accessible)
                return null;
            if (isAccessible && !toNode.is_accessible)
                return null;
            // addressing for reverese directions (a -> b, b -> a)
            const fromNeighbors = adjacency[edge.from_node] ?? [];
            const toNeighbors = adjacency[edge.to_node] ?? [];
            adjacency[edge.from_node] = fromNeighbors;
            adjacency[edge.to_node] = toNeighbors;
            fromNeighbors.push({
                neighbor: edge.to_node,
                instruction: edge.instruction_forward
            });
            toNeighbors.push({
                neighbor: edge.from_node,
                instruction: edge.instruction_backward
            });
        });
        return [adjacency, nodeMap];
    }
}
//# sourceMappingURL=path_finder.js.map