// Contains all functions related to rendering the svg diagrams

import { type LayerData } from "./station_data.ts";
import { NodeSVG } from "./station_custom_elements.ts";
import { NodeOption } from "./station_custom_elements.ts"
import { getCurrentTransformMatrix, getCentersOffset } from "./ubiq_func.tions.ts";
// import panzoom, {type PanZoom} from "panzoom"; // toggle this off when running server since panzoom has a problem with es6 modules

export type SelectionRole = "start" | "end";

export class SvgRenderer {
    // @ts-ignore
    private currentPanZoom: PanZoom | null = null;
    private diagramContainer: HTMLDivElement | null = null;
    private SVGWrapper: HTMLDivElement | null = null;
    private SVG: SVGSVGElement | null = null;
    private stationSVG: SVGSVGElement | null = null;
    private sensitivity: number;

    constructor(sensitivityDampener: number = 0.5) {
        this.sensitivity = sensitivityDampener;

        // init diagram contaier field
        this.initDiagramContainerField();
        // init our svg wrapper field
        this.initSvgWrapperField();
    }

    // find the diagram container and assigns a reference to it for our diagramContainer field
    private initDiagramContainerField(): void {
        this.diagramContainer = document.querySelector('#diagram-container');
        if (this.diagramContainer === null)
            console.warn("There is no diagram container on the current page");
    }

    // finds the container that will hold our svg contents and assigns it to our SVGWrapper field
    private initSvgWrapperField(): void {
        this.SVGWrapper = document.querySelector('.svg-wrapper');
        if (this.SVGWrapper === null)
            console.warn("There is no svg wrapper element on the current page");
    }

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
        const roadMap: SVGImageElement | null = this.SVG.querySelector("#" + CSS.escape("Road Map"));
        if (roadMap !== null)
            roadMap.style.display = "none";
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
    public centerMap(zoom: number | null = null): void {
        if (this.SVGWrapper === null || this.SVG === null || this.stationSVG === null || !this.currentPanZoom) {
            console.warn(
                "SVG wrapper, the full SVG, station SVG, and/or this current pan zoom doesn't exist",
                `SVG Wrapper Status: ${this.SVGWrapper}`,
                `SVG Status: ${this.SVG}`,
                `Station SVG Status: ${this.stationSVG}`,
                `Current Pan Zoom Instance Status: ${this.currentPanZoom}`
            );
            return;
        }

        const containerWidth: number = this.SVGWrapper.clientWidth;
        const containerHeight: number = this.SVGWrapper.clientHeight;

        const stationSVGBoundingRect: DOMRect = this.stationSVG.getBoundingClientRect();
        // svg width/height represents the half point of the station svg group * 2; equivalent to if the station svg was centered at the 
        // center of the station instead of the center it has right now
        const svgWidth: number = (stationSVGBoundingRect.left + stationSVGBoundingRect.width/2) * 2;
        const svgHeight: number = (stationSVGBoundingRect.top + stationSVGBoundingRect.height/2) * 2;

        if (zoom === null) {
            const zoomReductionMultiplier: number = 0.95;
            if (stationSVGBoundingRect.height > stationSVGBoundingRect.width) 
                zoom = containerHeight/stationSVGBoundingRect.height * zoomReductionMultiplier;
            else
                zoom = containerWidth/stationSVGBoundingRect.width * zoomReductionMultiplier;
        }

        // NOTE: zoomAbs only scales the svg by the given factor (the 3rd param) with the anchor being the first and second
        // it scales the svg size when it was originally set in the viewport (e.g. if it's 1920px by 1080px, zoomAbs would shrink
        // the value to 1920x.9 1080*.9 with the top left still being at (0,0) since we passed the anchor at 0,0). It technically doesn't
        // matter, the svg size still gets scaled the same way 
        // MoveTo actually MOVES the svg back based on its top left corner 
        this.currentPanZoom.zoomAbs(0, 0, zoom);
        this.currentPanZoom.moveTo(
            (containerWidth - svgWidth * zoom) / 2,
            (containerHeight - svgHeight * zoom) / 2
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
            maxZoom: 20,
            minZoom: 0.3,
            smoothScroll: false,
            beforeMouseDown: beforeMouseDownEventHandler,
            beforeWheel: beforeWheelEventHandler
        });
    }

    // Method to load the diagram and immediately attach controls
    public async loadDiagramWithControls(diagramPath: string): Promise<void> {
        await this.loadDiagram(diagramPath);
        this.initSVGStyling();
        this.initRotationControls();
        this.centerMap();
    }

    // Helper function to zoom on on a node based on svgId
    public centerOnNode(svgId: string, zoom: number = 4): void {
        const container = document.getElementById("diagram-container");
        const svg = container?.querySelector("svg") as SVGSVGElement | null;
        const target = svg?.getElementById(svgId) as SVGGraphicsElement | null;

        if (!container || !svg || !target || !this.currentPanZoom) return;

        // Hide the svg during transformation to avoid seeing a flicker
        svg.style.visibility = "hidden";

        this.currentPanZoom.zoomAbs(0, 0, 1);
        this.currentPanZoom.moveTo(0, 0);

        requestAnimationFrame(() => {
            const containerRect = container.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();

            // Calculate the coordinates for the target node
            const targetCenterX = targetRect.left - containerRect.left + targetRect.width / 2;
            const targetCenterY = targetRect.top - containerRect.top + targetRect.height / 2;

            const containerCenterX = containerRect.width / 2;
            const containerCenterY = containerRect.height / 2;

            // Apply the pan and zoom with the calculations above to center the screen on the target node
            this.currentPanZoom?.zoomAbs(0, 0, zoom);
            this.currentPanZoom?.moveTo(
                containerCenterX - targetCenterX * zoom,
                containerCenterY - targetCenterY * zoom
            );

            requestAnimationFrame(() => {
                svg.style.visibility = "";
            });
        });
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
        // reset map
        this.stopRoutePreview();
        this.centerMap();

        const previewDurationSeconds = Math.max(pathNodeIds.length, 1);

        // Sets the style for all nodes on the path
        pathNodeIds.forEach((nodeId, index) => {
            const node = document.getElementById(nodeId);

            if (!node) {
                console.warn("Preview node not found:", nodeId);
                return;
            }

            node.classList.add("route-preview-node");
            node.style.setProperty("--preview-index", index.toString());
            node.style.setProperty("--preview-duration", (previewDurationSeconds.toString() + "s"));
        })
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
            if (this.SVGWrapper ===null || this.diagramContainer === null || this.currentPanZoom === null)
                return;

            // NOTE: this way only works because the SVG is centered horizontally and vertically in the SVGWrapper (see station map CSS)
            // with the transform origin set to the SVG's center;
            // to do it by transform origin of 0,0; the top left corner of the SVG has to align with the SVGWrapper in the (set in the CSS)
            // then the offset has to be calculated between the top/left of the SVGWrapper and the center of the diagram container
            // (e.g. we don't calculate the offsets based on the center in this case)
            const offset: {deltaX: number, deltaY: number} = getCentersOffset(this.diagramContainer, this.SVGWrapper);
            const panzoomTransforms: {x: number, y: number, scale: number} = this.currentPanZoom.getTransform();

            // the pivots/translations is equivalent to the offset de-scaled (e.g. the offset as if SVGWrapper wasn't scaled)
            pivotX = offset.deltaX / panzoomTransforms.scale;
            pivotY = offset.deltaY / panzoomTransforms.scale;

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
            const rotDeg = displacementX * this.sensitivity;
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
}
