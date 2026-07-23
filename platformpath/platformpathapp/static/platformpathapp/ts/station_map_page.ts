import { SvgRenderer, type SelectionRole } from "./svg_renderer.ts";
import { PathFinder, type PathStep } from "./path_finder.ts";
import { type NodeData, type StationResponse } from "./station_data.ts";
import { URLHandler } from "./url_handler.ts";
import { DataFetch } from "./data_fetch.ts";

export class StationMapPage {
    private pathFinder: PathFinder;
    private currentPath: PathStep[] | null = null;
    private currentIndex: number = 0;
    private station: StationResponse | null = null;
    private svgRenderer: SvgRenderer;

    constructor() {
        this.pathFinder = new PathFinder();
        this.svgRenderer = new SvgRenderer();
    }

    // Updating the highlight for the selected start or end node when the dropdown is changed
    private updateSelectedNodeHighlight(nodeId: number, role: SelectionRole): void {
        const node = this.station?.node_models.find((item) => item.id === nodeId);

        if (!node) {
            console.warn("Selected node not found:", nodeId);
            return;
        }

        this.svgRenderer.highlightSelectedNode(node.svg_id, role);
    }

    // initializes the page: loads diagram, fetches station data, sets up event listeners
    public async init(): Promise<void> {

        // get the id from our url
        const stationID: number | null = URLHandler.getIDFromURL();
        if (stationID === null) {
            console.warn("Cannot find valid station ID from the URL");
            return;
        }
        this.station = await DataFetch.fetchEdgesNodesLayers(stationID) as StationResponse;

        // Load the station information from database (The station's edges and nodes)
        if (!this.station) {
            console.error('Failed to fetch station data');
            return;
        }

        // Set the station name in the heading
        const stationHeading = document.getElementById('diagram-name');
        if (stationHeading) {
            stationHeading.innerText = this.station?.station_model.name;
        }

        // Load the station diagram
        await this.svgRenderer.loadDiagramWithControls(this.station.station_model.diagram_path);
        this.initLayerControls();

        console.log('Fetched station data:', this.station);

        // this inits all dropdowns with node options and the filter checkbox
        this.processNodes();

        // Listeners for the dropdowns to highlight the selected start and end nodes
        // to indicate to users what node they are choosing
        document.getElementById("start-node-dropdown")?.addEventListener("change", (event) => {
            const nodeId = Number((event.target as HTMLSelectElement).value);
            this.updateSelectedNodeHighlight(nodeId, "start");
        });
        document.getElementById("end-node-dropdown")?.addEventListener("change", (event) => {
            const nodeId = Number((event.target as HTMLSelectElement).value);
            this.updateSelectedNodeHighlight(nodeId, "end");
        });

        // Set up event listeners for form submission and navigation buttons
        document.getElementById("find-route")
            ?.addEventListener("click", () => this.handleFormSubmit());
        document.getElementById("btn-prev")
            ?.addEventListener("click", () => this.prevStep());
        document.getElementById("btn-next")
            ?.addEventListener("click", () => this.nextStep());
    }

    private initLayerControls(): void {
        if (!this.station) return;

        const layerOptions = document.getElementById("layer-options");
        const allLayersButton = document.getElementById("show-all-layers") as HTMLButtonElement | null;
        
        if (!layerOptions || !allLayersButton) return;

        layerOptions.innerHTML = "";

        // Setup button to display all layers of the station map and hook control to 
        allLayersButton.addEventListener("click", () => {
            this.svgRenderer.showAllLayers(this.station?.layer_models || []);
            this.setActiveLayerButton(allLayersButton);
        });

        // Create and setup buttons to show individual layers of the map of the station
        for (const layer of this.station.layer_models) {
            const layerButton = this.createLayerButton(layer.name, layer.color);
            layerButton.addEventListener("click", () => {
                this.svgRenderer.showLayer(layer.svg_id, this.station?.layer_models || []);
                this.setActiveLayerButton(layerButton);
            });
            layerOptions.appendChild(layerButton);
        }

        this.svgRenderer.showAllLayers(this.station.layer_models);
    }

    // Creates a button with the specified label and background color
    private createLayerButton(label: string, color: string): HTMLButtonElement {
        const button = document.createElement("button");
        button.type = "button";
        button.classList.add("layer-option");
        button.innerText = label;
        button.style.backgroundColor = color;
        // this is to allow access to the color in the css
        button.style.setProperty("--color", color);
        return button;
    }

    // Helper function to clear active state from previous button and sets active state for current button
    private setActiveLayerButton(activeButton: HTMLButtonElement): void {
        document.querySelectorAll(".layer-option, .all-layers-button").forEach((button) => {
            button.classList.remove("active");
        });
        activeButton.classList.add("active");
    }

    // Function to set the active layer button by its ID
    private setActiveLayerButtonByLayer(layerId: string): void {
        const layerButtons = document.querySelectorAll<HTMLButtonElement>(".layer-option, .all-layers-button");
        for (const button of layerButtons) {
            if (button.innerText === layerId) {
                this.setActiveLayerButton(button);
                return;
            }
        }
    }
    
    // Reads from the form and delegates to startNavigation
    private async handleFormSubmit(): Promise<void> {
        const fromNodeId = parseInt(
            (document.getElementById('start-node-dropdown') as HTMLSelectElement).value
        );
        const toNodeId = parseInt(
            (document.getElementById('end-node-dropdown') as HTMLSelectElement).value
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

        this.svgRenderer.showLayer(step.layer, this.station?.layer_models || []);
        this.setActiveLayerButtonByLayer(step.layer);
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

    // umbrella function to process all elements on the page involving the node data (e.g. route form + filter checkbox)
    private processNodes(): void {
        if (this.station === null) {
            console.warn("The station response object has nothing in it");
            return;
        }

        // retrieve our dropdown elements
        const startNodeDropdown: HTMLSelectElement | null = document.getElementById("start-node-dropdown") as HTMLSelectElement;
        const endNodeDropdown: HTMLSelectElement | null = document.getElementById("end-node-dropdown") as HTMLSelectElement;
        // retrieve our filter checkbox
        const filterCheckBox: HTMLDivElement | null = document.querySelector(".filter-checkbox") as HTMLDivElement;

        if (startNodeDropdown === null || endNodeDropdown === null || filterCheckBox === null) {
            console.warn(
                "Start/End node dropdowns (either one or both) don't exist or filter checkbox doesn't exist",
                `Start Node Dropdown Status: ${startNodeDropdown}`,
                `End Node Dropdown Status: ${endNodeDropdown}`,
                `Filter Checkbox Status: ${filterCheckBox}`
            );
            return;
        }

        const nodeOptions: HTMLOptionElement[] = [];
        const nodeTypesHashMap: Map<string,string> = new Map();

        // initializing dropdown with node options
        this.station.node_models.forEach((node: NodeData) => {
            const startNodeOption: HTMLOptionElement = this.addNewOptionToDropdown(startNodeDropdown, node);
            const endNodeOption: HTMLOptionElement = this.addNewOptionToDropdown(endNodeDropdown, node);

            // add these types into our type dict
            Object.entries(node.types_dict).forEach((dictPair: [string, string]) => {
                // just doing this for readability sake
                const value: string = dictPair[0];
                const readableLabel: string = dictPair[1];

                nodeTypesHashMap.set(value, readableLabel);
            });

            nodeOptions.push(startNodeOption, endNodeOption);
        });

        // ...to be continued
    }

    // adds new option based on the given node data to the given dropdown and returns it
    private addNewOptionToDropdown(dropdown: HTMLSelectElement, node: NodeData): HTMLOptionElement {
        // create the option
        const option = new Option(node.label, node.id.toString());

        const layer = this.station?.layer_models.find(
            (layer) => layer.id === node.layer
        );
        // also calibrate its styling (based on the layer it belongs to)
        if (layer !== undefined) {
            option.style.backgroundColor = layer.color;
            option.style.color = "#111";
        }
        // add it to our dropdown
        dropdown.appendChild(option);

        return option;
    } 

    // init filter buttons 
    private initFilterButtons(): void {

    }
}

