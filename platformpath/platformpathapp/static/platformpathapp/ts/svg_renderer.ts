// Contains all functions related to rendering the svg diagrams

import { type LayerData } from "./station_data.ts";
import { NodeSVG } from "./station_custom_elements.ts";
import { NodeOption } from "./station_custom_elements.ts"
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
        if (!this.currentPanZoom) {
            console.warn("Cannot reset map: panzoom is not initialized");
            return;
        }

        // Return to the SVG's normal, full-map transform.
        this.currentPanZoom.zoomAbs(0, 0, .90);
        this.currentPanZoom.moveTo(0, 0);
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
}
