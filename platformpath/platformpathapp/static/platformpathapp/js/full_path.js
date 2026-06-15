// Copy of _app.ts with logic that displays movement between stations
import { loadDiagram, highlightNode, showLayer } from "./_highlighter.js";
import { PathFinder } from "./path_finder.js";
import { TripManager } from "./trip_manager.js";
const DEMO_PHASES = [
    {
        type: 'enter',
        stationName: '25 Av',
        diagramPath: '/static/platformpathapp/diagrams/25Av.svg',
        fromNodeId: 15, // Stairs at NW corner of 25th Av and 86th St
        toNodeId: 21, // Downtown Platform
        label: 'Enter at 25 Av'
    },
    {
        type: 'exit',
        stationName: 'Bay 50 St',
        diagramPath: '/static/platformpathapp/diagrams/Bay50.svg',
        fromNodeId: 10, // Downtown Platform
        toNodeId: 1, // Stairs at Harway Av entrance
        label: 'Exit at Bay 50 St'
    }
];
class App {
    pathFinder;
    tripManager;
    constructor() {
        this.pathFinder = new PathFinder();
    }
    // initializes the app: loads diagram, fetches station data, sets up event listeners
    async init() {
        // Currently hardcoded to demo phases, but could be dynamic based on user input or URL params
        this.tripManager = new TripManager(DEMO_PHASES, this.pathFinder);
        // Prefetch all station data for the trip to ensure smooth navigation later
        await this.tripManager.prefetchStations();
        // Load the first phase and its corresponding SVG diagram
        await this.tripManager.loadCurrentPhasePath();
        await loadDiagram(this.tripManager.currentPhase.diagramPath);
        this.renderPhaseBar();
        this.renderCurrentStep();
        // Set up event listeners for navigation buttons
        document.getElementById("btn-prev")?.addEventListener("click", () => this.handlePrev());
        document.getElementById("btn-next")?.addEventListener("click", () => this.handleNext());
        document.getElementById("btn-arrived")?.addEventListener("click", () => this.handleBoardTrain());
    }
    async handleNext() {
        const result = this.tripManager.nextStep();
        if (result === 'step') {
            this.renderCurrentStep();
        }
        else if (result === 'end-of-phase') {
            this.showTrainScreen();
        }
        else if (result === 'end-of-trip') {
            this.showTripComplete();
        }
    }
    // Uses the PathFinder to get a path and initializes the UI for navigation
    async handlePrev() {
        const trainScreen = document.getElementById('train-screen');
        const isTrainScreenOpen = trainScreen && !trainScreen.classList.contains('hidden');
        // If train screen is open, pressing prev simply hides it a keeps you on the last step
        if (isTrainScreenOpen) {
            this.hideTrainScreen();
            this.renderCurrentStep();
            return;
        }
        const result = await this.tripManager.prevStep();
        if (result === 'phase-changed') {
            await loadDiagram(this.tripManager.currentPhase.diagramPath);
            this.renderPhaseBar();
        }
        this.renderCurrentStep();
    }
    async handleBoardTrain() {
        await this.tripManager.advancePhase();
        await loadDiagram(this.tripManager.currentPhase.diagramPath);
        this.hideTrainScreen();
        this.renderPhaseBar();
        this.renderCurrentStep();
    }
    // Render the top phase tracking bar
    renderPhaseBar() {
        const container = document.getElementById('phase-bar');
        if (!container)
            return;
        const labels = this.tripManager.getAllPhaseLabels();
        const phaseIndex = this.tripManager.phaseIndex;
        container.innerHTML = labels.map((phase, i) => {
            const state = i < phaseIndex ? 'done' : i === phaseIndex ? 'active' : '';
            return `
                <div class="phase ${state}" id="phase-${i}">
                    <div class="phase-dot"></div>
                    <span>${phase.label}</span>
                </div>
            `;
        }).join('');
    }
    // Updates instruction, diagram highlights, and nav buttons
    renderCurrentStep() {
        const step = this.tripManager.currentPath?.[this.tripManager.currentIndex];
        const total = this.tripManager.currentPath?.length ?? 0;
        if (!step)
            return;
        const instructionText = document.getElementById('instruction-text');
        const stepNum = document.getElementById('step-num');
        const diagramLabel = document.getElementById('diagram-label');
        // Update text panels
        if (instructionText)
            instructionText.innerText = step.instruction;
        if (stepNum)
            stepNum.innerText = `Step ${this.tripManager.currentIndex + 1} of ${total}`;
        if (diagramLabel)
            diagramLabel.innerText = this.tripManager.currentPhase.stationName;
        // Visual updates to the SVG
        const uniqueLayers = this.tripManager.currentStation?.unique_layers || [];
        showLayer(step.layer, uniqueLayers);
        highlightNode(step.svgId);
        // Update button states
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');
        if (btnPrev)
            btnPrev.disabled = this.tripManager.isFirstStepOfTrip;
        if (btnNext) {
            btnNext.disabled = false;
            // Change text if it's the last step in the current phase
            if (this.tripManager.isLastStep) {
                btnNext.innerText = this.tripManager.isLastPhase ? "Finish Trip ✓" : "Board Train →";
            }
            else {
                btnNext.innerText = "Next →";
            }
        }
        this.renderProgressSteps();
    }
    // Renders the detailed path list in the side bar
    renderProgressSteps() {
        const container = document.getElementById('progress-steps');
        if (!container)
            return;
        const path = this.tripManager.currentPath ?? [];
        const current = this.tripManager.currentIndex;
        container.innerHTML = path.map((step, i) => `
            <div class="p-step ${i < current ? 'done' : i === current ? 'active' : ''}">
                <div class="p-dot"></div>
                <span>${step.instruction}</span>
            </div>
        `).join('');
    }
    // UI State Toggles
    showTrainScreen() {
        const trainScreen = document.getElementById('train-screen');
        if (trainScreen)
            trainScreen.classList.remove('hidden');
    }
    hideTrainScreen() {
        const trainScreen = document.getElementById('train-screen');
        if (trainScreen)
            trainScreen.classList.add('hidden');
    }
    showTripComplete() {
        const instructionText = document.getElementById('instruction-text');
        if (instructionText)
            instructionText.innerText = "You have completed your trip!";
        const btnNext = document.getElementById('btn-next');
        if (btnNext)
            btnNext.disabled = true;
    }
}
// Load script on load
document.addEventListener("DOMContentLoaded", () => {
    const app = new App();
    void app.init();
});
//# sourceMappingURL=full_path.js.map