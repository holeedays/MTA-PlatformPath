import { loadDiagram, highlightNode, showLayer } from "./_highlighter.ts";
import { PathFinder, type PathStep } from "./path_finder.ts";

class App {
    private pathFinder: PathFinder;
    private currentPath: PathStep[] | null = null;
    private currentIndex: number = 0;

    constructor() {
        this.pathFinder = new PathFinder();
    }

    public async init(): Promise<void> {
        await loadDiagram("/static/platformpathapp/diagrams/Bay50.svg");

        document.getElementById("find-route")
            ?.addEventListener("click", () => this.handleFormSubmit());
        document.getElementById("btn-prev")
            ?.addEventListener("click", () => this.prevStep());
        document.getElementById("btn-next")
            ?.addEventListener("click", () => this.nextStep());
    }

    // Reads from the form and delegates to startNavigation
    private async handleFormSubmit(): Promise<void> {
        const fromNodeId = parseInt(
            (document.getElementById('start-node') as HTMLSelectElement).value
        );
        const toNodeId = parseInt(
            (document.getElementById('end-node') as HTMLSelectElement).value
        );
        // const stationName = (
        //     document.getElementById('station-name') as HTMLSelectElement
        // ).value;
        // Currently hardcoding station name
        const stationName = "Bay 50 St";

        await this.startNavigation(stationName, fromNodeId, toNodeId);
    }

    // Clean reusable function — takes parameters, no DOM reads
    public async startNavigation(
        stationName: string,
        fromNodeId: number,
        toNodeId: number,
        accessibleOnly: boolean = false
    ): Promise<void> {
        const station = await this.pathFinder.fetchStation(stationName);
        if (!station) {
            console.error('Could not load station:', stationName);
            return;
        }

        this.currentPath  = this.pathFinder.findPath(
            station,
            fromNodeId,
            toNodeId,
            accessibleOnly
        );
        this.currentIndex = 0;

        if (this.currentPath && this.currentPath.length > 0) {
            const stepUI = document.getElementById('step-ui');
            if (stepUI) stepUI.style.display = 'block';
            this.renderCurrentStep();
        } else {
            console.warn('No path found');
        }
    }

    private renderCurrentStep(): void {
        if (!this.currentPath) return;
        const step = this.currentPath[this.currentIndex];
        if (!step) return;

        const instructionText = document.getElementById('instruction-text');
        if (instructionText) {
            instructionText.innerText =
                `Step ${this.currentIndex + 1} of ${this.currentPath.length}: ${step.instruction}`;
        }

        showLayer(step.layer);
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
    void app.init();
});