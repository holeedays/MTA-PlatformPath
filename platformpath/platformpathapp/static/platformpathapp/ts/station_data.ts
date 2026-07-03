import { DataFetch } from "./data_fetch_new.ts";

export interface LayerData {
    id: number;
    name: string;
    layerOrder: number;
    color: string;
    svg_id: string;
}

export interface NodeData {
    id: number;
    node_type: string;
    label: string;
    svg_id: string;
    layer: number;
    is_accessible: boolean;
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

export class StationData {
    constructor() {}

    public async fetchStation(stationId: number): Promise<StationResponse | null> {

        const data = await DataFetch.fetchEdgesNodes(stationId);

        console.log(data);

        if (!data) {
            console.error('Station not found in response:', stationId);
            return null;
        }

        const station = data as StationResponse;
        return station;
    }
}