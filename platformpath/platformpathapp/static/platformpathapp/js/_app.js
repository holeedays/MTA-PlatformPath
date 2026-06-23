import { loadDiagram, highlightNode, showLayer } from "./_highlighter.js";
import { PathFinder } from "./path_finder.js";
class App {
    pathFinder;
    currentPath = null;
    currentIndex = 0;
    station = null;
    currentPanZoom = null;
    constructor() {
        this.pathFinder = new PathFinder();
    }
    // initializes the app: loads diagram, fetches station data, sets up event listeners
    async init(stationName) {
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
            document.getElementById('start-node')?.appendChild(new Option(node.label, node.id.toString()));
            document.getElementById('end-node')?.appendChild(new Option(node.label, node.id.toString()));
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
    setupDiagramControls() {
        const svg = document.querySelector('#diagram-container svg');
        if (!svg)
            console.log("SVG not found");
        if (!svg)
            return;
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
    async loadDiagramWithControls(diagramPath) {
        await loadDiagram(diagramPath);
        this.setupDiagramControls();
    }
    // Reads from the form and delegates to startNavigation
    async handleFormSubmit() {
        const fromNodeId = parseInt(document.getElementById('start-node').value);
        const toNodeId = parseInt(document.getElementById('end-node').value);
        await this.startNavigation(fromNodeId, toNodeId);
    }
    // Uses the PathFinder to get a path and initializes the UI for navigation
    async startNavigation(fromNodeId, toNodeId, accessibleOnly = false) {
        if (!this.station) {
            console.error('No station data available');
            return;
        }
        // Find the path using the PathFinder
        this.currentPath = this.pathFinder.findPath(this.station, fromNodeId, toNodeId, accessibleOnly);
        this.currentIndex = 0;
        // Show the step UI and render the first step
        if (this.currentPath && this.currentPath.length > 0) {
            const stepUI = document.getElementById('step-ui');
            if (stepUI)
                stepUI.style.display = 'block';
            this.renderCurrentStep();
        }
        else {
            console.warn('No path found');
        }
    }
    // Renders the current step: updates instructions, highlights nodes/layers, and manages button states
    renderCurrentStep() {
        if (!this.currentPath)
            return;
        const step = this.currentPath[this.currentIndex];
        if (!step)
            return;
        const instructionText = document.getElementById('instruction-text');
        if (instructionText) {
            instructionText.innerText =
                `Step ${this.currentIndex + 1} of ${this.currentPath.length}: ${step.instruction}`;
        }
        showLayer(step.layer, this.station?.unique_layers || []);
        highlightNode(step.svgId);
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');
        if (btnPrev)
            btnPrev.disabled = (this.currentIndex === 0);
        if (btnNext)
            btnNext.disabled = (this.currentIndex === this.currentPath.length - 1);
    }
    nextStep() {
        if (this.currentPath && this.currentIndex < this.currentPath.length - 1) {
            this.currentIndex++;
            this.renderCurrentStep();
        }
    }
    prevStep() {
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
//# sourceMappingURL=_app.js.map