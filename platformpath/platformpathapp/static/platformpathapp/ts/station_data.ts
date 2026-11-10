import { type Extents } from "./geolocation.ts";

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
    lines: string[],
    accessible_station: boolean
}

export interface StationMapData {
    id: number,
    extents: Extents,
    road_map_low_res_imgs: Record<string,string>,
    satellite_map_low_res_imgs: Record<string,string>,
    road_map_high_res_imgs: Record<string,Record<string,string>>,
    satellite_map_high_res_imgs: Record<string,Record<string,string>>
}

export interface StationResponse {
    station: StationData,
    edges: EdgeData[],
    nodes: NodeData[],
    layers: LayerData[],
    station_map: StationMapData
}
