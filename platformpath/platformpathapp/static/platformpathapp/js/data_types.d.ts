export declare class MasterNode {
    private _name;
    private _fName;
    private _edges;
    constructor(name?: string, fName?: string, edges?: Edge[]);
    get name(): string | null;
    set name(newName: string | undefined);
    get fName(): string | null;
    set fName(newFName: string | undefined);
    get edges(): Edge[] | null;
    set edges(newEdgesArray: Edge[] | undefined);
}
export declare class Node {
    private _name;
    private _nodeType;
    private _layerID;
    private _label;
    private _svgID;
    constructor(name?: string, nodeType?: NodeType, layerID?: string, label?: string, svgID?: string);
    get name(): string | null;
    set name(newName: string | undefined);
    get nodeType(): NodeType | null;
    set nodeType(newNodeType: NodeType | undefined);
    get layerID(): string | null;
    set layerID(newLayerID: string | undefined);
    get label(): string | null;
    set label(newLabel: string | undefined);
    get svgID(): string | null;
    set svgID(newID: string | undefined);
}
export declare class Edge {
    private _nodeFrom;
    private _nodeTo;
    private _instructions;
    private _svgID?;
    constructor(nodeFrom?: Node, nodeTo?: Node, instructions?: string);
    get nodeFrom(): Node | null;
    set nodeFrom(newNode: Node | undefined);
    get nodeTo(): Node | null;
    set nodeTo(newNode: Node | undefined);
    get svgID(): string | undefined;
    set svgID(newID: string | undefined);
    get instructions(): string | null;
    set instructions(newInstructions: string | undefined);
}
export declare class NodeType {
    static MEZZANINE: string;
    static STAIRS: string;
    static PLATFORM: string;
}
//# sourceMappingURL=data_types.d.ts.map