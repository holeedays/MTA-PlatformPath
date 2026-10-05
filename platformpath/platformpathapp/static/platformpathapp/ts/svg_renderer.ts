// Contains all functions related to rendering the svg diagrams

import { type LayerData } from "./station_data.ts";
import { NodeSVG } from "./station_custom_elements.ts";
import { NodeOption } from "./station_custom_elements.ts"
import { getCurrentTransformMatrix, getElementCentersOffset, boundingRectsAreIntersecting, Vector2 } from "./transformations.ts";
import { clamp } from "./utils.ts";
// import panzoom, {type PanZoom} from "panzoom"; // toggle this off when running server since panzoom has a problem with es6 modules

export type SelectionRole = "start" | "end";
export enum MapView {
    DEFAULT,
    ROAD,
    SATELLITE
}

export class SvgRenderer {
    // @ts-ignore
    private currentPanZoom: PanZoom | null = null;
    private diagramContainer: HTMLDivElement | null = null;
    private SVGWrapper: HTMLDivElement | null = null;
    private SVG: SVGSVGElement | null = null;
    private stationSVG: SVGGraphicsElement | null = null;
    private currentMapView: MapView = MapView.DEFAULT;
    private dynamicElements: {
        omnidirectionalRotationElements: SVGGraphicsElement[],
        bidirectionalRotationElementsMap: Map<number,{element: SVGGraphicsElement,startingRotation: number}[]>,
        gridItemIDRoadMapImageMap: Map<string,SVGImageElement>,
        gridItemIDSatelliteMapImageMap: Map<string,SVGImageElement>
    } | null = null;
    private mapElements: {
        parent: SVGGraphicsElement, 
        grid: SVGGraphicsElement,
        roadMap: SVGGraphicsElement, 
        satelliteMap: SVGGraphicsElement
    } | null = null;
    private mapData: {
        retrieved: {
            roadMapHighResGridPicPaths: Record<string,string>,
            satelliteMapHighResGridPicPaths: Record<string,string>
        }
        meta: {
            cachedGridPicPaths: Set<string>  
        }  
    } | null = null;
    private mapRotationSensitivity: number;
    private highResImgLoadZoomThreshold: number;

    constructor(mapRotationalSensitivity: number = 0.5, highResImgLoadZoomThreshold: number = 2) {
        // init some variables that we can modify during constructor creation
        this.mapRotationSensitivity = mapRotationalSensitivity;
        this.highResImgLoadZoomThreshold = highResImgLoadZoomThreshold;

        // init diagram contaier field
        this.initDiagramContainerField();
        // init our svg wrapper field
        this.initSVGWrapperField();
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
        if (this.SVG === null) {
            console.warn("The entire SVG doesn't exist");
            return;
        }

        const omnidirectionalRotationalElements: NodeListOf<SVGGraphicsElement> = (
            this.SVG.querySelectorAll<SVGGraphicsElement>("[id^='__FOLLOW_ROT_']")
        );

        // create a bidirectional rotational elements hash map (used for later sorting)
        const bidirectionalRotationalElementsMap: Map<number,{element: SVGGraphicsElement, startingRotation: number}[]> = new Map();
        // crate a key for every 10 degrees of rotation (all the way up to a full circle and only in a counter clockwise direction
        // (e.g. a positive rotation value))
        for (let i=0; i<350; i+=10) 
            bidirectionalRotationalElementsMap.set(i, []);
        // actually fetch the elements from the DOM
        const bidirectionalRotationalElements: NodeListOf<SVGGraphicsElement> = (
            this.SVG.querySelectorAll<SVGGraphicsElement>("[id^='__ROT_']")
        );
        // iterate thru each element in the DOM
        for (const rotElement of bidirectionalRotationalElements) {
            // extract the starting rotation of the bidirectional rotational element and then sort it in into the map

            // first extract the starting rotation
            // regex pattern to match anything between __ROT_ and the next _ (if there is, otherwise it just matches the entire
            // chunk after __ROT_)
            const regexFilter: RegExp = new RegExp(/__ROT_([^_]+)/);
            // this should match and return us the string containing the rotation value
            const filteredID: RegExpMatchArray | null = rotElement.id.match(regexFilter);

            if (filteredID === null) {
                console.log(`Rotation element with id '${rotElement.id}' doesn't have the id name set properly`);
                continue;
            }

            // now parse the string into a number
            // match returns the full matched string in the 0th index and any captured group (the stuff in paranthesis) in 1st
            // index
            let startingRotation: number = parseFloat(filteredID[1] ?? "");
            if (isNaN(startingRotation)) {
                console.log(`Rotation element with id '${rotElement.id}' doesn't have the id name set properly`);
                continue;
            }

            // if the value is negative, normalize it to the equivalent positive rotation
            if (startingRotation < 0)
                startingRotation += 360;

            // get the key for our map, which is equivalent to the value listed below
            const key: number = Math.floor(startingRotation/10) * 10;
            // retrieve the initialized array from this given key
            const elementsArray: {element: SVGGraphicsElement, startingRotation: number}[] | undefined = (
                bidirectionalRotationalElementsMap.get(key)
            );
            // since compiler is strict, we have to run this undefined check though the value should never be undefined for 
            // our use case (given that we properly configured the rotational values in the station map diagram)
            if (elementsArray !== undefined) {
                // now sort our starting rotation into the array of elements 
                // this sorting will help us in the future to prevent excessive looping thru elements 

                // get the index which we will sort the new element
                let insertIndex: number = 0;
                for (const element of elementsArray) {
                    if (startingRotation < element.startingRotation) 
                        break;
                    insertIndex++;
                }
                // create our new element 
                const newElement: {element: SVGGraphicsElement, startingRotation: number} = {
                    element: rotElement, startingRotation: startingRotation
                };
                // insert it into the array; since the elementsArray is a ref to the actual object in the map, there is no need
                // to re-set the key and value — the value is already mutated
                elementsArray.splice(insertIndex, 0, newElement);
            }
        }

        // assign all our initialized values
        this.dynamicElements = {
            omnidirectionalRotationElements: Array.from(omnidirectionalRotationalElements),
            bidirectionalRotationElementsMap: bidirectionalRotationalElementsMap,
            // initialize empty maps to the gridItemIDMap fields... they will be dynamically updated in initDynamicImageBGLoad()
            gridItemIDRoadMapImageMap: new Map(),
            gridItemIDSatelliteMapImageMap: new Map()
        }
    }

    // init the svg map elements field (do this when we have loaded in the SVG element)
    private initMapElementsField(): void {
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

        this.mapElements = {parent: mapSVGParent, grid: mapGrid, roadMap: roadMapGroup, satelliteMap: satelliteMapGroup};
    }

    // initializes the map data field (do this when we have loaded in the SVG element since we can actually access the station data
    // from there)
    private initMapDataField(
        roadMapHighResGridPicPaths: Record<string,string>, 
        satelliteMapHighResGridPicPaths: Record<string,string>
    ): void {
        // the following variables are essentially caches that record what pic paths we have loaded in
        // using these variables would prevent redundant image loading when thing are already loaded in
        const cachedGridPicPaths: Set<string> = new Set();
        const gridItemIDRoadMapImageMap: Map<string,SVGImageElement> = new Map();
        const gridItemIDSatelliteMapImageMap: Map<string,SVGImageElement> = new Map();

        // map data is broken into 2 chunks
        this.mapData = {
            // retrieved describes data that was retreieved externally (e.g. when StationData is loaded from our API call in the
            // StationMapPage class)
            retrieved: {
                roadMapHighResGridPicPaths,
                satelliteMapHighResGridPicPaths
            },
            // meta pertains to any data that helps us in translating the retrieved data (hence the meta-data name)
            // this includes caching and any other data descriptors, mostly caching for now 
            meta: {
                cachedGridPicPaths
            }
        }
    }

    // loads the diagram into the page's diagram container
    private async loadDiagram(svgPath: string): Promise<void> {
        if (this.SVGWrapper === null) {
            console.warn("SVG wrapper element doesn't exist");
            return;
        }

        // fetch our svg
        const response: Response = await fetch(svgPath);
        const svgContent: string = await response.text();
        // assign the svg into our diagram container
        this.SVGWrapper.innerHTML = svgContent;
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
        // find our new svg that we will highlight
        // unescaped spaces don't work with query selector (and our svg ids usually have spaces) so we do this instead
        const node: SVGGraphicsElement | null = document.querySelector("#" + CSS.escape(nodeOption.SVGID));
        if (node === null) {
            console.warn(`Node with SVG ID: '${nodeOption.SVGID}' cannot be found`);
            return;
        }
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
        let leftTopMostPoint: Vector2 = new Vector2(0, 0);
        let rightBottomMostPoint: Vector2 = new Vector2(0, 0);
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
        this.centerBoundingBoxInViewport(nodeGroupBoundingBox, zoomMultiplier, zoom);
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
        this.centerBoundingBoxInViewport(nodeBoundingRect, zoomMultiplier, zoom);
    }
    
    // base function for centering any bounding box (e.g. the client rect of a target SVG element/HTML element or a custom DOMRect)
    // zoomMultiplier scales the computed zoom for the bounding box (which is equivalent to the diagram container (viewport's) height
    // or width divided by the normalized value of the bounding box (normalized value = bounding box / panzoom scale))
    private centerBoundingBoxInViewport(
        boundingBox: DOMRect,
        zoomMultiplier: number = 1,
        zoomOverrideValue: number | null = null
    ): void {
           if (this.currentPanZoom === null || this.diagramContainer === null || this.SVGWrapper === null) {
            console.warn(
                "Panzoom instance, the diagram container, and/or the SVG wrapper element doesn't exist",
                `Panzoom Instance Status: ${this.currentPanZoom}`,
                `Diagram Container Status: ${this.diagramContainer}`,
                `SVG Wrapper Status: ${this.SVGWrapper}`
            );
            return;
        }

        // get our current scale (e.g. how zoomed in are we)
        const scale: number = this.currentPanZoom.getTransform().scale;
        // get the normalized version of our svg width/height (e.g. as if we didn't apply any scaling to the svg at all; this doesn't
        // exclude translations and rotations so the bounding rect values will be different everytime) this is our grounds for how far 
        // we should zoom in
        const boundingBoxWidthNormalized: number = boundingBox.width/scale;
        const boundingBoxHeightNormalized: number = boundingBox.height/scale;
        // get our viewport dimensions
        const diagramContainerBoundingRect: DOMRect = this.diagramContainer.getBoundingClientRect();

        let zoom: number = 1;
        // determine whether we want an explicit zoom value (the zoomOverride var) or not
        if (zoomOverrideValue === null) {
            // if not determine the adequate zoom based on the normalized bounds of the SVG element respective to the container's 
            // dimensions multiplied by the zoom multiplier
            if (boundingBox.height > boundingBox.width) 
                zoom = diagramContainerBoundingRect.height/boundingBoxHeightNormalized * zoomMultiplier;
            else
                zoom = diagramContainerBoundingRect.width/boundingBoxWidthNormalized * zoomMultiplier;
        }
        else {
            // if yes, then include the zoom value as is
            zoom = zoomOverrideValue;
        }

        // get the top left of the svg wrapper and diagram container
        const SVGWrapperBoundingRect: DOMRect = this.SVGWrapper.getBoundingClientRect();
        const SVGWrapperTopLeft: Vector2 = new Vector2(SVGWrapperBoundingRect.left, SVGWrapperBoundingRect.top);
        const diagramContainerTopLeft: Vector2 = new Vector2(diagramContainerBoundingRect.left, diagramContainerBoundingRect.top);

        // get the centers of our viewport and station SVG
        const diagramContainerCenter: Vector2 = new Vector2(
            diagramContainerBoundingRect.left + diagramContainerBoundingRect.width/2,
            diagramContainerBoundingRect.top + diagramContainerBoundingRect.height/2
        );
        const targetSVGElementCenter: Vector2 = new Vector2(
            boundingBox.left + boundingBox.width/2,
            boundingBox.top + boundingBox.height/2
        );

        // get the translation from origin (0, 0) (diagram container's top left or the SVG wrapper's top left before any translations) 
        // to the center of our station SVG (this is normalized, so scaling [zoom] is accounted for)

        // this logic isequivalent to applying zoomAbs(0, 0, 1) + moveTo(0, 0) then requesting an animation frame (for layout 
        // recalculations; panzoom transformations do not happen instantly since it's a CSS sided transformation) in which you calculate 
        // the translation between the center of the diagram container and the station SVG and moveTo() that position then apply the
        // actual zoom value 
        const SVGWrapperDiagramContainerOffsetNormalized: Vector2 = (
            SVGWrapperTopLeft
            .divide(scale)
            .subtract(diagramContainerTopLeft)
        )
        const normalizedTargetSVGCenter: Vector2 = (
            targetSVGElementCenter
            // divide by scale unitially to undo the dilation
            .divide(scale)
            // subtract our translation that aligns the top left corners of the svg wrapper and the diagram container (their 
            // transform origins are both top-left so this is valid)
            .subtract(SVGWrapperDiagramContainerOffsetNormalized)
            // multiply by the zoom (equivalent to dilating at (0,0)), this is to apply what zoomabs would do to this point
            .multiply(zoom)
        );

        // offset is equivalent to the translation between the normalized station SVG center point and the diagram container
        // in other words, offset = diagram container center pt (viewport center) - zoomed/dilated (by (0,0)) station svg center point 
        const offset: Vector2 = diagramContainerCenter.subtract(normalizedTargetSVGCenter);

        // NOTE: zoomAbs only scales the svg by the given factor (the 3rd param) with the anchor being the first and second
        // it scales the svg size when it was originally set in the viewport (e.g. if it's 1920px by 1080px, zoomAbs would shrink
        // the value to 1920x.9 1080*.9 with the top left still being at (0,0) (the diagram container's top-left) since we the anchor/transform origin [the first 2 params
        // of currentPanZoom] is at 0,0).
        this.currentPanZoom.zoomAbs(0, 0, zoom);
        // NOTE: moveTo() is not based on the relative position of the panzoom element, it's relative from (0,0)
        this.currentPanZoom.moveTo(
            offset.x,
            offset.y
        );
    }

    // Setup our panzoom object with proper params (this includes mouse scroll, drag)
    private setupPanzoomControls(
        beforeMouseDownEventHandler: ((ev: MouseEvent) => any) | undefined = undefined,
        beforeWheelEventHandler: ((ev: WheelEvent) => any) | undefined = undefined
    ): void {
        if (this.SVGWrapper === null) {
            console.warn("SVG wrapper element does not exist");
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
            minZoom: 0.3,
            smoothScroll: false,
            beforeMouseDown: beforeMouseDownEventHandler,
            beforeWheel: beforeWheelEventHandler
        });
    }

    // Method to load the diagram and immediately attach controls
    public async loadDiagramWithControls(
        diagramPath: string, 
        roadMapHighResGridPicPaths: Record<string,string>,
        satelliteMapHighResGridPicPaths: Record<string,string>
    ): Promise<void> {
        // load the diagram into the container
        await this.loadDiagram(diagramPath);
        // init some macro styling for the SVG
        this.initSVGStyling();
        // init the rotation controls of the map
        this.initRotationControls();
        // center the map to where the station is at
        this.centerMap();
        // init the SVG Map Elements field (this field needs to be initialized before the last 2 methods in this function body since 
        // they depend on variables within this field)
        this.initMapElementsField();
        // init the map data field (must be initialized before initDynamicBGImageLoad() since it requires this field)
        this.initMapDataField(roadMapHighResGridPicPaths, satelliteMapHighResGridPicPaths);
        // init the dynamic elements field (also must be initalized before initDynamicBGImageLoad() cause it requires the field as
        // well)
        this.initDynamicElementsField();
        // set the dynamic loading event handling for the back ground map images
        this.initDynamicBGImageLoad();
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

    // set the event logic to allow us to rotate the svg
    private initRotationControls(): void {

        if (this.diagramContainer === null || this.SVGWrapper == null || this.SVG === null || this.stationSVG === null) {
            console.warn(
                "Diagram container, SVG wrapper, the full SVG, and/or the station SVG within it doesn't exist",
                `Diagram Container Status: ${this.diagramContainer}`,
                `SVG Wrapper Status: ${this.SVGWrapper}`,
                `SVG Status: ${this.SVG}`,
                `Station SVG Status: ${this.stationSVG}`,
            );
            return;
        }

        // init our booleans and numbers to store and check the state of our rotation logic
        let ctrlKeyPressed: boolean = false;
        let mouseIsDown: boolean = false;
        let prevPosX: number = 0;

        // variables representing the translations of our SVG (for our matrix rotation transformation)
        let pivotX: number = 0;
        let pivotY: number = 0;

        // we're going to follow google's rotation method where you must hit control before allowing the user to rotate the map on pc
        window.addEventListener("keydown", (ev: KeyboardEvent) => {
            ctrlKeyPressed = ev.ctrlKey;
        });
        window.addEventListener("keyup", (ev: KeyboardEvent) => {
            ctrlKeyPressed = false;
        });

        // add the drag logic for the svg rotation
        this.diagramContainer.addEventListener("mousedown", (ev: MouseEvent) => {
            if (this.SVGWrapper === null || this.diagramContainer === null || this.currentPanZoom === null)
                return;

            // NOTE: this way only works because the SVG is centered horizontally and vertically in the SVGWrapper (see station map CSS)
            // with the transform origin set to the SVG's center;
            // to do it by transform origin of 0,0; the top left corner of the SVG has to align with the SVGWrapper in the (set in the CSS)
            // then the offset has to be calculated between the top/left of the SVGWrapper and the center of the diagram container
            // (e.g. we don't calculate the offsets based on the center in this case)
            const offset: Vector2 = getElementCentersOffset(this.diagramContainer, this.SVGWrapper);
            const scale = this.currentPanZoom.getTransform().scale;

            // the pivots/translations is equivalent to the offset de-scaled (e.g. the offset as if SVGWrapper wasn't scaled)
            pivotX = offset.x/scale;
            pivotY = offset.y/scale;

            // init the previous position
            prevPosX = ev.x;
            // signify the mouse is down
            mouseIsDown = true;
        });
        // both mouse up and mouse leave will disable mouseIsDown to prevent some funky behavior depending on where the user drags
        // (e.g. rotation spazzes out)
        this.diagramContainer.addEventListener("mouseup", (ev: MouseEvent) => {
            mouseIsDown = false;
        });
        this.diagramContainer.addEventListener("mouseleave",  (ev: MouseEvent) => {
            mouseIsDown = false;
        });
        // deals with the actual rotation logic of the map
        this.diagramContainer.addEventListener("mousemove", (ev: MouseEvent) => {
            if (!ctrlKeyPressed || !mouseIsDown || this.SVG === null)
                return;
            
            // get our rotation from our initial mouse point and the new point
            const displacementX: number = prevPosX - ev.x;
            const rotDeg = displacementX * this.mapRotationSensitivity;
            // update our previous position
            prevPosX = ev.x;

            // create an identity matrix
            const rotMatrix: DOMMatrix = (
                // instantiate a new identity matrix
                new DOMMatrix()
                // do the standard for rotating a point around a matrix
                .translate(pivotX, pivotY)
                .rotate(rotDeg)
                .translate(-pivotX, -pivotY)
            );

            // we're applying our new transform matrix onto the existing one
            const SVGMatrix: DOMMatrix = getCurrentTransformMatrix(this.SVG);
            const productMatrix: DOMMatrix = rotMatrix.multiply(SVGMatrix);
            this.SVG.style.setProperty("--transformation-matrix", productMatrix.toString());
        });

        // also pass a closure function with passed reference of the ctrlKeyPressed boolto our panzoom setup so that panzoom 
        // doesn't activate if the ctrl key is pressed
        const beforeMouseDownHandler: (ev: MouseEvent) => boolean = (ev: MouseEvent) => {
            let shouldIgnore: boolean = ctrlKeyPressed;
            return shouldIgnore;
        }; 
        this.setupPanzoomControls(beforeMouseDownHandler);
    }

    // init loading higher res images logic depending on the zoom set here
    private initDynamicBGImageLoad(
        zoomThreshold: number = 2
    ) {
        if (this.currentPanZoom === null || this.diagramContainer === null || this.SVG === null) {
            console.warn(
                "Panzoom instance, diagram container, and/or SVG doesn't exist",
                `Panzoom Instance Status: ${this.currentPanZoom}`,
                `Diagram Container Status: ${this.diagramContainer}`,
                `SVG Status: ${this.SVG}`
            );
            return;
        }

        // deals with loading high res images and caching them
        this.currentPanZoom.on("pan", (ev: any) => {
            if (this.diagramContainer === null || this.currentPanZoom === null)
                return;

            // get the current zoom
            const currentZoom: number = this.currentPanZoom.getTransform().scale;
            const zoomThresholdMet: boolean = currentZoom >= zoomThreshold;

            // handle the loading of our high res map images
            this.handleHighResMapGridImageLoad();
            // handle loading and deloading (showing and hiding) of existing high res map images in the SVG
            this.handleExistingHighResMapGridImageLoad();
        });

        this.currentPanZoom.on("zoom", (ev: any) => {
            // get the current zoom
            const currentZoom: number = this.currentPanZoom.getTransform().scale;
            const zoomThresholdMet: boolean = currentZoom >= zoomThreshold;

            // handle the loading of our high res map images
            this.handleHighResMapGridImageLoad();
            // handle loading and deloading (showing and hiding) of existing high res map images in the SVG
            this.handleExistingHighResMapGridImageLoad();
        });
    }

    // handler for loading the high res map images
    private handleHighResMapGridImageLoad(): void {
        if (this.mapElements === null || this.mapData === null || this.dynamicElements === null) {
            console.warn(
                "Map elements, map data, and/or the dynamic elements field is not initialized",
                `Map Elements Field Status: ${this.mapElements}`,
                `Map Data Field Status: ${this.mapData}`,
                `Dynamic Elements Field Status: ${this.dynamicElements}`
            );
            return;
        }

        // only go through with image loading if the zoom threshold was met or the current SVG view isn't default
        if (!this.zoomThresholdMet() || this.currentMapView === MapView.DEFAULT)
            return;

        // iterate through our positioning items on our map grid SVG
        for (const gridItem of this.mapElements.grid.children) {
            const gridItemAsSVGElement: SVGGraphicsElement = gridItem as SVGGraphicsElement;

            // determine which type of view we're at and get the path of our grid pic element and set these variables accordingly
            let targetMapGroup: SVGGraphicsElement | null = null;
            let targetHighResGridPicPaths: Record<string,string> | null = null;
            let targetGridItemIDImageMap: Map<string,SVGImageElement> | null = null;

            if (this.currentMapView === MapView.ROAD) {
                targetMapGroup = this.mapElements.roadMap;
                targetHighResGridPicPaths = this.mapData.retrieved.roadMapHighResGridPicPaths;
                targetGridItemIDImageMap = this.dynamicElements.gridItemIDRoadMapImageMap;
            }
            else if (this.currentMapView === MapView.SATELLITE) {
                targetMapGroup  = this.mapElements.satelliteMap;
                targetHighResGridPicPaths = this.mapData.retrieved.satelliteMapHighResGridPicPaths;
                targetGridItemIDImageMap = this.dynamicElements.gridItemIDSatelliteMapImageMap;
            }

            if (targetMapGroup === null || targetHighResGridPicPaths === null || targetGridItemIDImageMap === null) 
                return;

            // get our grid pic path from the target high rest grid pic path
            const gridPicPath: string | undefined = targetHighResGridPicPaths[gridItemAsSVGElement.id];
            // create an image grid item 
            const imageGridItem: SVGImageElement | null = this.createImageGridItem(
                    gridPicPath, this.mapData.meta.cachedGridPicPaths, gridItemAsSVGElement
            );
            // if the path is valid and the item is not null (the grid pic path check is redundant since an image grid item cannot
            // be created without a valid path anyways)
            if (gridPicPath !== undefined && imageGridItem !== null) {
                // add the element to our SVG in the DOM
                targetMapGroup.appendChild(imageGridItem);
                // map the gridItem id to the image grid item
                targetGridItemIDImageMap.set(gridItemAsSVGElement.id, imageGridItem);
                // add the path to our cache to avoid repeatedly creating the same image grid items
                this.mapData.meta.cachedGridPicPaths.add(gridPicPath);
            }
        }   
                 
    }

    // creates an SVG image grid item (a supersampled version of one the high res map grid images) and returns it
    private createImageGridItem(
        gridPicPath: string | undefined, 
        cachedGridPicPaths: Set<string>,
        gridItem: SVGGraphicsElement 
    ): SVGImageElement | null {
        if (this.diagramContainer === null) {
            console.warn("The diagram container element doesn't exist");
            return null;
        }

        // check if the gridPicPath exists and an image element hasn't been instantiated for this specific path
        // and the element is within view of the viewport
        if (
            gridPicPath === undefined ||
            cachedGridPicPaths.has(gridPicPath) ||

            !boundingRectsAreIntersecting(this.diagramContainer, gridItem)
        )
            return null;
                        
        // universal URL to add SVG elements onto a canvas or SVG
        const SVGURI: string = "http://www.w3.org/2000/svg";
        // create a new svg image element
        const imageGridItem: SVGImageElement = document.createElementNS(SVGURI, "image") as unknown as SVGImageElement;
        // set the corresponding attributes for the image
        imageGridItem.setAttribute("href", gridPicPath);
        const attributes: string[] = ["x", "y", "width", "height"];
        attributes.forEach((attribute: string) => {
            const attributeValue: string | null = gridItem.getAttribute(attribute);
            if (attributeValue !== null)
                imageGridItem.setAttribute(attribute, attributeValue);
        });

        return imageGridItem;
    }

    // handler for dynamically loading and deloading (showing and hiding) already existing image grid items
    private handleExistingHighResMapGridImageLoad(
    ): void {    
        if (
            this.diagramContainer === null || 
            this.mapElements === null || 
            this.mapData === null || 
            this.dynamicElements === null
        ) {
            console.warn(
                "Diagram container doesn't exist, map elements field, map data field, and/or dynamic elements field is not initialized",
                `Diagram Container Status: ${this.diagramContainer}`,
                `Map Elements Field Status: ${this.mapElements}`,
                `Map Data Field Status: ${this.mapData}`,
                `Dynamic Elements Field Status: ${this.dynamicElements}`
            );
            return;
        }

        if (this.currentMapView === MapView.DEFAULT) 
            return;

        let targetGridIDImageMap: Map<string,SVGImageElement> | null = null;
        if (this.currentMapView === MapView.ROAD)
            targetGridIDImageMap = this.dynamicElements.gridItemIDRoadMapImageMap;
        else if (this.currentMapView === MapView.SATELLITE)
            targetGridIDImageMap = this.dynamicElements.gridItemIDSatelliteMapImageMap;
        else 
            return;
            
        // cycle through the grid item placeholders for our map grid
        for (const gridItem of this.mapElements.grid.children) {
            const gridItemAsSVGElement: SVGGraphicsElement = gridItem as SVGGraphicsElement;
            // if zoomed too far out
            if (!this.zoomThresholdMet())
            {
                // set all image grid items for this particular grid item to be hidden
                const imageGridElement: SVGImageElement | undefined = targetGridIDImageMap.get(gridItemAsSVGElement.id);
                if (imageGridElement !== undefined) 
                    imageGridElement.style.display = "none";

                continue;
            }
    
            // if zoomed adequately close and the the grid item is within the viewport
            if (boundingRectsAreIntersecting(this.diagramContainer, gridItemAsSVGElement)) 
            {
                // unhide the image grid items
                const imageGridElement: SVGImageElement | undefined = targetGridIDImageMap.get(gridItemAsSVGElement.id);
                if (imageGridElement !== undefined)
                    imageGridElement.style.display = "block";
            }
            // if not in viewport
            else {
                // hide the target grid image item
                const imageGridElement: SVGImageElement | undefined = targetGridIDImageMap.get(gridItemAsSVGElement.id);
                if (imageGridElement !== undefined)
                    imageGridElement.style.display = "none";
            }
            
        }
    }

    // a boolean that checks if the current zoom is equal to or surpasses the highResImgLoadZoomThreshold var
    private zoomThresholdMet(): boolean {
        if (this.currentPanZoom === null) {
            console.warn("Panzoom instance doesn't exist");
            return false;
        }

        const currentZoom: number = this.currentPanZoom.getTransform().scale;
        return currentZoom >= this.highResImgLoadZoomThreshold;
    }

    // adjusts the opacity of the map by given the percentage
    public adjustMapOpacity(targetPercentage: number): void {
        if (this.mapElements === null) {
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
        this.mapElements.parent.style.opacity = targetPercentage.toString();
    }

    // updates the state of the svg renderer (and sets any events accordingly)
    public setCurrentMapView(view: MapView): void {
        if (this.mapElements === null) {
            console.warn("SVG map elements field is not initialized");
            return;
        }
        
        // set our map view here (do this first because the dynamic image loading methods require the currentMapView to be
        // updated properly first)
        this.currentMapView = view;

        // deal with the state change here
        switch(this.currentMapView) {
            case MapView.DEFAULT:
                this.mapElements.parent.style.display = "none";
                break;
            case MapView.ROAD:
                this.mapElements.parent.style.display = "block";
                this.mapElements.roadMap.style.display = "block";
                this.mapElements.satelliteMap.style.display = "none";
                // also run the dynamic image loading so the images can remain crisp if zoomed in already
                this.handleHighResMapGridImageLoad();
                this.handleExistingHighResMapGridImageLoad();
                break;
            case MapView.SATELLITE:
                this.mapElements.parent.style.display = "block";
                this.mapElements.roadMap.style.display = "none";
                this.mapElements.satelliteMap.style.display = "block";
                // do the same for the satellite view as the road view in terms of dynamic image loading
                this.handleHighResMapGridImageLoad();
                this.handleExistingHighResMapGridImageLoad();
                break;
        }
    }
}
