// stations
export class MasterNode {
    _name;
    _fName;
    _edges;
    constructor(name, fName, edges) {
        this._name = name || null;
        this._fName = fName || null;
        this._edges = edges || null;
    }
    get name() {
        return this._name;
    }
    set name(newName) {
        if (newName === undefined) {
            console.error("Setting name failed");
            return;
        }
        this._name = newName;
    }
    get fName() {
        return this._fName;
    }
    set fName(newFName) {
        if (newFName === undefined) {
            console.error("Setting file name failed");
            return;
        }
        this._fName = newFName;
    }
    get edges() {
        return this._edges;
    }
    set edges(newEdgesArray) {
        if (newEdgesArray === undefined) {
            console.error("Setting edges failed");
            return;
        }
        this._edges = newEdgesArray;
    }
}
// all platforms, stairs, ramps, etc
export class Node {
    _name;
    _nodeType;
    _layerID;
    _label;
    _svgID;
    constructor(name, nodeType, layerID, label, svgID) {
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
    get name() {
        return this._name;
    }
    set name(newName) {
        if (newName === undefined) {
            console.error("Setting new name failed");
            return;
        }
        this._name = newName;
    }
    get nodeType() {
        return this._nodeType;
    }
    set nodeType(newNodeType) {
        if (newNodeType === undefined || !(newNodeType instanceof NodeType)) {
            console.error("Setting new node type failed");
            return;
        }
        this._nodeType = newNodeType;
    }
    get layerID() {
        return this._layerID;
    }
    set layerID(newLayerID) {
        if (newLayerID === undefined) {
            console.error("Setting new node type failed");
            return;
        }
        this._layerID = newLayerID;
    }
    get label() {
        return this._label;
    }
    set label(newLabel) {
        if (newLabel === undefined) {
            console.error("Setting new label failed");
            return;
        }
        this._label = newLabel;
    }
    get svgID() {
        return this._svgID;
    }
    set svgID(newID) {
        if (newID === undefined) {
            console.error("Setting new svg id failed");
            return;
        }
        this._svgID = newID;
    }
}
// adjacent pathways between nodes
export class Edge {
    _nodeFrom;
    _nodeTo;
    _instructions;
    _svgID; // Added because it's used in getter/setter but not in constructor
    constructor(nodeFrom, nodeTo, instructions) {
        this._nodeFrom = null;
        if (nodeFrom !== undefined && nodeFrom instanceof Node)
            this._nodeFrom = nodeFrom;
        this._nodeTo = null;
        if (nodeTo !== undefined && nodeTo instanceof Node)
            this._nodeTo = nodeTo;
        this._instructions = instructions || null;
    }
    get nodeFrom() {
        return this._nodeFrom;
    }
    set nodeFrom(newNode) {
        if (newNode === undefined || !(newNode instanceof Node)) {
            console.error("Setting new node from failed");
            return;
        }
        this._nodeFrom = newNode;
    }
    get nodeTo() {
        return this._nodeTo;
    }
    set nodeTo(newNode) {
        if (newNode === undefined || !(newNode instanceof Node)) {
            console.error("Setting new node to failed");
            return;
        }
        this._nodeTo = newNode;
    }
    get svgID() {
        return this._svgID;
    }
    set svgID(newID) {
        if (newID === undefined) {
            console.error("Setting new id failed");
            return;
        }
        this._svgID = newID;
    }
    get instructions() {
        return this._instructions;
    }
    set instructions(newInstructions) {
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
//# sourceMappingURL=_data_types.js.map