// Contains all functions related to rendering the svg diagrams

import { type LayerData } from "./station_data.ts"

declare const panzoom: any;

export type SelectionRole = "start" | "end";

export class SvgRenderer {
    private currentPanZoom: any = null;

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

    // Highlight function used to highlight the node at each step of the directions
    public highlightNode(nodeId: string): void {
        document.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });

        const el = document.getElementById(nodeId);
        if (el) {
            el.classList.add('highlighted');
        } else {
            console.warn('Node not found:', nodeId);
        }
    }

    // Seperate highlight function to highlight the start and the end of the selected path
    public highlightSelectedNode(nodeId: string, role: SelectionRole): void {
        const highlightClass = role === "start" ? "start-node-highlight" : "end-node-highlight";

        // remove selection class from previous nodes
        document.querySelectorAll(`.${highlightClass}`).forEach((element) => {
            element.classList.remove(highlightClass);   
        })
        
        const node = document.getElementById(nodeId);
        if (!node) {
            console.warn("Node not found:", nodeId);
            return;
        }
        
        node.classList.add(highlightClass);
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
    public centerMap(zoom: number = 1): void {
        const container = document.getElementById("diagram-container");
        const svg = container?.querySelector("svg") as SVGSVGElement | null;

        if (!container || !svg || !this.currentPanZoom) return;

        const containerRect = container.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        const x = (containerRect.width - svgRect.width * zoom) / 2;
        const y = (containerRect.height - svgRect.height * zoom) / 2;

        this.currentPanZoom.zoomAbs(0, 0, zoom);
        this.currentPanZoom.moveTo(x, y);
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
            this.currentPanZoom.zoomAbs(0, 0, zoom);
            this.currentPanZoom.moveTo(
                containerCenterX - targetCenterX * zoom,
                containerCenterY - targetCenterY * zoom
            );

            requestAnimationFrame(() => {
                svg.style.visibility = "";
            });
        });
    }
}
