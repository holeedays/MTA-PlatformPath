// stations
export class MasterNode {
    private _name: string | null;
    private _fName: string | null;
    private _edges: Edge[] | null;

    constructor(name?: string, fName?: string, edges?: Edge[]) {
        this._name = name || null; 
        this._fName = fName || null;
        this._edges = edges || null;
    }


    get name(): string | null {
        return this._name;
    }
    set name(newName: string | undefined) {
        if (newName === undefined) {
            console.error("Setting name failed");
            return;
        }
        this._name = newName;
    }

    get fName(): string | null {
        return this._fName;
    }
    set fName(newFName: string | undefined) {
        if (newFName === undefined) {
            console.error("Setting file name failed");
            return;
        }
        this._fName = newFName;
    }

    get edges(): Edge[] | null {
        return this._edges;
    }
    set edges(newEdgesArray: Edge[] | undefined) {
        if (newEdgesArray === undefined) {
            console.error("Setting edges failed");
            return;
        }
        this._edges = newEdgesArray;
    }
}

// all platforms, stairs, ramps, etc
export class Node {
    private _name: string | null;
    private _nodeType: NodeType | null;
    private _layerID: string | null;
    private _label: string | null;
    private _svgID: string | null;

    constructor(name?: string, nodeType?: NodeType, layerID?: string, label?: string, svgID?: string) {
        // this is to enforce that the param is indeed using the enum in NodeType at least
        // until we switch to typescript for handling
        this._name = name || null;
        this._nodeType = null;
        if (nodeType !== undefined && nodeType instanceof NodeType)
            this._nodeType = nodeType;

        this._layerID = layerID || null;
        this._label = label || null;
        this._svgID = svgID || null;
    }

    get name(): string | null {
        return this._name;
    }
    set name(newName: string | undefined) {
        if (newName === undefined) {
            console.error("Setting new name failed");
            return;
        }
        this._name = newName;
    }

    get nodeType(): NodeType | null {
        return this._nodeType;
    }
    set nodeType(newNodeType: NodeType | undefined) {
        if (newNodeType === undefined || !(newNodeType instanceof NodeType)) {
            console.error("Setting new node type failed");
            return;
        }
        this._nodeType = newNodeType;
    }

    get layerID(): string | null {
        return this._layerID;
    }
    set layerID(newLayerID: string | undefined) {
        if (newLayerID === undefined) {
            console.error("Setting new node type failed");
            return;
        }
        this._layerID = newLayerID;
    }

    get label(): string | null {
        return this._label;
    }
    set label(newLabel: string | undefined) {
        if (newLabel === undefined) {
            console.error("Setting new label failed");
            return;
        }
        this._label = newLabel;
    }

    get svgID(): string | null {
        return this._svgID;
    }
    set svgID(newID: string | undefined) {
        if (newID === undefined) {
            console.error("Setting new svg id failed");
            return;
        }
        this._svgID = newID;
    }
}

// adjacent pathways between nodes
export class Edge {
    private _nodeFrom: Node | null;
    private _nodeTo: Node | null;
    private _instructions: string | null;
    private _svgID?: string; // Added because it's used in getter/setter but not in constructor

    constructor(nodeFrom?: Node, nodeTo?: Node, instructions?: string) {
        this._nodeFrom = null;
        if (nodeFrom !== undefined && nodeFrom instanceof Node)
            this._nodeFrom = nodeFrom;
        
        this._nodeTo = null;
        if (nodeTo !== undefined && nodeTo instanceof Node)
            this._nodeTo = nodeTo;

        this._instructions = instructions || null;
    }

    get nodeFrom(): Node | null {
        return this._nodeFrom;
    }
    set nodeFrom(newNode: Node | undefined) {
        if (newNode === undefined || !(newNode instanceof Node)) {
            console.error("Setting new node from failed");
            return;
        }
        this._nodeFrom = newNode;
    }

    get nodeTo(): Node | null {
        return this._nodeTo;
    }
    set nodeTo(newNode: Node | undefined) {
        if (newNode === undefined || !(newNode instanceof Node)) {
            console.error("Setting new node to failed");
            return;
        }
        this._nodeTo = newNode;
    }

    get svgID(): string | undefined {
        return this._svgID;
    }
    set svgID(newID: string | undefined) {
        if (newID === undefined) {
            console.error("Setting new id failed");
            return;
        }
        this._svgID = newID;
    }

    get instructions(): string | null {
        return this._instructions
    }
    set instructions(newInstructions: string | undefined) {
        if (newInstructions === undefined) {
            console.error("Setting new instructions failed");
            return;
        }
        this._instructions = newInstructions;
    }
}

// enum class to identify nodes
export class NodeType {
    static MEZZANINE = "Mezzazine";
    static STAIRS = "Stairs";
    static PLATFORM = "Platform";
}
