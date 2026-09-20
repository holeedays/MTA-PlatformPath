// Contains all functions related to rendering the svg diagrams

import { type LayerData } from "./station_data.ts";
import { NodeSVG } from "./station_custom_elements.ts";
import { NodeOption } from "./station_custom_elements.ts"
// import panzoom, {type PanZoom} from "panzoom"; // toggle this off when running server since panzoom has a problem with es6 modules

export type SelectionRole = "start" | "end";

export class SvgRenderer {
    // @ts-ignore
    private currentPanZoom: PanZoom | null = null;
    private SVGWrapper: HTMLDivElement | null = null;
    private stationSVG: SVGSVGElement | null = null;
    private sensitivity: number;

    constructor(sensitivityDampener: number = 0.5) {
        this.sensitivity = sensitivityDampener;

        // init our svg wrapper field
        this.initSvgWrapperField();
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
        // save the svg
        this.stationSVG = this.SVGWrapper.querySelector("svg");
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
    public centerMap(zoom: number = 0.9): void {
        if (this.SVGWrapper === null || this.stationSVG === null || !this.currentPanZoom) {
            console.warn(
                "SVG wrapper, station svg, and/or this current pan zoom doesn't exist",
                `SVG Wrapper Status: ${this.SVGWrapper}`,
                `Station SVG Status: ${this.stationSVG}`,
                `Current Pan Zoom Instance Status: ${this.currentPanZoom}`
            );
            return;
        }

        const containerWidth: number = this.SVGWrapper.clientWidth;
        const containerHeight: number = this.SVGWrapper.clientHeight;

        // clientWidth/clientHeight are unaffected by panzoom's CSS transform.
        const svgWidth: number = this.stationSVG.clientWidth;
        const svgHeight: number = this.stationSVG.clientHeight;

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
            maxZoom: 8,
            minZoom: 0.3,
            smoothScroll: false,
            beforeMouseDown: beforeMouseDownEventHandler,
            beforeWheel: beforeWheelEventHandler
        });
    }

    // Method to load the diagram and immediately attach controls
    public async loadDiagramWithControls(diagramPath: string): Promise<void> {
        await this.loadDiagram(diagramPath);
        this.initRotationControls();
        this.centerMap()
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
    public initRotationControls(): void {

        if (this.SVGWrapper === null || this.stationSVG === null) {
            console.warn("SVG wrapper and/or station svg doesn't exist");
            return;
        }

        // init our booleans and numbers to store and check the state of our rotation logic
        let ctrlKeyPressed: boolean = false;
        let mouseIsDown: boolean = false;
        let currentRot: number = 0;
        let rot: number = 0;
        let startPosX: number = 0;

        // first set the origin point for our rotations; by default, SVGs are set to 0,0
        // we need the center of the diagram container/screen hence we set it by the svg wrapper (which occupies the full width/height of
        // the screen)
        const svgWrapperContainerRect: DOMRect = this.SVGWrapper.getBoundingClientRect();
        this.stationSVG.style.setProperty("--center-x", `${svgWrapperContainerRect.width/2}`);
        this.stationSVG.style.setProperty("--center-y", `${svgWrapperContainerRect.height/2}`);

        // we're going to follow google's rotation method where you must hit control before allowing the user to rotate the map on pc
        window.addEventListener("keydown", (ev: KeyboardEvent) => {
            ctrlKeyPressed = ev.ctrlKey;
        });
        window.addEventListener("keyup", (ev: KeyboardEvent) => {
            ctrlKeyPressed = false;
        });

        // add the drag logic for the svg rotation
        this.SVGWrapper.addEventListener("mousedown", (ev: MouseEvent) => {
            // set our reference point onclick and signify the mouse is down
            startPosX = ev.x;
            mouseIsDown = true;
        });
        this.SVGWrapper.addEventListener("mouseup", (ev: MouseEvent) => {
            currentRot += rot;
            rot = 0;
            mouseIsDown = false;
        });
        this.SVGWrapper.addEventListener("mousemove", (ev: MouseEvent) => {
            if (!ctrlKeyPressed || !mouseIsDown)
                return;
            
            // get our displacement from our initial mouse point and the new point
            const displacementX: number = startPosX - ev.x;
            // our rotation will be equivalent to the displacement scaled by the sensitivity we want
            rot = displacementX * this.sensitivity;
            // set the property responsible for rotating our svg
            this.stationSVG?.style.setProperty("--degree-of-rotation", `${currentRot + rot}deg`);
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
