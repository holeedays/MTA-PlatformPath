import { loadDiagram, highlightNode, showLayer } from "./_highlighter.ts";
import { PathFinder, type PathStep, type StationResponse } from "./path_finder.ts";
declare const panzoom: any;


class App {
    private pathFinder: PathFinder;
    private currentPath: PathStep[] | null = null;
    private currentIndex: number = 0;
    private station: StationResponse | null = null;
    private currentPanZoom: any = null;

    constructor() {
        this.pathFinder = new PathFinder();
    }

    // initializes the app: loads diagram, fetches station data, sets up event listeners
    public async init(stationName: string): Promise<void> {
        // Set the station name in the heading
        const stationHeading = document.getElementById('diagram-name');
        if (stationHeading) {
            stationHeading.innerText = `Station: ${stationName}`;
        }

        // TODO: Dynamically determine diagram path based on stationName
        await this.loadDiagramWithControls("/static/platformpathapp/diagrams/25Av.svg");
        
        // Get the station data (nodes/edges) and populate the dropdowns
        this.station = await this.pathFinder.fetchStation(stationName);

        console.log('Fetched station data:', this.station);

        for (const node of this.station?.node_models || []) {
            document.getElementById('start-node')?.appendChild(
                new Option(node.label, node.id.toString())
            );
            document.getElementById('end-node')?.appendChild(
                new Option(node.label, node.id.toString())
            );

        }

        // Set up event listeners for form submission and navigation buttons
        document.getElementById("find-route")
            ?.addEventListener("click", () => this.handleFormSubmit());
        document.getElementById("btn-prev")
            ?.addEventListener("click", () => this.prevStep());
        document.getElementById("btn-next")
            ?.addEventListener("click", () => this.nextStep());
    }

        // Pan, zoom, and scroll controls for the station diagram
        private setupDiagramControls(): void {
            const svg = document.querySelector('#diagram-container svg') as HTMLElement | null;
            if (!svg) console.log("SVG not found");
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
    
        // Helper method to load the diagram and immediately attach controls
        private async loadDiagramWithControls(diagramPath: string): Promise<void> {
            await loadDiagram(diagramPath);
            this.setupDiagramControls();
        }

    // Reads from the form and delegates to startNavigation
    private async handleFormSubmit(): Promise<void> {
        const fromNodeId = parseInt(
            (document.getElementById('start-node') as HTMLSelectElement).value
        );
        const toNodeId = parseInt(
            (document.getElementById('end-node') as HTMLSelectElement).value
        );

        await this.startNavigation( fromNodeId, toNodeId);
    }

    // Uses the PathFinder to get a path and initializes the UI for navigation
    public async startNavigation(
        fromNodeId: number,
        toNodeId: number,
        accessibleOnly: boolean = false
    ): Promise<void> {
        if (!this.station) {
            console.error('No station data available');
            return;
        }

        // Find the path using the PathFinder
        this.currentPath  = this.pathFinder.findPath(
            this.station,
            fromNodeId,
            toNodeId,
            accessibleOnly
        );
        this.currentIndex = 0;

        // Show the step UI and render the first step
        if (this.currentPath && this.currentPath.length > 0) {
            const stepUI = document.getElementById('step-ui');
            if (stepUI) stepUI.style.display = 'block';
            this.renderCurrentStep();
        } else {
            console.warn('No path found');
        }
    }

    // Renders the current step: updates instructions, highlights nodes/layers, and manages button states
    private renderCurrentStep(): void {
        if (!this.currentPath) return;
        const step = this.currentPath[this.currentIndex];
        if (!step) return;

        const instructionText = document.getElementById('instruction-text');
        if (instructionText) {
            instructionText.innerText =
                `Step ${this.currentIndex + 1} of ${this.currentPath.length}: ${step.instruction}`;
        }

        showLayer(step.layer, this.station?.unique_layers || []);
        highlightNode(step.svgId);

        const btnPrev = document.getElementById('btn-prev') as HTMLButtonElement;
        const btnNext = document.getElementById('btn-next') as HTMLButtonElement;
        if (btnPrev) btnPrev.disabled = (this.currentIndex === 0);
        if (btnNext) btnNext.disabled = (this.currentIndex === this.currentPath.length - 1);
    }

    private nextStep(): void {
        if (this.currentPath && this.currentIndex < this.currentPath.length - 1) {
            this.currentIndex++;
            this.renderCurrentStep();
        }
    }

    private prevStep(): void {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.renderCurrentStep();
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const app = new App();
    void app.init("25 Av");
});