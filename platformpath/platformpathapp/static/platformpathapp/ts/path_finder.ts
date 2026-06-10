import { DataFetch } from "./data_fetch.ts";

interface NodeData {
    id: number;
    node_type: string;
    label: string;
    svg_id: string;
    layer: string;
    is_accessible: boolean;
}

interface EdgeData {
    from_node: number;
    to_node: number;
    instruction_forward: string;
    instruction_backward: string;
    is_active: boolean;
}

export interface StationResponse {
    station_model: { name: string; diagram_path: string; };
    edge_models: EdgeData[];
    node_models: NodeData[];
}

export interface PathStep {
    svgId: string;
    layer: string;
    instruction: string;
}

export class PathFinder {
    private dataFetch: DataFetch;
    private stationCache: Record<string, StationResponse>;

    constructor() {
        this.dataFetch   = new DataFetch();
        this.stationCache = {};
    }

    public async fetchStation(stationName: string): Promise<StationResponse | null> {
        // Return cached version if we already have it
        const cachedStation = this.stationCache[stationName];
        if (cachedStation) {
            return cachedStation;
        }

        const data = await this.dataFetch.fetchEdgesNodes(
            [stationName],
            '/platformPathAPI/fetchEdgesNodes'
        );

        if (!data || !data[stationName]) {
            console.error('Station not found in response:', stationName);
            return null;
        }

        // Cache it so we don't re-fetch
        const station = data[stationName] as StationResponse;
        this.stationCache[stationName] = station;
        return station;
    }

    public findPath(
        station: StationResponse,
        fromNodeId: number,
        toNodeId: number,
        accessible: boolean = false
    ): PathStep[] | null {

        // Build node lookup map
        const nodeMap: Record<number, NodeData> = {};
        station.node_models.forEach(node => {
            nodeMap[node.id] = node;
        });

        // Build adjacency map
        const adjacency: Record<number, { neighbor: number; instruction: string }[]> = {};

        station.edge_models.forEach((edge) => {
            if (!edge.is_active) return;

            const fromNode = nodeMap[edge.from_node];
            const toNode   = nodeMap[edge.to_node];

            // checks
            if (!fromNode || !toNode) return;

            if (accessible && !fromNode.is_accessible) return;
            if (accessible && !toNode.is_accessible)   return;

            // addressing for reverese directions (a -> b, b -> a)
            const fromNeighbors = adjacency[edge.from_node] ?? [];
            const toNeighbors = adjacency[edge.to_node] ?? [];
            adjacency[edge.from_node] = fromNeighbors;
            adjacency[edge.to_node] = toNeighbors;

            fromNeighbors.push({
                neighbor:    edge.to_node,
                instruction: edge.instruction_forward
            });
            toNeighbors.push({
                neighbor:    edge.from_node,
                instruction: edge.instruction_backward
            });
        });

        // BFS
        const visited   = new Set<number>();
        const startNode = nodeMap[fromNodeId];

        if (!startNode) {
            console.error(`Start node not found: ${fromNodeId}`);
            return null;
        }

        const initialStep: PathStep = {
            svgId:       startNode.svg_id,
            layer:       startNode.layer,
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
            neighbors.forEach(({ neighbor, instruction }) => {
                if (!visited.has(neighbor)) {
                    const targetNode = nodeMap[neighbor];
                    if (!targetNode) return;

                    queue.push([neighbor, [...path, {
                        svgId:       targetNode.svg_id,
                        layer:       targetNode.layer,
                        instruction: instruction
                    }]]);
                }
            });
        }

        console.warn(`No path found from ${fromNodeId} to ${toNodeId}`);
        return null;
    }
}
