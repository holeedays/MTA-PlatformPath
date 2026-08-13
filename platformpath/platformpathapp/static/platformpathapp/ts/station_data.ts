export interface LayerData {
    id: number;
    name: string;
    layerOrder: number;
    color: string;
    svg_id: string;
}

export interface NodeData {
    id: number;
    label: string;
    svg_id: string;
    layer: number;
    is_accessible_infrastructure: boolean;
    types_dict: Record<string,string>;
}

export type VerticalDirection = "NONE" | "UP" | "DOWN"

export interface EdgeData {
    id: number
    from_node: number;
    to_node: number;
    instruction: string;
    vertical_direction: VerticalDirection;
    is_active: boolean;
}

export interface StationData {
    name: string,
    id: number,
    diagram_path: string,
    diagram_rotated_path: string | null, // diagram rotated path can be null (since in the db it is nullable for now)
    lines: string[],
    accessible_station: boolean
}

export interface StationResponse {
    station_model: StationData;
    edge_models: EdgeData[];
    node_models: NodeData[];
    layer_models: LayerData[];
}
