// Contains all functions related to rendering the svg diagrams

import { type LayerData, type StationMapData } from "./station_data.ts";
import { NodeSVG } from "./station_custom_elements.ts";
import { NodeOption } from "./station_custom_elements.ts"
import { getCurrentTransformMatrix, getElementCentersOffset, boundingRectsAreIntersecting, Vector2 } from "./transformations.ts";
import { clamp, normalizeAngle, lerp, AngleType } from "./numeric_utils.ts";
// import panzoom, {type PanZoom} from "panzoom"; // toggle this off when running server since panzoom has a problem with es6 modules

export type SelectionRole = "start" | "end";
export enum MapView {
    DEFAULT,
    ROAD,
    SATELLITE
}

export class SvgRenderer {
    // @ts-ignore
    public currentPanZoom: PanZoom | null = null;

    public diagramContainer: HTMLDivElement | null = null;
    public SVGWrapper: HTMLDivElement | null = null;
    public SVG: SVGSVGElement | null = null;
    public stationSVG: SVGGraphicsElement | null = null;

    public GPSMarker: {GPSElement: SVGSVGElement, visionCone: SVGGraphicsElement} | null = null;
    public GPSMarkerInstantiating: boolean = false;
    public GPSMarkerSpawned: boolean = false;

    public currentMapView: MapView = MapView.DEFAULT;

    public dynamicElements: {
        omnidirectionalRotElements: SVGGraphicsElement[],
        bidirectionalRotElementsMap: Map<number,SVGGraphicsElement[]>,
        scalarLogoElements: SVGGraphicsElement[],
        scalarLabelElements: SVGGraphicsElement[],
        otherScalarElements: SVGGraphicsElement[],
        allRotationOrScalarElements: SVGGraphicsElement[],
        gridCellRoadMapImgCache: Map<SVGGraphicsElement,SVGImageElement>,
        gridCellSatelliteMapImgCache: Map<SVGGraphicsElement,SVGImageElement>
    } | null = null;
    public map: {
        elements: {
            parent: SVGGraphicsElement, 
            gridCells: [SVGGraphicsElement, SVGGraphicsElement[]][],
            roadMapGroup: SVGGraphicsElement, 
            satelliteMapGroup: SVGGraphicsElement
        },
        data: StationMapData
    } | null = null;

    public isPanning: boolean = false;
    public rotOrScalarElementsDisabled: boolean = false;
    public activeZoomingCalls: number = 0;
    public activeCenteringCalls: number = 0;
    public ignorePanzoomEvents: boolean = false;

    public mapRotationSensitivity: number = 0;
    public highResImgLoadZoomThreshold: number = 0;
    public dynamicElementsRotationDegMapIncrement: number = 0;
    // unlike the above numerical values, min zoom is not initialized in the constructor so made this possibly null to make
    // sure the value is initialized when called for use
    public minZoom: number | null = null;

    constructor(
        mapRotationalSensitivity: number = 0.5, 
        highResImgLoadZoomThreshold: number = 2, 
        dynamicElementsRotationDegMapIncrement: number = 10
    ) {
        // init some variables that we can modify during constructor creation
        this.mapRotationSensitivity = mapRotationalSensitivity;
        this.highResImgLoadZoomThreshold = highResImgLoadZoomThreshold;
        this.DynamicElementsRotationDegMapIncrement = dynamicElementsRotationDegMapIncrement;

        // init diagram contaier field
        this.initDiagramContainerField();
        // init our svg wrapper field
        this.initSVGWrapperField();
    }

    // have a setter for dynamicElementsRotationMapIncrement to prevent putting in a random increment for the value
    // (which can break the rotation logic)
    set DynamicElementsRotationDegMapIncrement(value: number) {
        const minRotDegIncrement: number = 10;
        const maxRotDegIncrement: number = 360;

        if (maxRotDegIncrement % value !== 0 || value < minRotDegIncrement || value > maxRotDegIncrement) {
            console.warn(
                `Cannot set given value: ${value} to DynamicElementsRotationDegMapIncrement`,
                `The value must be in range [${minRotDegIncrement},${maxRotDegIncrement}] and has to be a factor of ${maxRotDegIncrement}`
            );
            return;
        }

        this.dynamicElementsRotationDegMapIncrement = value;
    }

    // find the diagram container and assigns a reference to it for our diagramContainer field
    private initDiagramContainerField(): void {
        this.diagramContainer = document.querySelector('#diagram-container');
        if (this.diagramContainer === null)
            console.warn("There is no diagram container on the current page");
    }

    // finds the container that will hold our svg contents and assigns it to our SVGWrapper field
    private initSVGWrapperField(): void {
        this.SVGWrapper = document.querySelector('.svg-wrapper');
        if (this.SVGWrapper === null)
            console.warn("There is no svg wrapper element on the current page");
    }

    // inits the dynamic elements field (SVG elements that change dynamically in response to 
    // changes in the SVG)
    // also load this when the SVG element is loaded
    private initDynamicElementsField(): void {
        // get our directional rotational elements
        const rotElements: {
            omnidirectionalRotElements: SVGGraphicsElement[],
            bidirectionalRotElements: Map<number,SVGGraphicsElement[]>
        } | null = this.getDirectionalRotationalElements();
        // get our scalar elements
        const scalarElements: {
            scalarLogoElements: SVGGraphicsElement[], 
            scalarLabelElements: SVGGraphicsElement[],
            otherScalarElements: SVGGraphicsElement[]
        } | null = this.getScalarElements();

        if (rotElements === null || scalarElements === null) {
            console.warn(
                "Failed to retrieve the omnidirectional/bidirectional rotational elements and all scalar elements as well"
            );
            return;
        }

        // destructure the need elements for legibility purposes
        const {scalarLogoElements, scalarLabelElements, otherScalarElements} = scalarElements;
        const {omnidirectionalRotElements, bidirectionalRotElements} = rotElements;

        // create an array to hold all rotation or scalar elements
        const allRotOrScalarElements: SVGGraphicsElement[] = [
            ...scalarLogoElements, 
            ...scalarLabelElements,
            ...otherScalarElements,
            ...omnidirectionalRotElements
        ];
        // bidirectional rotational elements are in a different structure so we have to add it to the array like this
        bidirectionalRotElements.forEach((rotElements: SVGGraphicsElement[], startingRotDegNormalized: number) => {
            allRotOrScalarElements.push(...rotElements);
        });
        // now iterate thru the array and add styling (this certain class) to the dynamic elements
        // as for the grid items, it's styiling will be added when they are initialized and rendered (it'll also be slightly different as
        // well)
        // see createGridImg() for that bit 
        allRotOrScalarElements.forEach((rotOrScalarElement: SVGGraphicsElement) => {
            // add the dynamic-svg-element class, this is applied to all dynamic elements
            rotOrScalarElement.classList.add("dynamic-svg-element");
        });
        
        // assign all our initialized values
        this.dynamicElements = {
            // rotational elements
            omnidirectionalRotElements: omnidirectionalRotElements,
            bidirectionalRotElementsMap: bidirectionalRotElements,
            // scalar elements
            scalarLogoElements: scalarLogoElements,
            scalarLabelElements: scalarLabelElements,
            otherScalarElements: otherScalarElements,
            allRotationOrScalarElements: allRotOrScalarElements,
            // initialize empty maps to the gridItemIDCache fields... they will be dynamically updated and handled in handleGridImageLoad()
            gridCellRoadMapImgCache: new Map(),
            gridCellSatelliteMapImgCache: new Map()
        }
    }

    // gets the directional rotational elements from the SVG
    private getDirectionalRotationalElements(): {
        omnidirectionalRotElements: SVGGraphicsElement[],
        bidirectionalRotElements: Map<number,SVGGraphicsElement[]>
    } | null {

        if (this.SVG === null) {
            console.warn("The entire SVG doesn't exist");
            return null;
        }

        // get our omnidirectional rotational elements here
        const omnidirectionalRotElements: SVGGraphicsElement[] = (
            Array.from(
                this.SVG.querySelectorAll<SVGGraphicsElement>("[id*='[FOLLOW_ROT]']")
            )
        );

        // create a bidirectional rotational elements hash map (used for later sorting)
        const bidirectionalRotElementsMap: Map<number,SVGGraphicsElement[]> = new Map();
        const bidirectionalRotElements: NodeListOf<SVGGraphicsElement> = (
            this.SVG.querySelectorAll<SVGGraphicsElement>("[id*='[ROT_']")
        );
        // iterate thru each element in the DOM
        for (const rotElement of bidirectionalRotElements) {
            // extract the starting rotation of the bidirectional rotational element and then sort it in into the map

            // extract the starting rotation
            // regex pattern to match anything between "[ROT_" and the next "], this should be the starting rotation of
            // the element found
            const regexFilter: RegExp = new RegExp(/\[ROT_([^\]]+)/);
            // this should match and return us the string containing the rotation value
            const filteredID: RegExpMatchArray | null = rotElement.id.match(regexFilter);

            if (filteredID === null) {
                console.warn(`Rotation element with id '${rotElement.id}' doesn't have the id name set properly`);
                continue;
            }

            // now parse the string into a number
            // match returns the full matched string in the 0th index and any captured group (the stuff in paranthesis) in 1st
            // index
            let startingRotDeg: number = parseFloat(filteredID[1] ?? "");
            if (isNaN(startingRotDeg)) {
                console.warn(`Rotation element with id '${rotElement.id}' doesn't have the id name set properly`);
                continue;
            }

            // normalize the value (now the angle is limited to 0-359)
            const startingRotDegNormalized: number = normalizeAngle(startingRotDeg, AngleType.DEGREES);
            // see if there are already a rot element array for this specific angle
            let mappedRotElements: SVGGraphicsElement[] | undefined = (
                bidirectionalRotElementsMap.get(startingRotDegNormalized)
            );
            // if not
            if (mappedRotElements === undefined) {
                // create an array with current rot element
                mappedRotElements = [rotElement];
                // and set it into the map
                bidirectionalRotElementsMap.set(startingRotDegNormalized, mappedRotElements);
            }
            else {
                // if the array was created, add the new rot element to array
                mappedRotElements.push(rotElement);
            }
        }

        return {
            omnidirectionalRotElements: omnidirectionalRotElements, 
            bidirectionalRotElements: bidirectionalRotElementsMap
        };
    }

    // gets elements that will be responsively scaled from the SVG
    private getScalarElements(): {
        scalarLogoElements: SVGGraphicsElement[], 
        scalarLabelElements: SVGGraphicsElement[],
        otherScalarElements: SVGGraphicsElement[]
    } | null {
        if (this.SVG === null) {
            console.warn("The svg doesn't exist");
            return null;
        }

        let scalarLogoElements: SVGGraphicsElement[] = [];
        let scalarLabelElements: SVGGraphicsElement[] = [];
        let otherScalarElements: SVGGraphicsElement[] =[];

        // get all scalar elements from the SVG (they should have a matching string of '[SCALE' within them)
        this.SVG.querySelectorAll<SVGGraphicsElement>("[id*='[SCALE']").forEach((scalarElement: SVGGraphicsElement) => {
            // check which elements are logos and labels and sort them accordingly
            const logoRegexFilter: RegExp = new RegExp(/\[SCALE_LOGO\]/);   
            const labelRegexFilter: RegExp = new RegExp(/\[SCALE_LABEL\]/);

            // scalar logo elements (logo icons) have '[SCALE_LOGO]' in their id
            // scalar label elements (platform direction labels + exit labels) have '[SCALE_LABEL]' in their id
            // other label elements (mostly street names) have '[SCALE]' in their id

            if (logoRegexFilter.test(scalarElement.id))
                scalarLogoElements.push(scalarElement);
            else if (labelRegexFilter.test(scalarElement.id))
                scalarLabelElements.push(scalarElement);
            else
                otherScalarElements.push(scalarElement);
        });

        return {
            scalarLogoElements: scalarLogoElements, 
            scalarLabelElements: scalarLabelElements, 
            otherScalarElements: otherScalarElements
        };
    }

    // init the map field
    // this includes the map-related SVG elements + the station map data (basically anything map related)
    private initMapField(stationMapData: StationMapData): void {
        if (this.SVG === null) {
            console.warn("The entire SVG doesn't exist");
            return;
        }

        // get all the elements relevant to the Map elements field (they are all just SVG elements that group certain items related to the map, 
        // they arent a specific SVG element like a street icon SVG)

        // parent group container of all the map related SVG elements
        const mapSVGParent: SVGGraphicsElement | null = this.SVG.querySelector("[id='MAP']");
        // template for placing our grid pics onto the svg
        const mapGrid: SVGGraphicsElement | null = this.SVG.querySelector("[id='Map Grid']");
        // the SVG groups that actually hold the map pictures (for the satellite and road map views)
        const roadMapGroup: SVGGraphicsElement | null | undefined = mapSVGParent?.querySelector("[id='Road Map Group']");
        const satelliteMapGroup: SVGGraphicsElement | null | undefined = mapSVGParent?.querySelector("[id='Satellite Map Group']");

        if (
            mapSVGParent === null ||

            mapGrid === null ||
            mapGrid === undefined || 

            roadMapGroup === null ||
            roadMapGroup === undefined ||

            satelliteMapGroup === null ||
            satelliteMapGroup === undefined
        ) {
            console.warn(
                "Map SVG parent, map grid, and/or road/satellite map groups don't exist",
                `Map Grid Status: ${mapGrid}`,
                `Map SVG Parent Status: ${mapSVGParent}`,
                `Road Map Group Status: ${roadMapGroup}`,
                `Satellite Map Group Status: ${satelliteMapGroup}`
            );
            return;
        }

        // doing some processing for the grid items to make it easier when using it for retrieving images from stationMapData
        // a tuple in the field structure is like this:
        // [macroGridCell, microGridCells] --> [11, [11, 12, 21, 22]] for a 2x2 grid 
        const gridCells: [SVGGraphicsElement, SVGGraphicsElement[]][] = [];
        // iterate through the macro group grid cells (they form a large 3x3 grid)
        // then iterate through their children (the children also form a 3x3 grid but much smaller; in total there are 81 micro grid cells)
        for (const macroGridCell of mapGrid.children) {
            const macroGridCellAsSVG: SVGGraphicsElement = macroGridCell as SVGGraphicsElement;
            // initialize attributes for the grid cell
            this.initGridCell(macroGridCellAsSVG);
            // create an array to hold the micro grid cells (children of the macro grid cell)
            const microGridCells: SVGGraphicsElement[] = [];

            // do the same logic for the children as well
            for (const microGridCell of macroGridCell.children) {
                const microGridCellAsSVG: SVGGraphicsElement = microGridCell as SVGGraphicsElement;
                this.initGridCell(microGridCellAsSVG);
                // also push these micro grid cells into the micro grid cell array
                microGridCells.push(microGridCellAsSVG);
            }
            // push the tuple of the macro grid cell and its micro grid cells into the grid
            gridCells.push([macroGridCellAsSVG, microGridCells]);
        }

        this.map = {
            elements: {
                parent: mapSVGParent, gridCells: gridCells, roadMapGroup: roadMapGroup, satelliteMapGroup: satelliteMapGroup
            },
            data: stationMapData
        };
    }

    // initializes attribute configurations for the grid cell
    private initGridCell(gridCell: SVGGraphicsElement): void {
        // this is just to make it easier to call a specific grid image from the stationMapData fetched
        // we can pass the grid key as the key and get the corresponding grid item from it

        // the SVG elements that have duplicate names usually have an underscore followed by which instance it is (e.g. id=element_7), 
        // in order to get the actual label of the element, we check the value before the underscore
        const gridKey: string | undefined = gridCell.id.split("_")[0];
        if (gridKey === undefined) {
            console.warn(`Could not get a valid id from grid item with id ${gridCell.id}`);
            return;
        }
        // set an attribute separate from the id, this will be the identifier for our images dicts
        gridCell.setAttribute("data-grid-key", gridKey);
    }

    // NOTE: the min zoom is based on the starting position of the station so it might not fit too well based on the starting
    // orientation of the station; to aid this, a zoom multiplier is configured to adjust the min zoom slightly 
    // inits the min zoom field (to limit zooming on the panzoom element)
    private initMinZoomField(zoomMultiplier: number = 0.6): void {
        if (this.stationSVG === null) {
            console.warn("Station SVG doesn't exist");
            return;
        }

        // get the zooom factor that would scale the station SVG to fit the size of the viewport
        const zoomFactorToFit: number | null = this.getZoomFactorToFit(this.stationSVG);
        if (zoomFactorToFit === null) {
            console.warn("Cannot retrieve the zoom factor that would scale the station SVG to fit the viewport");
            return;
        }

        // set the minimum zoom value here, which is a slightly descaled value of the zoom factor to fit
        this.minZoom = zoomFactorToFit * zoomMultiplier;
    }

    // loads the diagram into the page's diagram container
    private async loadDiagram(svgPath: string): Promise<void> {
        if (this.SVGWrapper === null) {
            console.warn("SVG wrapper element doesn't exist");
            return;
        }

        // fetch our svg
        const response: Response = await fetch(svgPath);
        const SVGContent: string = await response.text();
        // assign the svg into our diagram container
        this.SVGWrapper.innerHTML = SVGContent;
        // save a ref to our full SVG and the actual station svg within it
        this.SVG = this.SVGWrapper.querySelector("svg");
        this.stationSVG = this.SVGWrapper.querySelector("#STATION");
    }

    // inits the styling for our svg
    private initSVGStyling(): void {
        if (this.SVG === null) {
            console.warn("SVG doesn't exist");
            return;
        }

        // these are temporary stylings and mostly for testing
        // this.stationSVG.style.width = "fit-content";
        this.SVG.querySelectorAll("image").forEach((img: SVGImageElement) => {
            img.style.imageRendering = "smooth";
        });
    }

    // adds a class to node svgs that essentially darkens them
    public muteNode(nodeSVG: NodeSVG): void {
        nodeSVG.Self.BaseElement.classList.add("muted");
    }
    // removes the mute class from the node
    public unmuteNode(nodeSVG: NodeSVG): void {
        nodeSVG.Self.BaseElement.classList.remove("muted");
    }

    // Highlight function used to highlight the node at each step of the directions
    public highlightNode(nodeId: string): void {
        this.unhighlightNodes();

        const el = document.getElementById(nodeId);
        if (el) {
            el.classList.add('highlighted');
        } else {
            console.warn('Node not found:', nodeId);
        }
    }

    // gets the highlight class depending on the role given (of a node)
    public getHighlightClass(role: SelectionRole): string {
        return role === "start" ? "start-node-highlight" : "end-node-highlight";
    }

    // Seperate highlight function to highlight the start and the end of the selected path
    public highlightSelectedNode(nodeOption: NodeOption): void {
        const role: SelectionRole = nodeOption.selectionRole();
        // unhighlight all current instances of that selected node
        this.unhighlightSelectedNode(role);
        // get the highlight class 
        const highlightClass: string = this.getHighlightClass(role);
        // get the svg that we will highlight
        const node: SVGGraphicsElement = nodeOption.NODESVG.Self.BaseElement;
        // add the highlight class to the nodeOption
        node.classList.add(highlightClass);
    }

    // Removes all highlighted nodes, excluding the selected nodes (e.g. start and end nodes)
    public unhighlightNodes(): void {
        document.querySelectorAll(".highlighted").forEach((element: Element) => {
            element.classList.remove("highlighted");   
        })
    }

    // Removes the highlighted node given the current role (either a start or end node)
    public unhighlightSelectedNode(role: SelectionRole): void {
        // get the highlight class
        const highlightClass: string = this.getHighlightClass(role);
        // remove selection class from previous nodes
        document.querySelectorAll(`.${highlightClass}`).forEach((element) => {
            element.classList.remove(highlightClass);   
        });
    }

    // Passed a layer id and an array of all unique layers, shows the layer with the given id and hides all other layers
    public showLayer(layerSvgId: string, layers: LayerData[]): void {
        layers.forEach((layer) => {
            const layerElement = document.getElementById(layer.svg_id);
            if (layerElement) {
                if (layer.svg_id === layerSvgId) {
                    layerElement.style.opacity = "1.0";
                    layerElement.style.pointerEvents = "auto";
                } else {
                    layerElement.style.opacity = "0.0";
                    layerElement.style.pointerEvents = "none";
                }
            }
        });
    }

    // Shows the entire map
    public showAllLayers(layers: LayerData[]): void {
        layers.forEach((layer) => {
            const layerElement = document.getElementById(layer.svg_id);
            if (layerElement) {
                layerElement.style.opacity = "1.0";
                layerElement.style.pointerEvents = "auto";
            }
        });
    }

    // Helper method to center on the entire station map
    public centerMap(zoomMultiplier: number = 0.8, zoom: number | null = null): void {
        if (this.stationSVG === null) {
            console.warn("Station SVG doesn't exist");
            return;
        }

        // retreive the station SVG's bounding rect
        const stationSVGBoundingRect: DOMRect = this.stationSVG.getBoundingClientRect();
        // then center it, passing our zoom multiplier or manual zoom value (if needed)
        if (zoom === null)
            this.centerBoundingBoxInViewport(stationSVGBoundingRect, zoomMultiplier);
        else
            this.centerBoundingBoxInViewport(stationSVGBoundingRect, 1, zoom);
    }

    // (FOR ROUTE PREVIEW) Helper function to zoom in on the node SVG elements representing the path
    public centerOnPath(pathNodes: SVGGraphicsElement[], zoomMultiplier: number = 0.5, zoom: number | null = null): void {
        if (this.stationSVG === null) {
            console.warn("Station SVG doesn't exist");
            return;
        }

        // create two vectors to record the bounds of the largest bounding box that captures all the node SVG element's bounding boxes
        let leftTopMostPoint: Vector2 = new Vector2();
        let rightBottomMostPoint: Vector2 = new Vector2();
        // we need this bool to initialize the first values of our vectors (or else the equality checks wouldn't work properly for
        // (0,0) assuming the group is translated at the x and y extremes)
        let isFirstComparison: boolean = true;
        // iterate thru our path nodes
        for (const node of pathNodes) {
            // get the client rect
            const nodeBoundingRect: DOMRect = node.getBoundingClientRect();
            // initialize our vectors if this is our first comparison
            if (isFirstComparison) {
                leftTopMostPoint.x = nodeBoundingRect.left;
                leftTopMostPoint.y = nodeBoundingRect.top;
                rightBottomMostPoint.x = nodeBoundingRect.right;
                rightBottomMostPoint.y = nodeBoundingRect.bottom;

                isFirstComparison = false;
            }
            // if not, update our vectors accordingly
            else {
                leftTopMostPoint.x = leftTopMostPoint.x < nodeBoundingRect.left ? leftTopMostPoint.x : nodeBoundingRect.left;
                leftTopMostPoint.y = leftTopMostPoint.y < nodeBoundingRect.top ? leftTopMostPoint.y : nodeBoundingRect.top;
                rightBottomMostPoint.x = (
                    rightBottomMostPoint.x > nodeBoundingRect.right ? rightBottomMostPoint.x : nodeBoundingRect.right
                );
                rightBottomMostPoint.y = (
                    rightBottomMostPoint.y > nodeBoundingRect.bottom ? rightBottomMostPoint.y : nodeBoundingRect.bottom
                );
            }
        }

        // create a DOMRect from our updated vectors
        const nodeGroupBoundingBox: DOMRect = new DOMRect(
            leftTopMostPoint.x, 
            leftTopMostPoint.y, 
            rightBottomMostPoint.x - leftTopMostPoint.x,
            rightBottomMostPoint.y - leftTopMostPoint.y
        );
        // and pass this bounding box to center it
        this.centerBoundingBoxInViewport(nodeGroupBoundingBox, zoomMultiplier, zoom, true);
    }

    // BIG NOTE: The zoom value right now is only adequate for the station maps with the road/satellite maps, the zoom is very 
    // big for the default stations without any map so don't be alarmed too much about the uber zoom on the nodes for those stations
    // currently
    // Helper function to zoom on on a node based on svgId
    public centerOnNode(SVGID: string, zoomMultiplier: number = 1, zoom: number = 8): void {
        if (this.stationSVG === null) {
            console.warn("Station SVG doesn't exist");
            return;
        }
        // retrieve our node SVG element
        const node: SVGGraphicsElement | null = this.stationSVG.querySelector(`[id='${SVGID}']`);
        if (node === null) {
            console.warn(`Node with "${SVGID}" cannot be found on the SVG`);
            return;
        }
        // get the bounding rect
        const nodeBoundingRect: DOMRect = node.getBoundingClientRect();
        // then center it
        this.centerBoundingBoxInViewport(nodeBoundingRect, zoomMultiplier, zoom, true);
    }
    
    // base function for centering any bounding box (e.g. the client rect of a target SVG element/HTML element or a custom DOMRect)
    // zoomMultiplier scales the computed zoom for the bounding box (which is equivalent to the diagram container (viewport's) height
    // or width divided by the normalized value of the target bounding box (normalized value = bounding box / panzoom scale))
    // DO NOTE that the zoom is limited to min zoom only

    // by the way, centering is a misnomer because the center is bounded by the panning limit (which is based relative to dimensions 
    // observed in min zoom); either way, it'll work for now
    private async centerBoundingBoxInViewport(
        boundingBox: DOMRect,
        zoomMultiplier: number = 1,
        zoomOverrideValue: number | null = null,
        smoothCenter: boolean = false,
        centerSpeed: number = 3.5,
        centerThresholdRatio: number = 0.001
    ): Promise<void> {
        if (this.currentPanZoom === null) {
            console.warn("Panzoom instance doesn't exist");
            return;
        }

        // initialize a field to hold the value of the target zoom
        let zoom: number = 1;
        // determine whether we want an explicit zoom value (the zoomOverride var) or not
        if (zoomOverrideValue === null) {
            // if not determine the adequate zoom for which the element's bounding rect would just fit into the browser viewport
            const zoomFactorToFit: number | null = this.getZoomFactorToFit(boundingBox);
            if (zoomFactorToFit === null) {
                console.warn(`Could not compute adequate zoom factor for fit the element with this bounding box: ${boundingBox}`);
                return;
            }
            // and multiply it by the zoom multiplier to zoom out slightly
            zoom = zoomFactorToFit * zoomMultiplier;
        }
        else {
            // if yes, then include the zoom value as is
            zoom = zoomOverrideValue;
        }
        // since we specifically provided a minimum zoom for our panzoom instance, we have to clamp our target zoom to be no smaller than minZoom
        zoom = clamp(zoom, this.minZoom);
        // now get the offset of this bounding box from our viewport center
        const offset: Vector2 | null = this.getBoundingBoxOffsetFromViewportCenter(boundingBox, zoom);
        if (offset === null) {
            console.warn("Failed to retrieve offset");
            return;
        }

        // get panning limits
        const panningLimits: {offsetLimitTopLeft: Vector2, offsetLimitBottomRight: Vector2} | null = this.getPanningLimits(zoom);
        if (panningLimits === null) {
            console.warn("Could not get panning limits");
            return;
        }
        const {offsetLimitTopLeft, offsetLimitBottomRight} = panningLimits;
        // clamp our offset by the panning limits
        const clampedOffset: Vector2 = new Vector2(
            clamp(offset.x, offsetLimitBottomRight.x, offsetLimitTopLeft.x),
            clamp(offset.y, offsetLimitBottomRight.y, offsetLimitTopLeft.y)
        );

        // increment active centering calls, this indicates to us how many centerBoundingBoxInViewport is called
        // this value functions as a flag that prevents multiple async handlers (if smooth center is on) from fighting one
        // another causing weird visual behavior (i.e. delayed smooth centering or teleporting to one point and another)
        this.activeCenteringCalls++;
        // set boolean flag to ignore panzoom events for the upcoming section
        this.ignorePanzoomEvents = true;
        // if we want to center smoothly
        if (smoothCenter) {
            // get the current pos and scale
            const currentPanzoomTransform: {x: number, y: number, scale: number} = this.currentPanZoom.getTransform();
            const currentPos: Vector2 = new Vector2(currentPanzoomTransform.x, currentPanzoomTransform.y);
            // get the scale as it exists in the DOM (this prevents panzoom's unpainted zoom from causing a funky transition)
            let currentScale: number | null = this.getCurrentZoomInDOM();
            if (currentScale === null) {
                console.warn("Cannot get current zoom");
                return;
            }
            // also get the full dist between the current pos and the clamped offset as the determinant for when we break out of the 
            // loop is when currentPos hits a certain ratio of the original full dist
            const fullDist: number = currentPos.getDist(clampedOffset);
            // create a var that holds the time at which the corresponding request animation frame below executes (this is used for
            // measuring timeDelta or the time in between frames)
            let prevTimeStampMS: number = 0;
            // this is our smoothing centering loop
            while (
                currentPos.getDist(clampedOffset) > fullDist * centerThresholdRatio
            ) {
                // essentially set a promise that sets a request animation frame (so that the updates are synced with the DOM refresh rate)
                // should be approximately 1/60 seconds but could scale depending on CPU/GPU load
                await new Promise((resolve: (value?: any) => void) => {
                    requestAnimationFrame((timeStampMS: number) => {
                        if (this.currentPanZoom === null || currentScale === null)
                            return;

                        // if the number of active centering calls is more than 1 (meaning this instance is not the last one to
                        // to be called), decrement the call and return 
                        // this flag logic works because we're essentially offloading every promise call to a predictable frame
                        // of time (e.g. the browser animation frame, which happens after macro tasks like onclick handling and things
                        // of that manner... essentially animation frames happen at very end of the queue in terms of code execution)
                        if (this.activeCenteringCalls > 1) {
                            this.activeCenteringCalls--;
                            return;
                        }

                        // get the time delta to account for drops in frame rate
                        const timeDeltaMS: number = prevTimeStampMS === 0 ? 0: timeStampMS - prevTimeStampMS; 
                        // set the time stamp to the new time stamp
                        prevTimeStampMS = timeStampMS;
                        // get the ratio we're going to lerp at
                        const lerpRatio: number = centerSpeed * timeDeltaMS / 1000;
                        // lerp the current scale and position
                        currentScale = lerp(currentScale, zoom, lerpRatio);
                        currentPos.m_lerp(clampedOffset, lerpRatio);

                        // update our panzoom
                        this.updatePanZoom(currentPos, currentScale);

                        // resolve our promise
                        resolve();
                    });
                });
            }
        }

        // decrement the active centering calls here 
        this.activeCenteringCalls--;
        // run our update panzoom handler one more time to put the map in the right position and zoom
        this.updatePanZoom(clampedOffset, zoom);
        // enable panzoom events again
        this.ignorePanzoomEvents = false;
    }

    // Setup our panzoom object with proper params (this includes mouse scroll, drag)
    private setupPanzoomInstance(
        beforeMouseDownEventHandler: ((ev: MouseEvent) => any) | undefined = undefined,
        beforeWheelEventHandler: ((ev: WheelEvent) => any) | undefined = undefined
    ): void {
        if (this.minZoom === null) {
            console.warn("Min zoom field has not been initialized");
            return;
        }

        // Cleanup the old even listener if we are loading a new station diagram
        if (this.currentPanZoom !== null) {
            this.currentPanZoom.dispose();
        }

        // NOTE: apply panzoom to our SVG wrapper instead of our SVG itself because we're applying rotation transformations to
        // our SVG and PanZoom refers to the movement axes based on the svg's X,Y axes not the document's
        // @ts-ignore
        this.currentPanZoom = panzoom(this.SVGWrapper, { 
            // NOTE: you need to adjust this since it is a HARD CAP (you cannot go over the limit even with panzoom.zoomAbs())
            maxZoom: 5000, 
            minZoom: this.minZoom,
            // disable smooth scroll since it messes with the centering logic (cause panning causes it to slide which is a big nono)
            smoothScroll: false,
            beforeMouseDown: beforeMouseDownEventHandler,
            beforeWheel: beforeWheelEventHandler
        });
    }

    // Method to load the diagram and immediately attach controls
    public async loadDiagramWithControls(
        diagramPath: string, 
        stationMapData: StationMapData
    ): Promise<void> {
        // load the diagram into the container
        await this.loadDiagram(diagramPath);
        // init some macro styling for the SVG
        this.initSVGStyling();
        // init the rotation controls of the map and get the handler that we need to pass to our panzoom instance
        const beforeMouseDownHandler: ((ev: MouseEvent) => boolean) | null = this.initRotationControls();
        if (beforeMouseDownHandler === null) {
            console.warn("There was a problem initiating rotation controls");
            return;
        }
        // init the min zoom field to initialize the constraints for our panzoom instance
        this.initMinZoomField();
        // setup the panzoom instance and its controls
        this.setupPanzoomInstance(beforeMouseDownHandler);
        // init the SVG Map Elements field (this field needs to be initialized before the last 2 methods in this function body since 
        // they depend on variables within this field)
        this.initMapField(stationMapData);
        // init the dynamic elements field 
        this.initDynamicElementsField();
        // set the event logic related to panzoom events (e.g. event listeners for zooming and panning)
        this.initPanZoomControls();
        // center the map to where the station is at
        this.centerMap();
        // though already set by default upon construction; run the setCurrentMapView() method to update any relevant visual changes
        // on the map view
        this.setCurrentMapView(MapView.DEFAULT);
    }

    // get all route direction labels
    public getRouteDirectionLabels(): SVGGraphicsElement[] {
        return Array.from(
            document.querySelectorAll<SVGGraphicsElement>('#diagram-container g[id$="_UP"], #diagram-container g[id$="_DOWN"]')
        );
    }

    // Inits the route direction labels (hides the elements and adds some styling to these labels)
    public initRouteDirectionLabels(): void {
        // get the direction labels
        const labelElements: SVGGraphicsElement[] = this.getRouteDirectionLabels();
        // hide all of them first
        this.hideRouteDirectionLabels();
        // and then add a special class for these elements
        labelElements.forEach((labelElement: SVGGraphicsElement) => {
            labelElement.classList.add("route-direction__label");
        });
    }

    // Function to hide all stair labels on the svg
    public hideRouteDirectionLabels(): void {
        // get all the direction labels
        const labelElements: SVGGraphicsElement[] = this.getRouteDirectionLabels();
        // hide the label elements
        labelElements.forEach((labelElement: SVGGraphicsElement) => {
            labelElement.style.display = "none";
        });
    }

    // Function to show a specific stair label on the svg
    public showRouteDirectionLabels(labelIds: Iterable<string>): void {
        this.hideRouteDirectionLabels();

        for (const labelId of labelIds) {
            const labelElement: SVGGraphicsElement | null = document.querySelector(`[id="${labelId}"]`);

            if (labelElement === null) {
                console.warn(
                    "Route direction label element doesn't exist:", labelId
                );
                continue;
            }

            // make the label visible
            labelElement.style.display = "inline";
        }
    }

    // Function to start the route preview given the svgId of
    // all nodes that are part of the route by setting their styles
    // and relevant properties (preview-index, preview-duration)
    public startRoutePreview(pathNodeIds: string[]): void {
        if (this.stationSVG === null) {
            console.warn("The station SVG doesn't exist");
            return;
        }

        // reset map
        this.stopRoutePreview();
        // calculate how long the prewview path animation should last (the glowing lines)
        const previewDurationSeconds = Math.max(pathNodeIds.length, 1);

        const pathNodes: SVGGraphicsElement[] = [];
        // Sets the style for all nodes on the path and adds the node to our path nodes array
        for (let index=0; index<pathNodeIds.length; index++) {
            const nodeID: string | undefined = pathNodeIds[index];
            if (nodeID === undefined)
                return;
            const node: SVGGraphicsElement | null = this.stationSVG.querySelector(`[id='${nodeID}']`);
            if (!node) {
                console.warn("Preview node not found:", nodeID);
                return;
            }

            // push the path nodes into the array 
            pathNodes.push(node);

            // add styling for the node
            node.classList.add("route-preview-node");
            node.style.setProperty("--preview-index", index.toString());
            node.style.setProperty("--preview-duration", (previewDurationSeconds.toString() + "s"));
        }

        // zoom onto the path items now that we have all the path nodes
        this.centerOnPath(pathNodes);
    }

    // Function that removes all the styling applied on the path nodes for the preview
    public stopRoutePreview(): void {
        document.querySelectorAll<SVGGraphicsElement>(".route-preview-node").forEach((node) => {
            node.classList.remove("route-preview-node");
            node.style.removeProperty("--preview-index");
            node.style.removeProperty("--preview-duration");
        });
    }

    // set the event logic to allow us to rotate the svg and any logic tied to rotating the svg (e.g. logic for the rotational dynamic
    // elements) and returns any event logic we need to pass to our panzoom instance
    private initRotationControls(rotationIntervalMS: number = 40): ((ev: MouseEvent) => boolean) | null {

        if (this.diagramContainer === null || this.SVGWrapper == null || this.SVG === null || this.stationSVG === null) {
            console.warn(
                "Diagram container, SVG wrapper, the full SVG, and/or the station SVG within it doesn't exist",
                `Diagram Container Status: ${this.diagramContainer}`,
                `SVG Wrapper Status: ${this.SVGWrapper}`,
                `SVG Status: ${this.SVG}`,
                `Station SVG Status: ${this.stationSVG}`,
            );
            return null;
        }

        // init our booleans and numbers to store and check the state of our rotation logic
        let ctrlKeyPressed: boolean = false;
        let mouseIsDown: boolean = false;
        let isRotating: boolean = false;
        let prevPosX: number = 0;

        // variables representing the translations of our SVG (for our matrix rotation transformation)
        let pivotX: number = 0;
        let pivotY: number = 0;

        // this variable tells us how much has the map rotated (in deg, not normalized (e.g. can be a very large negative or positive num)) 
        let totalRotationDeg: number = 0;

        // these vars are for checking time between event listeners callbacks, used primarily to limit "mousemove" events
        let timeElapsedMS: number = 0;
        let prevTimeStampMS: number = 0;

        // we're going to follow google's rotation method where you must hit control before allowing the user to rotate the map on pc
        window.addEventListener("keydown", (ev: KeyboardEvent) => {
            // only set ctrlkeypressed if panning hasn't started (by the way, since initRotationControls() passes a before mousedown handler that
            // prevents panning when we rotate (e.g. when ctrl key is pressed before panning), the panzoom.on("pan") event only fires when panning happens
            // before the ctrl key is pressed
            if (!this.isPanning)
                ctrlKeyPressed = ev.ctrlKey;
        });
        window.addEventListener("keyup", (ev: KeyboardEvent) => {
            ctrlKeyPressed = false;
        });

        // add the drag logic for the svg rotation
        this.diagramContainer.addEventListener("mousedown", (ev: MouseEvent) => {
            if (this.SVGWrapper === null || this.diagramContainer === null)
                return;

            // NOTE: this way only works because the SVG is centered horizontally and vertically in the SVGWrapper (see station map CSS)
            // with the transform origin set to the SVG's center;
            // to do it by transform origin of 0,0; the top left corner of the SVG has to align with the SVGWrapper in the (set in the CSS)
            // then the offset has to be calculated between the top/left of the SVGWrapper and the center of the diagram container
            // (e.g. we don't calculate the offsets based on the center in this case)
            const offset: Vector2 = getElementCentersOffset(this.diagramContainer, this.SVGWrapper);
            // get the current zoom as it is in the DOM
            const scale: number | null = this.getCurrentZoomInDOM();
            if (scale === null) {
                console.warn("Could not retrieve scale");
                return;
            }

            // the pivots/translations is equivalent to the offset de-scaled (e.g. the offset as if SVGWrapper wasn't scaled)
            pivotX = offset.x/scale;
            pivotY = offset.y/scale;

            // init the previous position
            prevPosX = ev.x;
            // signify the mouse is down
            mouseIsDown = true;
            // set the previous time stamp
            prevTimeStampMS = performance.now();

            // if ctrl key is pressed
            if (ctrlKeyPressed) {
                // disable rot or scalar elements
                this.enableDynamicRotOrScalarElements(false);
                // set isRotating bool to true
                isRotating = true;
            }
        });
        
        // both mouse up and mouse leave will disable mouseIsDown to prevent some funky behavior depending on where the user drags
        // (e.g. rotation spazzes out)
        this.diagramContainer.addEventListener("mouseup", (ev: MouseEvent) => {
            mouseIsDown = false;

            // both mouse up and mouseleave will also reenable rot or scalar elements + and rotate the dynamic elements that do rotate
            if (isRotating) {
                this.enableDynamicRotOrScalarElements(true);
                this.handleDynamicElementRotations(totalRotationDeg);
                isRotating = false;
            }
        });
        this.diagramContainer.addEventListener("mouseleave",  (ev: MouseEvent) => {
            mouseIsDown = false;

            if (isRotating) {
                this.enableDynamicRotOrScalarElements(true);
                this.handleDynamicElementRotations(totalRotationDeg);
                isRotating = false;
            }
        });
        // deals with the actual rotation logic of the map
        this.diagramContainer.addEventListener("mousemove", (ev: MouseEvent) => {
            if (!ctrlKeyPressed || !mouseIsDown || this.SVG === null)
                return;

            // mousemove events can hundreds of times per second (this fluctuates based on browser specs and the polling rate of the mouse)
            // anways, if this fired every 4 ms, this would cause serious lag, especially since we're transforming a huge DOM tree
            // to avoid issues, we just limit the rate by the given rotationInterval
            timeElapsedMS += performance.now() - prevTimeStampMS;
            prevTimeStampMS = performance.now();
            if (timeElapsedMS < rotationIntervalMS)
                return;
            // also we could use modulo but float overflow and precision reduction (> 2^53 ~ 15-17 digit precision) can occur in extreme cases 
            // though again performance.now() could probably overflow...
            timeElapsedMS = 0;
            
            // get our rotation from our initial mouse point and the new point
            const displacementX: number = prevPosX - ev.x;
            // the rounding here is just to optimize memory allocation when applying transform rotations
            // whole numbers good, floating point numbers not so much
            const rotDeg = Math.round(displacementX * this.mapRotationSensitivity);
            // update our previous position
            prevPosX = ev.x;

            // create an identity matrix
            const rotMatrix: DOMMatrix = (
                // instantiate a new identity matrix
                new DOMMatrix()
                // do the standard for rotating a point around a matrix
                // the order is actually read in reverse so you translate by negative pivot -> rotate -> add back the pivot
                .translate(pivotX, pivotY)
                .rotate(rotDeg)
                .translate(-pivotX, -pivotY)
            );

            // we're applying our new transform matrix onto the existing one
            const SVGMatrix: DOMMatrix = getCurrentTransformMatrix(this.SVG);
            const productMatrix: DOMMatrix = rotMatrix.multiply(SVGMatrix);
            this.SVG.style.setProperty("--transformation-matrix", productMatrix.toString());

            // also update our total rotation
            totalRotationDeg -= rotDeg;
        });

        // also pass a closure function with passed reference of the ctrlKeyPressed bool to our panzoom setup so that panzoom 
        // doesn't activate if the ctrl key is pressed
        const beforeMouseDownHandler: (ev: MouseEvent) => boolean = (ev: MouseEvent) => {
            let shouldIgnore: boolean = ctrlKeyPressed;
            return shouldIgnore;
        }; 

        return beforeMouseDownHandler;
    }

    // inits all handlers and event logic related to panzoom's panning and zooming
    private initPanZoomControls(): void {
        if (this.currentPanZoom === null) {
            console.warn("Panzoom instance doesn't exist");
            return;
        }

        // dynamically scale elements on initialization
        this.handleDynamicElementScaling();

        this.currentPanZoom.on("pan", (ev: any) => {
            // pan and zoom event listeners will not run when this boolean guard is triggered
            if (this.ignorePanzoomEvents)
                return;

            // handle grid image loading
            this.handleGridImageLoad();
            // prevent users from panning beyond a certain limit
            this.handlePanningLimit();
            // toggle boolean to indicate that user is currently panning 
            this.isPanning = true;
        });

        this.currentPanZoom.on("panend", (ev: any) => {
            // toggle boolean to indicate the user is not panning anymore
            this.isPanning = false;
        });

        this.currentPanZoom.on("zoom", (ev: any) => {
            if (this.ignorePanzoomEvents)
                return;

            // handle grid image loading
            this.handleGridImageLoad();
            // disable all dynamic rot or scalar elements
            this.enableDynamicRotOrScalarElements(false);
            // equivalent to panzoom.on("zoomend"), queues a callback for when a zooming event stop
            this.monitorForZoomEnd(() => {
                // enable back the rot or scalar elements
                this.enableDynamicRotOrScalarElements(true);
                // and handle element scaling
                this.handleDynamicElementScaling();
            });
            // also handle panning limit here... this prevents zooming in/out from overshooting the panning limits
            // (which does translate the SVG wrapper so it centers at the point of zoom (e.g. where the cursor is))
            this.handlePanningLimit();
        });

        // NOTE: this is strictly for touch pad pinch gestures, scroll and keyboard zoom events do not activate this
        this.currentPanZoom.on("zoomend", (ev: any) => {
            // enable the dynamic rot or scalar elements
            this.enableDynamicRotOrScalarElements(true);
            // handle scaling of dynamic scalar elements here 
            this.handleDynamicElementScaling();
        });
    }

    // update panzoom's position and zoom with an optional flag to prevent callbacks like panzoom.on("pan") or panzoom.on("zoom") from
    // occurring during this update
    private updatePanZoom(pos: Vector2, zoom: number): void {
        // update the current panzoom with the position and scale
        if (this.currentPanZoom === null) {
            console.warn("Current panzoom instance doesn't exist");
            return;
        }
        
        // NOTE: zoomAbs only scales the svg by the given factor (the 3rd param) with the anchor being the first and second
        // it scales the svg size when it was originally set in the viewport (e.g. if it's 1920px by 1080px, zoomAbs would shrink
        // the value to 1920x.9 1080*.9 with the top left still being at (0,0) (the diagram container's top-left) since we the anchor/transform origin [the first 2 params
        // of currentPanZoom] is at 0,0).
        this.currentPanZoom.zoomAbs(0, 0, zoom);
        // NOTE: moveTo() is not based on the relative position of the panzoom element, it's relative from (0,0)
        this.currentPanZoom.moveTo(pos.x, pos.y);

        // handle dynamic elements styling here
        // scale the element
        this.handleDynamicElementScaling();
        // handle grid image load
        this.handleGridImageLoad();
    }

    // scroll + keyboard events don't work with panzoom.on("zoomend"), so this is the solution for triggering a zoomend callback
    private monitorForZoomEnd(callback: () => void, checkRateMS: number = 200): void {
        // increment the global var for amount of zoom callbacks that have been initiated
        this.activeZoomingCalls++;

        // queue a callback that will occur after the given check rate time
        // you can think of the check rate as equivalent to how many seconds between per subsequent scroll event or keyboard event
        // is considered "idle" or "non-zooming"
        // set timeout is handle asynchronously... this isn't blocking
        setTimeout(() => {
            // decrement the call
            this.activeZoomingCalls--;
            // if there are no more zoom calls
            if (this.activeZoomingCalls === 0)
                // activate the callback
                callback();
        }, checkRateMS);          
    }

    // handler for loading low res and high res grid images for the station map
    private handleGridImageLoad(): void {
        if (this.diagramContainer === null || this.map === null || this.dynamicElements === null) {
            console.warn(
                "Diagram container, map elements and/or the dynamic elements field is not initialized",
                `Diagram Container Status: ${this.diagramContainer}`,
                `Map Elements Field Status: ${this.map}`,
                `Dynamic Elements Field Status: ${this.dynamicElements}`
            );
            return;
        }

        // get the grid cell image maps + svg map groups
        const {gridCellRoadMapImgCache: gridCellRoadMapImgMap, gridCellSatelliteMapImgCache: gridCellSatelliteMapImgMap} = this.dynamicElements;
        const {roadMapGroup, satelliteMapGroup} = this.map.elements;

        // set vars to hold the corresponding grid cell image map and svg map group we're using
        let targetGridCellImgMap: Map<SVGGraphicsElement,SVGImageElement> | null = null;
        let targetMapGroup: SVGGraphicsElement | null = null;
        // set the values of these vars based on the current map view
        switch (this.currentMapView) {
            case MapView.ROAD:
                targetGridCellImgMap = gridCellRoadMapImgMap;
                targetMapGroup = roadMapGroup;
                break;
            case MapView.SATELLITE:
                targetGridCellImgMap = gridCellSatelliteMapImgMap;
                targetMapGroup = satelliteMapGroup;
                break;
            // do not check if the view is the default view, just exit 
            case MapView.DEFAULT:
                return;
        }

        // if zoom threshold is met, render the high res images
        // if zoom threshold is not met, render the low res images 

        // loop through the grid cells
        const {gridCells} = this.map.elements;
        for (const cell of gridCells) {
            // destructure the array just for legibility purposes
            const [macroGridCell, microGridCells] = cell;
            // if the zoom threshold is met
            if (this.zoomThresholdMet()) {
                // remove macro grid cell imgs and create/enable micro grid cell imgs

                // remove the macro grid cell grid image from the dom layout (if it exists)
                const macroGridImg: SVGImageElement | undefined = targetGridCellImgMap.get(macroGridCell);
                if (macroGridImg !== undefined)
                    macroGridImg.style.display = "none";

                // then loop through the micro grid cells for this particular macro grid cell
                for (const microGridCell of microGridCells) {
                    // get the micro grid img for this grid cell from the map cache
                    let microGridImg: SVGImageElement | null = (
                        targetGridCellImgMap.get(microGridCell) ?? null
                    );
                    // check if the grid cell is in view
                    if (boundingRectsAreIntersecting(microGridCell, this.diagramContainer)) {
                        // if it does, check if the image is in the mapped cache
                        if (microGridImg === null) {
                            // if not, create the grid img
                            microGridImg = this.createGridImg(macroGridCell, microGridCell);
                            // add it to the corresponding map group
                            targetMapGroup.append(microGridImg);
                            // set the corresponding key value in the cache
                            targetGridCellImgMap.set(microGridCell, microGridImg);
                        }
                       
                        // put the micro grid img back into the layout
                        microGridImg.style.display = "block";
                    }
                    else {
                        // if the grid cell is not in view
                        // remove the corresponding grid img from the DOM layout
                        if (microGridImg !== null)
                            microGridImg.style.display = "none";
                    }
                    
                }
            }       
            else {
                // else do the oppsite: remove micro cell imgs and remove macro grid cell imgs

                // get the macro grid img corresponding to the macro grid cell from the cache
                let macroGridImg: SVGImageElement | null = targetGridCellImgMap.get(macroGridCell) ?? null;
                // check if the macro grid cell is in view
                if (boundingRectsAreIntersecting(macroGridCell, this.diagramContainer)) {
                    // if it is, check if the cache has an image element already
                    if (macroGridImg === null) {
                        // if it doesn't exist, create a grid img
                        macroGridImg = this.createGridImg(macroGridCell);
                        // add it to the corresponding map group
                        targetMapGroup.append(macroGridImg);
                        // set it as a key value pair into the cache
                        targetGridCellImgMap.set(macroGridCell, macroGridImg);
                    }
                    // add the img back into the DOM layout
                    macroGridImg.style.display = "block";
                }
                else {
                    // if the grid img is not in view, remove it from the layout if it exists
                    if (macroGridImg !== null)
                        macroGridImg.style.display = "none";
                }

                // loop thru all the micro grid cells
                for (const microGridCell of microGridCells) {
                    // remove all of them fromt the layout if they exist
                    const microGridImg: SVGGraphicsElement | undefined = targetGridCellImgMap.get(microGridCell);
                    if (microGridImg !== undefined)
                        microGridImg.style.display = "none";
                }
            }
        }
    }

    // creates an SVG (low res or high res) image grid item and styles it
    private createGridImg(
        macroGridCell: SVGGraphicsElement,
        microGridCell: SVGGraphicsElement | null = null
    ): SVGImageElement {
        // init a var that will hold the img path that the grid image will represent
        let gridImgPath: string = "";
        // and a var that refers to the corresponding bbox (either the macro or micro grid cell) that we'll use 
        // to set the attributes of the created img grid item
        let targetBBox: DOMRect | null = null;

        // determine whether a micro grid cell was passed to determine whether we are creating an img grid item for a macro grid cell
        // or a micro grid cell
        if (microGridCell === null) {
            // get the respective grid image path 
            gridImgPath = this.getLowResGridImgPath(macroGridCell);
            // get the (untransformed) bounds of the correct SVG grid item
            // NOTE: BBox only exists for SVG elements
            targetBBox = macroGridCell.getBBox();
        }
        else {
            gridImgPath = this.getHighResGridImgPath(macroGridCell, microGridCell);
            targetBBox = microGridCell.getBBox();
        }

        // universal URL to add SVG elements onto a canvas or SVG
        const SVGURI: string = "http://www.w3.org/2000/svg";
        // create a new svg image element
        const gridImgItem: SVGImageElement = document.createElementNS(SVGURI, "image") as unknown as SVGImageElement;
        // set the corresponding attributes for the image
        gridImgItem.setAttribute("href", gridImgPath);
        // set the corresponding attributes to the grid img element
        const {x, y, width, height} = targetBBox;
        gridImgItem.setAttribute("x", x.toString());
        gridImgItem.setAttribute("y", y.toString());
        gridImgItem.setAttribute("width", width.toString());
        gridImgItem.setAttribute("height", height.toString());

        // also add the dynamic svg element class to the grid img element
        gridImgItem.classList.add("dynamic-svg-element");

        return gridImgItem;
    }

    // gets the low res grid img corresponding to the given macro grid cell
    private getLowResGridImgPath(macroGridCell: SVGGraphicsElement): string {
        if (this.map === null) {
            console.warn("The map field hasn't been initialized");
            return "";
        }

        // get the grid key from the macrogrid
        const macroGridKey: string | undefined = macroGridCell.dataset.gridKey;
        if (macroGridKey === undefined) {
            console.warn(`Did not configure dataset attribute for grid item with id ${macroGridCell}`);
            return "";
        }

        // get the low res img paths
        const {road_map_low_res_imgs, satellite_map_low_res_imgs} = this.map.data;
        // determine which path to use and return the corresponding img path
        switch(this.currentMapView) {
            case (MapView.ROAD):
                return road_map_low_res_imgs[macroGridKey] ?? ""; 
            case (MapView.SATELLITE):
                return satellite_map_low_res_imgs[macroGridKey] ?? ""; 
            case (MapView.DEFAULT):
                return "";
        }
    }

    // gets the high res grid image path corresponding to the given macro and micro grid cell
    private getHighResGridImgPath(macroGridCell: SVGGraphicsElement, microGridCell: SVGGraphicsElement): string {
        if (this.map === null) {
            console.warn("The map field hasn't been initialized");
            return "";
        }

        // get the grid keys from both the macro and micro grid elements
        const macroGridKey: string | undefined = macroGridCell.dataset.gridKey;
        const microGridKey: string | undefined = microGridCell.dataset.gridKey;

        if (macroGridKey === undefined || microGridKey === undefined) {
            console.warn(
                `
                    Did not configure dataset attribute for macro grid cell with id ${macroGridCell.id} 
                    and/or micro grid cell with id ${microGridCell.id}
                `
            );
            return "";
        }

        // get the high res img paths
        const {road_map_high_res_imgs, satellite_map_high_res_imgs} = this.map.data;
        // see which map view we're in and assign the correct img paths accordingly
        let microGridImgPaths: Record<string,string> | null = null;
        switch(this.currentMapView) {
            case (MapView.ROAD):
                microGridImgPaths = road_map_high_res_imgs[macroGridKey] ?? null; 
                break;
            case (MapView.SATELLITE):
                microGridImgPaths = satellite_map_high_res_imgs[macroGridKey] ?? null; 
                break;
            case (MapView.DEFAULT):
                return "";
        }

        if (microGridImgPaths === null) {
            console.warn(`Couldn't get micro grid image path from macro grid key: ${macroGridKey}`);
            return "";
        }

        // in the high res img paths, it's a dict inside a dict (larger cell being the key leading to the smaller cells as the value)
        // structure is like this, hence we need the initial macro grid key first and then a micro grid key to get the actual path:
        // {
        //      "11": {"11": "../path", "12": "../path", "13": "../path"}
        //      "12": { ... }
        // }
        const microGridImgPath: string | undefined = microGridImgPaths[microGridKey];

        if (microGridImgPath === undefined) {
            console.warn(`Couldn't get micro grid image path from micro grid key: ${microGridKey}`);
            return "";
        }

        return microGridImgPath;
    }

    // a boolean that checks if the current zoom is equal to or surpasses the highResImgLoadZoomThreshold var
    private zoomThresholdMet(): boolean {
        const currentZoom: number | null = this.getMostCurrentZoom();
        return currentZoom !== null? currentZoom >= this.highResImgLoadZoomThreshold : false;
    }

    // gets the current zoom from the target panzoom element (which is our SVG wrapper) as it appears in the DOM
    // this is more reliable than calling this.currentPanzoom.transform().scale because that scale might not be reflected in the browser/DOM yet
    // * *BUT this should be only in operations that require the current DOM's scale **; use getMostCurrentZoom() for cases that need the target
    // zoom
    private getCurrentZoomInDOM(): number | null {
        if (this.SVGWrapper === null) {
            console.warn("SVG wrapper doesn't exist");
            return null;
        }

        const panzoomElementStyle: CSSStyleDeclaration = window.getComputedStyle(this.SVGWrapper);
        const panzoomElementTransform: DOMMatrix = new DOMMatrix(panzoomElementStyle.transform);

        // since panzoom scales the element uniformally, the average should be equivalent to other a (scaleX) or d (scaleY)
        return (panzoomElementTransform.scale().a + panzoomElementTransform.scale().d)/2;
    }

    // we may need the most current zoom (i.e. the zoom that the panzoom instance has, which may not be represented in browser/DOM yet)
    // NOTE: this zoom requires the current pan zoom or else it'll return null... I'm doing this instead of returning 1 (which should be the
    // actual scale of the element when panzoom is unmounted) to avoid inconsistencies with getCurrentZoomInDOM()
    private getMostCurrentZoom(): number | null {
        if (this.currentPanZoom === null) {
            console.warn("There is no panzoom instance");
            return null;
        }

        return this.currentPanZoom.getTransform().scale;
    }

    // gets the zoom factor that fits the given element or bounding box to the viewport's size
    private getZoomFactorToFit(elementOrRect: SVGGraphicsElement | DOMRect): number | null {
        if (this.diagramContainer === null) {
            console.warn("The diagram container doesn't exist");
            return null;
        }

        // get the current scale of our panzoom element in the DOM
        const scale: number | null = this.getCurrentZoomInDOM();
        if (scale === null) {
            console.warn("Cannot retreive the current scale of the SVG");
            return null;
        }

        // get the bounding rect 
        const elementBoundingRect: DOMRect = elementOrRect instanceof DOMRect ? elementOrRect: elementOrRect.getBoundingClientRect();
        // get the normalized width and height of the element (e.g. the descaled version of the width and height)
        const elementWidthNormalized: number = elementBoundingRect.width/scale;
        const elementHeightNormalized: number = elementBoundingRect.height/scale;
        // get the viewport dimensions
        const diagramContainerBoundingRect: DOMRect = this.diagramContainer.getBoundingClientRect();

        // now see which dimension of the bounding rect is larger, and return the scale of the viewport divided by that dimension normalized
        // equivalent to the minimum scale between the two values here
        if (elementBoundingRect.width > elementBoundingRect.height) 
            return diagramContainerBoundingRect.width/elementWidthNormalized;
        else 
            return diagramContainerBoundingRect.height/elementHeightNormalized;
    }

    // gets the offset of a given bounding box (scaled by zoom) from the viewport center
    private getBoundingBoxOffsetFromViewportCenter(boundingBox: DOMRect, zoom: number): Vector2 | null {
         if (
            this.diagramContainer === null || 
            this.SVGWrapper === null 
        ) {
            console.warn(
                "The diagram container and/or SVG wrapper doesn't exist",
                `Diagram Container Status: ${this.diagramContainer}`,
                `SVG Wrapper Status: ${this.SVGWrapper}`
            );
            return null;
        }

        // get the current scale of the panzoom element 
        const scale: number | null = this.getCurrentZoomInDOM();
        if (scale === null) {
            console.warn("Cannot get the current zoom");
            return null;
        }

        // get the top left of the svg wrapper and diagram container
        const SVGWrapperBoundingRect: DOMRect = this.SVGWrapper.getBoundingClientRect();
        const SVGWrapperTopLeft: Vector2 = new Vector2(SVGWrapperBoundingRect.left, SVGWrapperBoundingRect.top);
        // also get the top left of our viewport
        const diagramContainerBoundingRect: DOMRect = this.diagramContainer.getBoundingClientRect();
        const diagramContainerTopLeft: Vector2 = new Vector2(diagramContainerBoundingRect.left, diagramContainerBoundingRect.top);

        // get the centers of our viewport and the bounding box
        const diagramContainerCenter: Vector2 = new Vector2(
            diagramContainerBoundingRect.left + diagramContainerBoundingRect.width/2,
            diagramContainerBoundingRect.top + diagramContainerBoundingRect.height/2
        );
        const targetCenter: Vector2 = new Vector2(
            boundingBox.left + boundingBox.width/2,
            boundingBox.top + boundingBox.height/2
        );

        // get the translation from origin (0, 0) (diagram container's top left or the SVG wrapper's top left before any translations) 
        // to the center of our station SVG (this is normalized, so scaling [zoom] is accounted for)

        // this logic is equivalent to applying zoomAbs(0, 0, 1) + moveTo(0, 0) then requesting an animation frame (for layout 
        // recalculations; panzoom transformations do not happen instantly since it's a CSS sided transformation) 

        // get local center — essentially target's center relative to the SVG wrapper it is inside of unscaled; 
        // this gives the position as if we aligned the top lefts of the SVG wrapper and the viewport/diagram container 
        // (assuming the wrapper’s untransformed top-left aligns with the diagram container’s top-left)

        // NOTE: remember getBoundingClientRect() is always screen point based... if the viewport's transform origin was shifted x 
        // and y units from the browser's origin (which is (0,0)), it could skew algorithms that assume the viewport is always at 
        // (0,0) in this case, we're okay since we're removing calculations that involve browser space calculations and only
        // local space (within the view port)
        const localCenter: Vector2 = (
            targetCenter
            .subtract(SVGWrapperTopLeft)
            .divide(scale)
        );
        // now scale that local center by the target zoom 
        const scaledTargetCenter: Vector2 = localCenter.multiply(zoom);
        const offset: Vector2 = (
            // get the offset of the center from the top left
            diagramContainerCenter
            .subtract(diagramContainerTopLeft)
            // subtract that from the scaled target center
            .subtract(scaledTargetCenter)
        )

        return offset;
    }

    // disables/enables rot or scalar elements
    private enableDynamicRotOrScalarElements(enable: boolean): void {
        if (this.dynamicElements === null) {
            console.warn("Dynamic elements field hasn't been initialized");
            return;
        }

        // if the current status of the elements match the enable boolean (this means this function has been called with the same boolean
        // before), return to avoid redundant looping
        if (enable === !this.rotOrScalarElementsDisabled)
            return;
        // cycle through each scalar element and set its disabled class respective to the current enable boolean
        this.dynamicElements.allRotationOrScalarElements.forEach((rotOrScalarElement: SVGGraphicsElement) => {
            rotOrScalarElement.classList.toggle("disabled", !enable);
        });
        // update the global boolean to reflect the state of these elements
        this.rotOrScalarElementsDisabled = !enable;
    }

    // handles the rotation of the dynamic elements that rotate
    private handleDynamicElementRotations(mapRotationAngleDeg: number): void {
        if (this.dynamicElements === null) {
            console.warn("The dynamic elements field aren't initialized");
            return;
        }

        // destructure the rot elements from the field for legibility purposes
        const {omnidirectionalRotElements, bidirectionalRotElementsMap} = this.dynamicElements;
        // deal with the bidirectional rotational elements here
        // make sure the rotation angle is in the range [0, 360]
        const normalizedRotationAngleDeg: number = normalizeAngle(mapRotationAngleDeg, AngleType.DEGREES);

        // deal with the omnidirectional rotational elements here
        omnidirectionalRotElements.forEach((rotElement: SVGGraphicsElement) => {
            rotElement.style.transform = `rotate(${normalizedRotationAngleDeg}deg)`;
        });

        // iterate thru the elements array and modify the elements accordingly
        bidirectionalRotElementsMap.forEach((rotElements: SVGGraphicsElement[], startingRotDegNormalized: number) => {
            rotElements.forEach((rotElement: SVGGraphicsElement) => {
                // negative or positive starting rotation, this logic will work for all rotated elements

                // this is basically checking how far away a starting rot is from a 90 degree counter clock wise rot
                const vertFromStartRotDeg: number = normalizeAngle(90 - startingRotDegNormalized, AngleType.DEGREES);
                // the element should rotate when it is an angle of 90 - 270 deg (this includes starting rot)
                // so, since the angle is normalized to purely positive rotations, if the diff is greater than the current rotation angle 
                // OR the diff + 180 is less than the rotation angle, dont the rotate the element
                if (normalizedRotationAngleDeg < vertFromStartRotDeg || normalizedRotationAngleDeg > vertFromStartRotDeg + 180) {
                    rotElement.style.transform = "";
                }
                // else rotate the element
                else {
                    rotElement.style.transform = "rotate(180deg)";
                }
                });
        });
    }

    // handles the scaling of scalar dynamic elements based on the current zoom
    private handleDynamicElementScaling(
        zooms: {
            logoMin: number, logoMax: number,
            labelMin: number, labelMax: number,
            otherMin: number, otherMax: number 
        } = {
            logoMin: 1, logoMax: 2.2,
            labelMin: 1, labelMax: 2,
            otherMin: 0.4, otherMax: 0.8
        }
    ): void {
        // get the most current zoom, not the DOM's zoom
        const currentZoom: number | null = this.getMostCurrentZoom();
        if (currentZoom === null || this.dynamicElements === null) {
            console.warn(
                "Current zoom cannot be retrieved and/or the dynamic elements field is not initialized",
                `Current Zoom Status: ${currentZoom}`,
                `Dynamic Elements Field Status: ${this.dynamicElements}`
            );
            return;
        }

        // this is to normalize our current zoom so that it goes from 0-1
        // this function here is a *sine ease-out function* that is flipped along the x axis
        // the function is represented by this:
        // y = (a - 1)((cos(pi* x)) - 1)/2 + 1 + (a - 1)/c
        // where x = zoomNormalized; y = scaleRatio; a = maxLogoZoom; c = minLogoZoom
        const zoomLimit: number = 8.5;
        const zoomNormalized: number = clamp(currentZoom, Number.EPSILON, zoomLimit)/zoomLimit;
        const logoScaleRatio: number = (
            (zooms.logoMax - 1) * (Math.cos(Math.PI * zoomNormalized) - 1) / 2 + 1 + (zooms.logoMax - 1)/zooms.logoMin
        );

        // function for scalar label elements will be an *exponenetial ease-out* function flipped along the y axis
        // the function is represented by this:
        // PIECEWISE FUNCTION
        // x == 0 {y = a}
        // x > 0 {y = -(a - c)*2^(10 * (x - 1)) + a}
        // where x = zoomNormalized; y = scaleRatio; a = maxLabelZoom; c = minLabelZoom
        const labelScaleRatio: number = (
            zoomNormalized === 0?
            zooms.labelMax:
            -(zooms.labelMax - zooms.labelMin) * Math.pow(2, 10 * (zoomNormalized-1)) + zooms.labelMax
        );

        // function for the other scalar elements will be a *cubic ease-in-out* function flipped along the y axis
        // the function can represented by this:
        // PIECEWISE FUNCTION
        // x < 0.5 {y = -4(a -c)(x^3) + a}
        // x >= 0.5 {y = -4(a - c)(x-1)^3 + c}
        // where x = zoomNormalized; y = scaleRatio; a = maxOtherZoom; c = minOtherZoom
        const otherScaleRatio: number = (
            zoomNormalized < 0.5 ?
            -4 * (zooms.otherMax - zooms.otherMin) * Math.pow(zoomNormalized, 3) + zooms.otherMax:
            -4 * (zooms.otherMax - zooms.otherMin) * Math.pow((zoomNormalized - 1), 3) + zooms.otherMin
        );

        this.dynamicElements.scalarLogoElements.forEach((scalarElement: SVGGraphicsElement) => {
            scalarElement.style.scale = logoScaleRatio.toString();
        });
        this.dynamicElements.scalarLabelElements.forEach((scalarElement: SVGGraphicsElement) => {
            scalarElement.style.scale = labelScaleRatio.toString();
        });
        this.dynamicElements.otherScalarElements.forEach((scalarElement: SVGGraphicsElement) => {
            scalarElement.style.scale = otherScaleRatio.toString();
        });
    }

    // limits users from panning beyond a given certain limit when they either zoom or pan
    private handlePanningLimit(): void {
        if (this.currentPanZoom === null) {
            console.warn("Panzoom instance doesn't exist");
            return;
        }

        // get the panning limits
        const panningLimits: {offsetLimitTopLeft: Vector2, offsetLimitBottomRight: Vector2} | null = this.getPanningLimits();
        if (panningLimits === null) {
            console.warn("Could not get panning limits");
            return;
        }

        // get our current transform (btw, the x and y represent the next position the panzoom will move, not the current
        // translation)
        const currentPanZoomTransform: {x: number, y: number, scale: number} = this.currentPanZoom.getTransform();
        // get the current pos (not really the current current pos but it's the future pos that panzoom has set for the DOM to paint), \
        // just set it the current transform for its initial value and modify accordingly if need be
        const currentPos: Vector2 = new Vector2(currentPanZoomTransform.x, currentPanZoomTransform.y);

        // enable a boolean guard to prevent panzoom.moveTo() from causing a overflow stack ; this is because everytime
        // panzoom is moved programmatically (e.g. with panzoom.moveTo()) or in the app, the event listener panzoom.on("pan") 
        // fires interrupting the thread temporarily and going back to event logic of the event listener
        // since handlePanningLimit() will be in this event listener, you can understand why this causes endless recursion without
        // the guard
        this.ignorePanzoomEvents = true;

        // just destructuring here to make things more legible
        const {offsetLimitBottomRight, offsetLimitTopLeft} = panningLimits;

        // clamp the x and y to the offset limits
        const targetPos: Vector2 = new Vector2(
                clamp(currentPos.x, offsetLimitBottomRight.x, offsetLimitTopLeft.x),
                clamp(currentPos.y, offsetLimitBottomRight.y, offsetLimitTopLeft.y)
        );

        // now move the panzoom to the current location
        this.currentPanZoom.moveTo(targetPos.x, targetPos.y);

        // now turn off the boolean guard
        this.ignorePanzoomEvents = false;
    }

    // gets the top left and bottom right limits for how much the user can pan (these limits are influenced by the min zoom scale)
    private getPanningLimits(scaleOverride: number | null = null): {
        offsetLimitTopLeft: Vector2, offsetLimitBottomRight: Vector2
    } | null {
        if (
            this.diagramContainer === null || 
            this.stationSVG === null ||
            this.minZoom === null
        ) {
            console.warn(
                "Diagram container and/or station SVG doesn't exist and/or min zoom field hasn't been initialized",
                `Diagram Container Status: ${this.diagramContainer}`,
                `Station SVG Status: ${this.stationSVG}`,
                `Min Zoom Field Status: ${this.minZoom}`
            );
            return null;
        }

        // what to do here?
        // get the section of the SVG wrapper that the viewport (diagram container) shows when it is scaled by the min zoom and centered based on
        // the station SVG 
        // the bounds of that viewport at that scale represents the limits of how much the user can pan vertically and horizontally
        // the bounds can scale based on the zoom... think of it as more of a section of the SVG wrapper than just the viewport

        let scale: number | null = null;

        if (scaleOverride !== null) {
            scale = scaleOverride;
        }
        else {
            // get the most up to date zoom (not the DOM, the scale of the current panzoom instance) so the panning limits can be used
            // for handling pan AND zoom events
            scale = this.getMostCurrentZoom();
            if (scale === null) {
                console.warn("Could not get the current zoom");
                return null;
            }
        } 
        // get the offset/translation the SVG wrapper has to move in order to center the station SVG center at the
        // viewport (at the scale of min zoom)
        // essentially, the offset represents how much must the SVG wrapper translate to center the station SVG on the diagram container 
        // at the min zoom scale; however, you could also think of the offset as the point on the SVG wrapper that is located at the transform 
        // origin of the viewport (e.g. top-left which is at (0,0)) when it is centered with the station SVG at the min zoom scale
        const offsetByMinZoom: Vector2 | null = this.getBoundingBoxOffsetFromViewportCenter(
            this.stationSVG.getBoundingClientRect(), 
            this.minZoom
        );
        if (offsetByMinZoom === null) {
            console.warn("Cannot retrieve offset for station SVG");
            return null;
        }

        // now scale this offset to our current scale
        // this returns us how much the SVG wrapper must translate before the top left of the current viewport goes out of bounds
        // of our scaled viewport section
        const offsetLimitTopLeft: Vector2 = (
            offsetByMinZoom
            // we scale by scale/this.minZoom since the offset is already scaled to match minZoom
            // so now the minZoom scale is our reference point
            .multiply(scale/this.minZoom)
        );

        const diagramContainerBoundingRect: DOMRect = this.diagramContainer.getBoundingClientRect();
        const diagramContainerDimensions: Vector2 = new Vector2(diagramContainerBoundingRect.width, diagramContainerBoundingRect.height);
        // what about bottom right?
        // this is equal to: top left scaled + length of the viewport scaled - length of current view port
        // this returns us how much the SVG wrapper must translate before the bottom right of the current viewport goes out of bounds
        // of our scaled viewport section
        const offsetLimitBottomRight: Vector2 = (
            // get our new top left point 
            offsetLimitTopLeft
            // subtract it from the viewports's dimensions scaled to match the current zoom
            // think of it as the viewport dimensions (in min zoom scale) is now scaled to match the current scale
            .subtract(
                diagramContainerDimensions
                .multiply(scale/this.minZoom)
            )
            // now add the viewport's dimensions (unscaled)
            .add(diagramContainerDimensions)
        );

        // this is equivalent to offsetLimitBottomRight; it's the exact same values, just a different order of transformations
        // const a: Vector2 = (
        //     offsetByMinZoom
        //     .subtract(diagramContainerDimensions)
        //     .multiply(scale/this.minZoom)
        //     .add(diagramContainerDimensions)
        // );

        return {offsetLimitTopLeft: offsetLimitTopLeft, offsetLimitBottomRight: offsetLimitBottomRight};
    }

    // adjusts the opacity of the map by given the percentage
    public adjustMapOpacity(targetPercentage: number): void {
        if (this.map === null) {
            console.warn("The SVG map elements field is initialized");
            return;
        }
        
        // the limits of the target percentage are gonna be explicitly set here
        const minOpacity: number = 0;
        const maxOpacity: number = 1;
        // using those values, we clamp the target percentage (notice how we scale it down to a decimal value because opacity
        // requires either a decimal value or the target percentage + % sign for it to work)
        targetPercentage = clamp(targetPercentage*0.01, minOpacity, maxOpacity);
        // we set the opacity of the entire map group by this opacity
        this.map.elements.parent.style.opacity = targetPercentage.toString();
    }

    // updates the state of the svg renderer (and sets any events accordingly)
    public setCurrentMapView(view: MapView): void {
        if (this.map === null) {
            console.warn("SVG map elements field is not initialized");
            return;
        }
        
        // set our map view here (do this first because the dynamic image loading methods require the currentMapView to be
        // updated properly first)
        this.currentMapView = view;
        // destructure the relevant properties (the map-related elements) from the map for legibility purposes
        const {parent, roadMapGroup, satelliteMapGroup} = this.map.elements;

        // deal with the state change here
        switch(this.currentMapView) {
            case MapView.DEFAULT:
                parent.style.display = "none";
                break;
            case MapView.ROAD:
                parent.style.display = "block";
                roadMapGroup.style.display = "block";
                satelliteMapGroup.style.display = "none";
                // also run the dynamic image loading so the images can remain crisp if zoomed in already
                this.handleGridImageLoad();
                break;
            case MapView.SATELLITE:
                parent.style.display = "block";
                roadMapGroup.style.display = "none";
                satelliteMapGroup.style.display = "block";
                // do the same for the satellite view as the road view in terms of dynamic image loading
                this.handleGridImageLoad();
                break;
        }
    }

    // spawns a GPS marker at the given coords and heading and adds it to the DOM
    public async spawnGPSMarker(
        gpsMarkerSVGPath: string, 
        coords: {absolute: Vector2, relative: Vector2, base: Vector2},
        heading: {absolute: number, relative: number, base: number} | null,
        size: number = 10
    ): Promise<void> {
        if (this.SVG === null) {
            console.warn("SVG doesn't exist");
            return;
        }

        // since the spawnGPSMarker() will be put in a callback, we have to prevent desyncing issues where this function
        // gets repeatedly called and repeatedly fetches multiple GPS marker instances (this happens because fetch is async)
        if (this.GPSMarkerInstantiating) {
            console.log("A GPS marker is already being instantiated");
            return;
        }

        // if the GPS marker doesn't exist, create it
        if (this.GPSMarker === null) {
            // set the boolean guard here true before the fetching 
            this.GPSMarkerInstantiating = true;

            // start fetching the SVG
            const res: Response = await fetch(gpsMarkerSVGPath);
            const SVGContent: string = await res.text();

            // turn off the boolean guard
            this.GPSMarkerInstantiating = false;

            // using a DOMParse is much safer than loading in through innerHTML or related methods because it could accidentally
            // mess up event listeners and layouts
            const parser: DOMParser = new DOMParser();
            const SVGDocument: Document = parser.parseFromString(SVGContent, "image/svg+xml");
            // get the actual element from the document
            const GPSElement: SVGSVGElement = SVGDocument.documentElement as unknown as SVGSVGElement;

            // also retrieve the vision cone from the newly loaded in SVG
            const visionCone: SVGGraphicsElement | null = SVGDocument.querySelector("[id='Vision Cone']");
            if (visionCone === null) {
                console.warn("Vision cone doesn't exist");
                return;
            }

            // assign it to our variable
            this.GPSMarker = {GPSElement: GPSElement, visionCone: visionCone};
        }

        // destructure for legibility
        const {GPSElement, visionCone} = this.GPSMarker;

        // set the styling
        GPSElement.setAttribute("width", size.toString());
        GPSElement.setAttribute("height", size.toString());
        // if there is no heading, just make the vision cone invisible
        if (heading === null) 
            visionCone.style.display = "none";
        else 
            visionCone.style.display = "block";

        // append the element to the SVG
        this.SVG.append(GPSElement);
        // set the spawned boolean to true, do this before updateGPSMarker() as it requires this to be true
        this.GPSMarkerSpawned = true;
        // update the marker's positioning and orientation
        this.updateGPSMarker(coords, heading);
    }

    // updates the positioning of the GPS marker
    public updateGPSMarker(
        coords: {absolute: Vector2, relative: Vector2, base: Vector2},
        heading: {absolute: number, relative: number, base: number} | null
    ): void {
        if (this.GPSMarker === null || !this.GPSMarkerSpawned) {
            console.log(
                "GPS marker doesn't exist or it hasn't spawned in",
                `GPS Marker Status: ${this.GPSMarker}`,
                `GPS Marker Spawned Status: ${this.GPSMarkerSpawned}`
            );
            return;
        }
        // get the coords (using relative coords for now)
        const {x, y} = coords.relative;
        // also destructure the GPS marker for legibility purposes
        const {GPSElement, visionCone} = this.GPSMarker;

        // set the SVG attributes that set its location and orientation
        GPSElement.setAttribute("x", x.toString());
        GPSElement.setAttribute("y", y.toString());
        GPSElement.setAttribute("transform-origin", "center")
        // also actively set styling for the vision cone depending on whether the heading obj is null or not
        if (heading === null) {
            visionCone.style.display = "none";
        }
        else {
            visionCone.style.display = "block";
            GPSElement.setAttribute("transform", `rotate(${heading.relative})`);
        }
    }

    // despawns the GPS marker from the DOM
    public despawnGPSMarker(): void {
        if (this.GPSMarker === null) {
            console.warn("GPS marker doesn't exist");
            return;
        }

        // remove from the DOM
        this.GPSMarker.GPSElement.remove();
        // set the boolean to false
        this.GPSMarkerSpawned = false;
    }
}
