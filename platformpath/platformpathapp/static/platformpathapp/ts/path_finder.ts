import { type StationResponse, type NodeData, type VerticalDirection } from "./station_data.ts"

export interface RouteTraversal {
    fromNodeId: number;
    toNodeId: number;
    verticalDirection: VerticalDirection;
}

export interface PathStep {
    svgId: string;
    layer: string;
    instruction: string;
    traversal?: RouteTraversal;
}

interface Neighbor {
    neighbor: number;
    instruction: string;
    verticalDirection: VerticalDirection;
}

export class PathFinder {

    constructor() {}

    public findPath(
        station: StationResponse,
        fromNodeId: number,
        toNodeId: number,
        isAccessible: boolean = false
    ): PathStep[] | null {

        const adjAndNode = this.getAdjacencyAndNodeMap(station, isAccessible);
        // check if something went wrong retrieving the adjacency and node maps (should return null)
        if (adjAndNode === null)
            return null;

        const adjacency = adjAndNode[0];
        const nodeMap = adjAndNode[1];

        // Build a layer lookup map to translate integer Layer IDs to string svg
        const layerMap: Record<number, string> = {};
        if (station.layer_models) {
            station.layer_models.forEach(layer => {
                layerMap[layer.id] = layer.svg_id;
            });
        } else {
            console.error('Layer models not found in station data');
            return null;
        }

        // BFS for pathfinding paths
        const visited   = new Set<number>();
        const startNode = nodeMap[fromNodeId];

        if (!startNode) {
            console.error(`Start node not found: ${fromNodeId}`);
            return null;
        }

        const initialStep: PathStep = {
            svgId:       startNode.svg_id,
            layer:       layerMap[startNode.layer] || "",
            instruction: 'Start here'
        };

        const queue: [number, PathStep[]][] = [[fromNodeId, [initialStep]]];

        while (queue.length > 0) {
            const item = queue.shift();
            if (!item) break;

            const [currentNodeId, path] = item;

            if (currentNodeId === toNodeId) return path;
            if (visited.has(currentNodeId)) continue;
            visited.add(currentNodeId);

            const neighbors = adjacency[currentNodeId] || [];
            neighbors.forEach(({ neighbor, instruction, verticalDirection }) => {
                if (!visited.has(neighbor)) {
                    const targetNode = nodeMap[neighbor];
                    if (!targetNode) return;

                    queue.push([neighbor, [...path, {
                        svgId:       targetNode.svg_id,
                        layer:       layerMap[targetNode.layer] || "",
                        instruction: instruction,
                        traversal: {
                            fromNodeId: currentNodeId,
                            toNodeId: neighbor,
                            verticalDirection: verticalDirection,
                        }
                    }]]);
                }
            });
        }

        console.warn(`No path found from ${fromNodeId} to ${toNodeId}`);
        return null;
    }

    // get adjacency and Nodemap
    private getAdjacencyAndNodeMap(
        station: StationResponse,
        isAccessible: boolean = false
    ): [Record<number, Neighbor[]>, Record<number, NodeData>] | null {
          // Build node lookup map
        const nodeMap: Record<number, NodeData> = {};
        station.node_models.forEach(node => {
            nodeMap[node.id] = node;
        });

        // Build adjacency map
        const adjacency: Record<number, Neighbor[]> = {};

        station.edge_models.forEach((edge) => {
            if (!edge.is_active) return null;

            const fromNode = nodeMap[edge.from_node];
            const toNode   = nodeMap[edge.to_node];

            // checks if the nodes exist
            if (!fromNode || !toNode) return null;

            if (isAccessible && !fromNode.is_accessible) return null;
            if (isAccessible && !toNode.is_accessible)   return null;

            // addressing for reverese directions (a -> b, b -> a)
            const fromNeighbors = adjacency[edge.from_node] ?? [];
            const toNeighbors = adjacency[edge.to_node] ?? [];
            adjacency[edge.from_node] = fromNeighbors;
            adjacency[edge.to_node] = toNeighbors;

            fromNeighbors.push({
                neighbor:    edge.to_node,
                instruction: edge.instruction_forward,
                verticalDirection: edge.forward_vertical_direction
            });
            toNeighbors.push({
                neighbor:    edge.from_node,
                instruction: edge.instruction_backward,
                verticalDirection: this.reverseDirection(edge.forward_vertical_direction)
            });
        });

        return [adjacency, nodeMap];
    }
    
    // Helper function for getting the direction of the stairs
    private reverseDirection(direction: VerticalDirection): VerticalDirection {
    switch (direction) {
        case "UP":
            return "DOWN";
        case "DOWN":
            return "UP";
        default:
            return "NONE";
    }
}
}
