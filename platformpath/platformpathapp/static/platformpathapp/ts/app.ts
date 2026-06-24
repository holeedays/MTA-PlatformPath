import { SvgRenderer } from "./svg_renderer.ts";
import { PathFinder, type PathStep } from "./path_finder.ts";
import { StationData, type StationResponse } from "./station_data.ts";
import { Slugifier } from "./slugifier.ts"
import { URLHandler } from "./url_handler.ts";

class App {
    private pathFinder: PathFinder;
    private stationData: StationData;
    private currentPath: PathStep[] | null = null;
    private currentIndex: number = 0;
    private station: StationResponse | null = null;
    private svgRenderer: SvgRenderer;

    constructor() {
        this.pathFinder = new PathFinder();
        this.stationData = new StationData();
        this.svgRenderer = new SvgRenderer();
    }

    // initializes the page: loads diagram, fetches station data, sets up event listeners
    public async init(stationID: number): Promise<void> {

        // Load the station information from database (The station's edges and nodes)
        this.station = await this.stationData.fetchStation(stationID);
        if (!this.station) {
            console.error('Failed to fetch station data');
            return;
        }

        // Set the station name in the heading
        const stationHeading = document.getElementById('diagram-name');
        if (stationHeading) {
            stationHeading.innerText = `Station: ${this.station?.station_model.name}`;
        }

        // Load the station diagram
        await this.svgRenderer.loadDiagramWithControls(this.station.station_model.diagram_path);

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

        this.svgRenderer.showLayer(step.layer, this.station?.unique_layers || []);
        this.svgRenderer.highlightNode(step.svgId);
        this.svgRenderer.centerOnNode(step.svgId);

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

    const slugifier: Slugifier = new Slugifier();

    // Get the station id based on the URL
    const currentURL: string = URLHandler.getFullURLRoute();
    const urlSplit: string[] = currentURL.split('/');
    const stationSlug: string | undefined = urlSplit[urlSplit.length - 3]
    
    let stationName: string | null = null;
    let stationID: number | null = null;
    if (stationSlug) {
        stationName = slugifier.deslugify(stationSlug)[0] as string ?? null;
        stationID = slugifier.deslugify(stationSlug)[1] as number ?? null;
    } else {
        console.error("Invalid station slug in URL");
        return
    }

    if (!stationName || !stationID) {
        console.error("Failed to initialize station data");
        return;
    }

    const app = new App();
    app.init(stationID);
});