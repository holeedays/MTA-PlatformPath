import { type StationResponse, type NodeData, type EdgeData, type LayerData } from "./station_data.ts"

export interface PathStep {
    node: NodeData;
    layer: LayerData;
    instruction: string;
    incomingEdge?: EdgeData; // The edge that leads to this step
}

export type AccessibilityOption = "none" | "accessible-only" | "avoid-accessible";

/*
    This class is used for finding paths between nodes in the station graph
    given a starting node and an ending node.
*/
export class PathFinder {

    constructor() {}

    public findPath(
        station: StationResponse,
        fromNodeId: number,
        toNodeId: number,
        isAccessible: AccessibilityOption = "none"
    ): PathStep[] | null {
        
        /*
            Get adjacency map and node maps
            The adjacency map shows the neighbors of each node
            The node map contains the data for each node in the station
        */
        const adjAndNode: [
            Record<number,EdgeData[]>, Record<number,NodeData>
        ] | null = this.getAdjacencyAndNodeMap(station, isAccessible);
        if (adjAndNode === null)
            return null;

        const adjacencyMap: Record<number,EdgeData[]> = adjAndNode[0];
        const nodeMap: Record<number,NodeData> = adjAndNode[1];

        /* 
            Build a layer lookup map to translate the Layer ID (which is an int) to the layer data obj 
            Example: database layer 3 -> layer data obj: {id: 3, SVG group "MEZZANINE", order: 1, ...}
        */
        const layerMap: Record<number, LayerData> = {};
        if (station.layers) {
            station.layers.forEach((layer: LayerData)=> {
                layerMap[layer.id] = layer;
            });
        } else {
            console.error('Layer models not found in station data');
            return null;
        }

        // Breadth-first Search algorithm used to find a path between the two nodes
        
        // create a hash set to track nodes that have already been visited to prevent loops
        const visited = new Set<number>();
        
        // Get starting node's information to create the first step of the path as well as the corresponding layer 
        const startNode: NodeData | undefined = nodeMap[fromNodeId];
        const layer: LayerData | undefined = layerMap[startNode?.layer || 0];
        if (startNode === undefined || layer === undefined) {
            console.error(`Start node not found: ${fromNodeId} and/or layer not found: ${startNode?.layer}`);
            return null;
        }
        const initialStep: PathStep = {
            node:       startNode,
            layer:       layer,
            instruction: 'Start here'
        };

        /*
            This queue stores the next node that should be searched

            Each item contains:
                - a current node ID
                - the path to that node as an array of PathSteps
        */
        const queue: [number, PathStep[]][] = [[fromNodeId, [initialStep]]];

        /*
            The loop will continue to search for the final node until the
            destination node has been reached or there are no more nodes to search
        */
        while (queue.length > 0) {
            const item = queue.shift();
            if (!item) break;

            const [currentNodeId, path] = item;

            // The path is returned when is destination node is reached
            if (currentNodeId === toNodeId) {
                return path;
            }

            // If this node is already visited, skip it
            if (visited.has(currentNodeId)) {
                continue;
            }

            // Mark this node as searched
            visited.add(currentNodeId);

            /*
                Get the outgoing edges for the current node and prepare them to
                be searched by creating a new step for them and adding it to the path
                Once they are properly prepared, they are added to the queue
            */
            const outgoingEdges = adjacencyMap[currentNodeId] || [];
            outgoingEdges.forEach((edge: EdgeData) => {
                // Edges that have already been searched are not added
                if (visited.has(edge.to_node)) {
                    return;
                }

                const targetNode: NodeData | undefined = nodeMap[edge.to_node];
                const targetLayer: LayerData | undefined = layerMap[targetNode?.layer || 0];
                if (targetNode === undefined || targetLayer === undefined) {
                    return;
                }

                const nextStep: PathStep = {
                    node: targetNode,
                    layer: targetLayer,
                    instruction: edge.instruction,
                    incomingEdge: edge,
                };

                queue.push([
                    edge.to_node,
                    [...path, nextStep],
                ]);
            });
        }

        /* Possibliy want to display somewhere like the preview box that no path was found */
        console.warn(`No path found from ${fromNodeId} to ${toNodeId}`);
        return null;
    }

    /*
        A helper function to build the adjacency map and node map

        Definitions:
            Adjacency map - A dictionary mapping each node to its outgoing edges
            Node map - A dictionary mapping each node ID to its corresponding node data
    */
    private getAdjacencyAndNodeMap(
        station: StationResponse,
        isAccessible: AccessibilityOption = "none"
    ): [Record<number, EdgeData[]>, Record<number, NodeData>] | null {
        
        // Build node lookup map by looping through every node in the station
        const nodeMap: Record<number, NodeData> = {};
        station.nodes.forEach(node => {
            nodeMap[node.id] = node;
        });

        /*
            Build adjacency map by looping thorugh every edge in the station
            and organizing them based on the fromNode of the edge
        */
        const adjacency: Record<number, EdgeData[]> = {};

        station.edges.forEach((edge: EdgeData) => {
            // inactive edges are will not be considered for the route
            if (!edge.is_active) return null;

            // get the nodes corresponding to the edge
            const fromNode: NodeData | undefined = nodeMap[edge.from_node];
            const toNode: NodeData | undefined = nodeMap[edge.to_node];

            // checks if the nodes exist; if not exit the fn and return null
            if (fromNode === undefined || toNode === undefined) 
                return null;

            /*
                By default all nodes are considered for the route, 
                so if the user has not selected any accessibility options, 
                then all edges are considered
            */
            
            /*
                If the user wants to avoid accessible nodes, then if either 
                the fromNode or toNode is accessible infrastructure, this edge is skipped
            */
            if (
                isAccessible === "avoid-accessible" &&
                (fromNode.is_accessible_infrastructure || toNode.is_accessible_infrastructure) 
            )
                return;

            // check if node is accessible if accessible option is enabled
            // if it is not and the accessible option is enabled this iteration of the loop is skipped
            if (
                isAccessible === "accessible-only" &&
                (this.isNotAccessible(fromNode) || this.isNotAccessible(toNode))
            ) {
                return;
            }

            const outgoingEdges = adjacency[edge.from_node] ?? [];
            outgoingEdges.push(edge);
            adjacency[edge.from_node] = outgoingEdges;
        });

        return [adjacency, nodeMap];
    }

    // method to determine if a node is not accessible
    private isNotAccessible(node: NodeData): boolean {
        return "STRS" in node.types_dict || "STRS_EXT" in node.types_dict;
    }
}
