// Contains all functions related to rendering the svg diagrams

declare const panzoom: any;

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

    // Passed a layer id and an array of all unique layers, shows the layer with the given id and hides all other layers
    public showLayer(layerId: string, uniqueLayers: string[]): void {
        uniqueLayers.forEach((id) => {
            const layer = document.getElementById(id);
            if (layer) {
                if (id === layerId) {
                    layer.style.opacity = "1.0"
                } else {
                    layer.style.opacity = "0.0"
                }
            }
        });
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
            maxZoom: 4,
            minZoom: 0.3,
            smoothScroll: false
        });

        // Double click to reset view
        svg.addEventListener('dblclick', () => {
            this.currentPanZoom.moveTo(0, 0);
            this.currentPanZoom.zoomAbs(0, 0, 1);
        });
    }

    // Method to load the diagram and immediately attach controls
    public async loadDiagramWithControls(diagramPath: string): Promise<void> {
        await this.loadDiagram(diagramPath);
        this.setupDiagramControls();
    }

    // Helper function to zoom on on a node based on svgId
    public centerOnNode(svgId: string, zoom: number = 2): void {
        const container = document.getElementById('diagram-container');
        const svg = container?.querySelector('svg') as SVGSVGElement | null;
        const target = svg?.getElementById(svgId) as SVGGraphicsElement | null;

        if (!container || !svg || !target || !this.currentPanZoom) return;

        // Get the bounding box of the target element in SVG coordinate space
        const bbox = target.getBBox();
        const targetCenterX = bbox.x + bbox.width / 2;
        const targetCenterY = bbox.y + bbox.height / 2;

        // Get the SVG's own viewBox scale factor (SVG coords → pixel coords)
        const viewBox = svg.viewBox.baseVal;
        const svgPixelWidth = svg.clientWidth;
        const svgPixelHeight = svg.clientHeight;
        const scaleX = svgPixelWidth / viewBox.width;
        const scaleY = svgPixelHeight / viewBox.height;

        // Convert SVG coords to pixel coords
        const targetPixelX = targetCenterX * scaleX;
        const targetPixelY = targetCenterY * scaleY;

        // Compute the pan offset to center the target in the container
        const containerCenterX = container.clientWidth / 2;
        const containerCenterY = container.clientHeight / 2;

        // Apply zoom first (zooming around the target point), then pan to center
        this.currentPanZoom.zoomAbs(targetPixelX, targetPixelY, zoom);
        this.currentPanZoom.moveTo(
            containerCenterX - targetPixelX * zoom,
            containerCenterY - targetPixelY * zoom
        );
    }
}