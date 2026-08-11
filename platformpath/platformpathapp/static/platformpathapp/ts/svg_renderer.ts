// Contains all functions related to rendering the svg diagrams

import { type LayerData } from "./station_data.ts"
import { NodeSVG } from "./station_custom_elements.ts"
// import panzoom, {type PanZoom} from "panzoom"; // toggle this off when running server since panzoom has a problem with es6 modules

export type SelectionRole = "start" | "end";

export class SvgRenderer {
    // @ts-ignore
    private currentPanZoom: PanZoom | null = null;

    constructor() {}

    private async loadDiagram(svgPath: string): Promise<void> {
        await fetch(svgPath)
            .then(r => r.text())
            .then(svgContent => {
                const container = document.getElementById('diagram-container');
                if (container) {
                    container.innerHTML = svgContent;
                }
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

    // Seperate highlight function to highlight the start and the end of the selected path
    public highlightSelectedNode(nodeSVGID: string, role: SelectionRole): void {
        const highlightClass = role === "start" ? "start-node-highlight" : "end-node-highlight";

        // remove selection class from previous nodes
        document.querySelectorAll(`.${highlightClass}`).forEach((element) => {
            element.classList.remove(highlightClass);   
        })
        
        const node: HTMLElement | null = document.getElementById(nodeSVGID);
        if (!node) {
            console.warn("Node not found:", nodeSVGID);
            return;
        }
        
        node.classList.add(highlightClass);
    }

    // Removes all highlighted nodes, excluding the selected nodes (e.g. start and end nodes)
    public unhighlightNodes(): void {
          document.querySelectorAll(".highlighted").forEach((element) => {
            element.classList.remove("highlighted");   
        })
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

    // Helper method to center the station map
    public centerMap(zoom: number = 0.9): void {
        const container = document.getElementById("diagram-container");
        const svg = container?.querySelector("svg") as SVGSVGElement | null;

        if (!container || !svg || !this.currentPanZoom) {
            console.warn(
                "Diagram container, station svg, and/or this current pan zoom doesn't exist",
                `Diagram Container Status: ${container}`,
                `Station SVG Status: ${svg}`,
                `Current Pan Zoom Instance Status: ${this.currentPanZoom}`
            );
            return;
        }

        // make sure the svg size is consistent with the container size (the external css should already deal with this but this
        // is just for safe measures so that centering is good)
        container.style.width = "100%";
        container.style.height = "100%";
        svg.style.width = "100%";
        svg.style.height = "100%";

        // once we made sure the container and the svg are the same size, we can just check the bounding box for the client rect
        // NOTE: this is how much space the svg occupies on the page; since we set width + height to coincide with the container
        // the svg will assume the same dimensions as the container rather its listed width and height (which would overflow the page)
        const svgRect = svg.getBoundingClientRect();
        // get center of screen and apply zoom
        this.currentPanZoom.zoomAbs(svgRect.width/2, svgRect.height/2, zoom);
    }

    // Pan, zoom, and scroll controls for the station diagram
    public setupDiagramControls(): void {
        const svg = document.querySelector('#diagram-container svg') as HTMLElement | null;
        if (!svg) return;

        // Cleanup the old even listener if we are loading a new station diagram
        if (this.currentPanZoom) {
            this.currentPanZoom.dispose();
        }

        // Apply panzoom to the new SVG
        // @ts-ignore
        this.currentPanZoom = panzoom(svg, { 
            maxZoom: 8,
            minZoom: 0.3,
            smoothScroll: false
        });

    }

    // Method to load the diagram and immediately attach controls
    public async loadDiagramWithControls(diagramPath: string): Promise<void> {
        await this.loadDiagram(diagramPath);
        this.setupDiagramControls();
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

    // Function to hide all stair labels on the svg
    public hideRouteDirectionLabels(): void {
        document
            .querySelectorAll<SVGGraphicsElement>(
                '#diagram-container g[id$="_UP"], #diagram-container g[id$="_DOWN"]'
            )
            .forEach((label) => {
                label.style.display = "none";
            });
    }

    // Function to show a specific stair label on the svg
    public showRouteDirectionLabels(labelIds: Iterable<string>): void {
        this.hideRouteDirectionLabels();

        for (const labelId of labelIds) {
            const label = document.getElementById(labelId) as SVGGraphicsElement | null;

            if (!label) {
                console.warn("Route direction label not found:", labelId);
                continue;
            }

            label.style.display = "inline";
        }
    }
}
