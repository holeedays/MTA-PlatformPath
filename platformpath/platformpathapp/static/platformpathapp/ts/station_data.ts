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
    is_accessible: boolean;
    types_dict: Map<string,string>;
}

export interface EdgeData {
    from_node: number;
    to_node: number;
    instruction_forward: string;
    instruction_backward: string;
    is_active: boolean;
}

export interface StationResponse {
    station_model: { name: string; id: number; diagram_path: string; lines: string[]; };
    edge_models: EdgeData[];
    node_models: NodeData[];
    layer_models: LayerData[];
}
