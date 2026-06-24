import { DataFetch } from "./data_fetch.ts";
import { type StationResponse, type NodeData } from "./station_data.ts"

export interface PathStep {
    svgId: string;
    layer: string;
    instruction: string;
}

export class PathFinder {
    private stationCache: Record<string, StationResponse>;

    constructor() {
        this.stationCache = {};
    }

    // FIX: fetchStation should probably be taking in a station ID instead of a name and will
    // probably have to move to using data_fetch_new instead of data_fetch
    public async fetchStation(stationName: string): Promise<StationResponse | null> {
        // Return cached version if we already have it
        const cachedStation = this.stationCache[stationName];
        if (cachedStation) {
            return cachedStation;
        }

        const data = await DataFetch.fetchEdgesNodes(
            [stationName],
            '/test/platformPathAPI/fetchEdgesNodes'
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

    // FIX: ok this method below to get svg feels super out of place. In fact fetch stations
    // should not be in this class at all. There should be a centralized place (maybe another class)
    // to get station information and store it so that it is available to the classes that need it
    // For now this is a place holder to as a way to load the svg based on the station name
    
    // additionally this function also assumes that fetch station for the station that we need the svg
    // for is already called and will return an error otherwise. It will not make another fetch request.
    // not the best but it is just a placeholder
    public fetchStationSVG(stationName: string): string {
        const station = this.stationCache[stationName];
        if (!station) {
            console.error('Station not found in cache:', stationName);
            return '';
        }
        return station.station_model.diagram_path;
    }

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

        // BFS for pathfinding paths
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

    // get adjacency and Nodemap
    private getAdjacencyAndNodeMap(
        station: StationResponse,
        isAccessible: boolean = false
    ): [Record<number, {neighbor: number; instruction: string}[]>, Record<number, NodeData>] | null {
          // Build node lookup map
        const nodeMap: Record<number, NodeData> = {};
        station.node_models.forEach(node => {
            nodeMap[node.id] = node;
        });

        // Build adjacency map
        const adjacency: Record<number, { neighbor: number; instruction: string }[]> = {};

        station.edge_models.forEach((edge) => {
            if (!edge.is_active) return null;

            const fromNode = nodeMap[edge.from_node];
            const toNode   = nodeMap[edge.to_node];

            // checks
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
                instruction: edge.instruction_forward
            });
            toNeighbors.push({
                neighbor:    edge.from_node,
                instruction: edge.instruction_backward
            });
        });

        return [adjacency, nodeMap];
    }   
}
