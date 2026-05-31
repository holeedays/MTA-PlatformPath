// stations
export class MasterNode {
    constructor(name, fName, edges) {
        this._name = name || null; 
        this._fName = fName || null;
        this._edges = edges || null;
    }


    get name() {
        return this._name;
    }
    set name(newName) {
        if (newName === undefined)
            return console.error("Setting name failed");
        this._name = newName;
    }

    get fName() {
        return this._fName;
    }
    set fName(newFName) {
        if (newFName === undefined)
            return console.error("Setting file name failed");
        this._fName = newFName;
    }

    get edges() {
        return this._edges;
    }
    set edges(newEdgesArray) {
        if (newEdgesArray === undefined)
            return console.error("Setting edges failed");
        this._edges = newEdgesArray;
    }
}

// all platforms, stairs, ramps, etc
export class Node {
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
        if (newName === undefined)
            return console.error("Setting new name failed");
        this._name = newName;
    }

    get nodeType() {
        return this._nodeType;
    }
    set nodeType(newNodeType) {
        if (newNodeType === undefined || !(newNodeType instanceof NodeType))
            return console.error("Setting new node type failed");
        this._label = newNodeType;
    }

    get layerID() {
        return this._layerID;
    }
    set layerID(newLayerID) {
        if (newLayerID === undefined)
            return console.error("Setting new node type failed");
        this._layerID = newLayerID;
    }

    get label() {
        return this._label;
    }
    set label(newLabel) {
        if (newLabel === undefined)
            return console.error("Setting new label failed");
        this._label = newLabel;
    }

    get svgID() {
        return this._svgID;
    }
    set svgID(newID) {
        if (newID === undefined)
            return console.error("Setting new svg id failed");
        this._svgID = newID;
    }
}

// adjacent pathways between nodes
export class Edge {
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
        if (newNode === undefined || !(newNode instanceof Node))
            return console.error("Setting new node from failed");
        this._nodeFrom = newNode;
    }

    get nodeTo() {
        return this._nodeTo;
    }
    set nodeTo(newNode) {
        if (newNode === undefined || !(newNode instanceof Node))
            return console.error("Setting new node to failed");
        this._nodeTo = newNode;
    }

    get svgID() {
        return this._svgID;
    }
    set svgID(newID) {
        if (newID === undefined)
            return console.error("Setting new id failed");
        this._svgID = newID;
    }

    get instructions() {
        return this._instructions
    }
    set instructions(newInstructions) {
        if (newInstructions === undefined)
            return console.error("Setting new instructions failed");
        this._instructions = newInstructions;
    }
}

// enum class to identify nodes
export class NodeType {
    static MEZZANINE = "Mezzazine";
    static STAIRS = "Stairs";
    static PLATFORM = "Platform";
}
