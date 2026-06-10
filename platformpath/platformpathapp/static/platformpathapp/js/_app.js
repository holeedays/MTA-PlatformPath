import { loadDiagram, highlightNode, showLayer } from "./_highlighter.js";
import { PathFinder } from "./path_finder.js";
class App {
    pathFinder;
    currentPath = null;
    currentIndex = 0;
    station = null;
    constructor() {
        this.pathFinder = new PathFinder();
    }
    // initializes the app: loads diagram, fetches station data, sets up event listeners
    async init(stationName) {
        await loadDiagram("/static/platformpathapp/diagrams/Bay50.svg");
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
    // Reads from the form and delegates to startNavigation
    async handleFormSubmit() {
        const fromNodeId = parseInt(document.getElementById('start-node').value);
        const toNodeId = parseInt(document.getElementById('end-node').value);
        await this.startNavigation(fromNodeId, toNodeId);
    }
    // Clean reusable function — takes parameters, no DOM reads
    async startNavigation(fromNodeId, toNodeId, accessibleOnly = false) {
        if (!this.station) {
            console.error('No station data available');
            return;
        }
        this.currentPath = this.pathFinder.findPath(this.station, fromNodeId, toNodeId, accessibleOnly);
        this.currentIndex = 0;
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
        showLayer(step.layer);
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
    void app.init("Bay 50 St");
});
//# sourceMappingURL=_app.js.map