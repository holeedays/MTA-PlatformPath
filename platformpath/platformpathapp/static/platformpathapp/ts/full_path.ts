// Copy of _app.ts with logic that displays movement between stations
import { loadDiagram, highlightNode, showLayer } from "./_highlighter.ts";
import { PathFinder, type PathStep, type StationResponse } from "./path_finder.ts";
import { TripManager, type TripPhase } from "./trip_manager.ts";
declare const panzoom: any;

const DEMO_PHASES: TripPhase[] = [
    {
        type: 'enter',
        stationName: '25 Av',
        diagramPath: '/static/platformpathapp/diagrams/25Av.svg',
        fromNodeId: 15,  // Stairs at NW corner of 25th Av and 86th St
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
    private pathFinder: PathFinder;
    private tripManager!: TripManager;
    private currentPanZoom: any = null;

    constructor() {
        this.pathFinder = new PathFinder();
    }

    // Pan, zoom, and scroll controls for the station diagram
    private setupDiagramControls(): void {
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

    // Helper method to load the diagram and immediately attach controls
    private async loadDiagramWithControls(diagramPath: string): Promise<void> {
        await loadDiagram(diagramPath);
        this.setupDiagramControls();
    }

    // Helper function to zoom on on a node based on svgId
    private centerOnNode(svgId: string, zoom: number = 2): void {
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

    // initializes the app: loads diagram, fetches station data, sets up event listeners
    public async init(): Promise<void> {
        // Currently hardcoded to demo phases, but could be dynamic based on user input or URL params
        this.tripManager = new TripManager(DEMO_PHASES, this.pathFinder);

        // Prefetch all station data for the trip to ensure smooth navigation later
        await this.tripManager.prefetchStations();

        // Load the first phase and its corresponding SVG diagram
        await this.tripManager.loadCurrentPhasePath();
        await this.loadDiagramWithControls(this.tripManager.currentPhase.diagramPath);

        this.renderPhaseBar();
        this.renderCurrentStep();

        // Set up event listeners for navigation buttons
        document.getElementById("btn-prev")?.addEventListener("click", 
            () => this.handlePrev());
        document.getElementById("btn-next")?.addEventListener("click", 
            () => this.handleNext());
        document.getElementById("btn-arrived")?.addEventListener("click",
            () => this.handleBoardTrain());
    }

    private async handleNext(): Promise<void> {
        const result = this.tripManager.nextStep();

        if (result === 'step') {
            this.renderCurrentStep();
        } else if (result === 'end-of-phase') {
            this.showTrainScreen();
        } else if (result === 'end-of-trip') {
            this.showTripComplete();
        }
    }

    // Uses the PathFinder to get a path and initializes the UI for navigation
    private async handlePrev(): Promise<void> {
        const trainScreen = document.getElementById('train-screen');
        const isTrainScreenOpen = trainScreen && !trainScreen.classList.contains('hidden');

        // If train screen is open, pressing prev simply hides it a keeps you on the last step
        if (isTrainScreenOpen) {
            this.hideTrainScreen()
            this.renderCurrentStep();
            return
        }

        const result = await this.tripManager.prevStep()

        if (result === 'phase-changed') {
            await this.loadDiagramWithControls(this.tripManager.currentPhase.diagramPath);
            this.renderPhaseBar();
        }

        this.renderCurrentStep();
    }

    private async handleBoardTrain(): Promise<void> {
        await this.tripManager.advancePhase();
        await this.loadDiagramWithControls(this.tripManager.currentPhase.diagramPath);
        
        this.hideTrainScreen();
        this.renderPhaseBar();
        this.renderCurrentStep();
    }

    // Render the top phase tracking bar
    private renderPhaseBar(): void {
        const container = document.getElementById('phase-bar');
        if (!container) return;

        const labels = this.tripManager.getAllPhaseLabels();
        
        const phaseIndex = (this.tripManager as any).phaseIndex;
        
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
    private renderCurrentStep(): void {
        const step = this.tripManager.currentPath?.[this.tripManager.currentIndex];
        const total = this.tripManager.currentPath?.length ?? 0;

        if (!step) return;

        const instructionText = document.getElementById('instruction-text');
        const stepNum = document.getElementById('step-num');
        const diagramLabel = document.getElementById('diagram-label');

        // Update text panels
        if (instructionText) instructionText.innerText = step.instruction;
        if (stepNum) stepNum.innerText = `Step ${this.tripManager.currentIndex + 1} of ${total}`;
        if (diagramLabel) diagramLabel.innerText = this.tripManager.currentPhase.stationName;

        // Visual updates to the SVG
        const uniqueLayers = this.tripManager.currentStation?.unique_layers || [];
        showLayer(step.layer, uniqueLayers);
        highlightNode(step.svgId);
        this.centerOnNode(step.svgId);

        // Update button states
        const btnPrev = document.getElementById('btn-prev') as HTMLButtonElement;
        const btnNext = document.getElementById('btn-next') as HTMLButtonElement;
        if (btnPrev) btnPrev.disabled = this.tripManager.isFirstStepOfTrip;
        if (btnNext) {
            btnNext.disabled = false;
            // Change text if it's the last step in the current phase
            if (this.tripManager.isLastStep) {
                btnNext.innerText = this.tripManager.isLastPhase ? "Finish Trip ✓" : "Board Train →";
            } else {
                btnNext.innerText = "Next →";
            }
        }

        this.renderProgressSteps();
    }

    // Renders the detailed path list in the side bar
    private renderProgressSteps(): void {
        const container = document.getElementById('progress-steps');
        if (!container) return;

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
    private showTrainScreen(): void {
        const trainScreen = document.getElementById('train-screen');
        if (trainScreen) trainScreen.classList.remove('hidden');
    }

    private hideTrainScreen(): void {
        const trainScreen = document.getElementById('train-screen');
        if (trainScreen) trainScreen.classList.add('hidden');
    }

    private showTripComplete(): void {
        const instructionText = document.getElementById('instruction-text');
        if (instructionText) instructionText.innerText = "You have completed your trip!";
        
        const btnNext = document.getElementById('btn-next') as HTMLButtonElement;
        if (btnNext) btnNext.disabled = true;
    }

}

// Load script on load
document.addEventListener("DOMContentLoaded", () => {
    const app = new App();
    void app.init();
});