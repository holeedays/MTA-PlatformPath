import { SvgRenderer, type SelectionRole } from "./svg_renderer.ts";
import { PathFinder, type PathStep } from "./path_finder.ts";
import { type LayerData, type NodeData, type StationResponse } from "./station_data.ts";
import { NodeOption, FilterCheckBox, NodeSVG } from "./station_custom_elements.ts";
import { URLHandler } from "./url_handler.ts";
import { DataFetch } from "./data_fetch.ts";

export class StationMapPage {
    private pathFinder: PathFinder;
    private currentPath: PathStep[] | null = null;
    private currentPathNodeIDs: Set<string> = new Set();
    private nodeSVGs: NodeSVG[] = [];
    private currentIndex: number = 0;
    private station: StationResponse | null = null;
    private svgRenderer: SvgRenderer;

    private navigationActive: boolean = false;

    constructor() {
        this.pathFinder = new PathFinder();
        this.svgRenderer = new SvgRenderer();
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
        this.svgRenderer.hideRouteDirectionLabels();
        this.initLayerControls();

        console.log('Fetched station data:', this.station);

        // init all dropdowns with node options and the filter checkbox
        this.processNodes();
        // init our path step buttons
        this.initPathStepButtons();
    
        // Set up event listeners for form submission and navigation buttons
        document.getElementById("find-route")
            ?.addEventListener("click", () => this.handleFormSubmit());
    }

    // init the layer("levels") buttons 
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
        const fromNodeId: number = parseInt(
            (document.getElementById('start-node-dropdown') as HTMLDivElement).getAttribute("data-value") ?? ""
        );
        const toNodeId: number = parseInt(
            (document.getElementById('end-node-dropdown') as HTMLDivElement).getAttribute("data-value") ?? ""
        );

        await this.startNavigation(fromNodeId, toNodeId);
    }

    // init the logic for the path step buttons
    private initPathStepButtons(): void {
        const instructionText: HTMLElement | null = document.querySelector("#instruction-text");
        const btnPrev: HTMLButtonElement | null = document.querySelector("#btn-prev") as HTMLButtonElement;    
        const btnNext: HTMLButtonElement | null = document.querySelector("#btn-next") as HTMLButtonElement;

        if (
            instructionText === null ||
            btnPrev === null ||
            btnNext === null
        ) {
            console.warn(
                "Instruction text, previous node button, and/or next node button does not exist",
                `Instruction Text Status: ${instructionText}`,
                `Previous Node Button Status: ${btnPrev}`,
                `Next Node Button Status: ${btnNext}`
            );
            return;
        } 

        btnPrev.addEventListener("click", () => this.prevStep(instructionText, btnPrev, btnNext));
        btnNext.addEventListener("click", () => this.nextStep(instructionText, btnPrev, btnNext))
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
        this.currentPath = this.pathFinder.findPath(
            this.station,
            fromNodeId,
            toNodeId,
            accessibleOnly
        );
        // clear out the previous values from our set
        this.currentPathNodeIDs.clear();
        // add the new values
        this.currentPath?.forEach((step: PathStep) => {
            this.currentPathNodeIDs.add(step.svgId);
        });

        // reset our current index for our path so we start at the first step
        this.currentIndex = 0;
        // Show the step UI and render the first step
        if (this.currentPath && this.currentPath.length > 0) {
            // render the entire path
            this.renderPath();
            // get the relevant ui elements
            const stepUI: HTMLDivElement | null = document.querySelector('#step-ui') as HTMLDivElement;
            const instructionText: HTMLElement | null = document.querySelector("#instruction-text");
            const btnPrev: HTMLButtonElement | null = document.querySelector("#btn-prev") as HTMLButtonElement;    
            const btnNext: HTMLButtonElement | null = document.querySelector("#btn-next") as HTMLButtonElement;

            if (
                stepUI === null ||
                instructionText === null ||
                btnPrev === null ||
                btnNext === null
            ) {
                console.warn(
                    "stepUI parent object, instruction text, previous node button, and/or next node button does not exist",
                    `StepUI Status: ${stepUI}`,
                    `Instruction Text Status: ${instructionText}`,
                    `Previous Node Button Status: ${btnPrev}`,
                    `Next Node Button Status: ${btnNext}`
                );
                return;
            }
            stepUI.style.display = 'block';
            this.navigationActive = true;

            this.renderCurrentStep(instructionText, btnPrev, btnNext);
        } else {
            console.warn('No path found');
        }
    }


    private endNavigation(): void {
        const stepUI: HTMLDivElement | null = document.querySelector('#step-ui') as HTMLDivElement;
        const allLayersButton = document.getElementById("show-all-layers") as HTMLButtonElement | null;

        if (stepUI === null) {
            console.warn("There is no step ui element");
            return;
        }

        this.derenderPath();
        stepUI.style.display = 'none';
        this.currentPathNodeIDs.clear();
        allLayersButton?.click();
    }

    // renders the entirety of the path 
    // to be fixed...
    private renderPath(): void {
        this.nodeSVGs.forEach((nodeSVG: NodeSVG) => {
            if (!this.currentPathNodeIDs.has(nodeSVG.Self.BaseElement.id)) {
                this.svgRenderer.muteNode(nodeSVG);
            }
            else {
                this.svgRenderer.unmuteNode(nodeSVG);
            }
        });
    }

    // derenders the entire path
    private derenderPath(): void {
        this.nodeSVGs.forEach((nodeSVG: NodeSVG) => {
            this.svgRenderer.unmuteNode(nodeSVG);
        });
    }

    // Renders the current step: updates instructions, highlights nodes/layers, and manages button states
    private renderCurrentStep(
        instructionText: HTMLElement, 
        btnPrev: HTMLButtonElement, 
        btnNext: HTMLButtonElement
    ): void {
        if (!this.currentPath) return;
        const step = this.currentPath[this.currentIndex];
        if (!step) {
            console.warn(`${step} is not a valid index of the currentPath`);
            return;
        }

        // update instructions
        instructionText.innerText =
            `Step ${this.currentIndex + 1} of ${this.currentPath.length}: ${step.instruction}`;
        // set the correct layers
        this.svgRenderer.showLayer(step.layer, this.station?.layer_models || []);
        this.setActiveLayerButtonByLayer(step.layer);
        // highlight nodes and center onto them
        this.svgRenderer.highlightNode(step.svgId);
        // this.svgRenderer.centerOnNode(step.svgId);

        btnPrev.disabled = (this.currentIndex === 0);
        btnNext.disabled = (this.currentIndex === this.currentPath.length - 1);
    }

    private nextStep(instructionText: HTMLElement, btnPrev: HTMLButtonElement, btnNext: HTMLButtonElement): void {
        if (this.currentPath && this.currentIndex < this.currentPath.length - 1) {
            this.currentIndex++;
            this.renderCurrentStep(instructionText, btnPrev, btnNext);
        }
    }

    private prevStep(instructionText: HTMLElement, btnPrev: HTMLButtonElement, btnNext: HTMLButtonElement): void {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.renderCurrentStep(instructionText, btnPrev, btnNext);
        }
    }

    // umbrella function to process all elements on the page involving the node data (e.g. route form + filter checkbox + node options logic)
    // as well as the node data itself
    private processNodes(): void {
        if (this.station === null) {
            console.warn("The station response object has nothing in it");
            return;
        }

        // retrieve our dropdown elements
        const startNodeDropdown: HTMLDivElement | null = document.getElementById("start-node-dropdown") as HTMLDivElement;
        const endNodeDropdown: HTMLDivElement | null = document.getElementById("end-node-dropdown") as HTMLDivElement;
        // retrieve our filter checklist
        const filterCheckList: HTMLDivElement | null = document.querySelector(".filter-checklist") as HTMLDivElement;

        if (startNodeDropdown === null || endNodeDropdown === null || filterCheckList === null) {
            console.warn(
                "Start/End node dropdowns (either one or both) don't exist or filter checklist doesn't exist",
                `Start Node Dropdown Status: ${startNodeDropdown}`,
                `End Node Dropdown Status: ${endNodeDropdown}`,
                `Filter Checklist Status: ${filterCheckList}`
            );
            return;
        }

        // init node option container to hold our newly created node options
        const nodeOptions: NodeOption[] = [];
        const nodeTypesHashMap: Map<string,string> = new Map();

        // initializing dropdown with node options
        this.station.node_models.forEach((node: NodeData) => {
            const filters: Map<string,string> = new Map();
            // add these types into our type dict
            Object.entries(node.types_dict).forEach((dictPair: [string, string]) => {
                // just doing this for readability sake
                const value: string = dictPair[0];
                const readableLabel: string = dictPair[1];

                filters.set(value, readableLabel);
                nodeTypesHashMap.set(value, readableLabel);
            });

            // create our node options and add it to our dropdown
            const startNodeOption: NodeOption | null = this.createNewOption(startNodeDropdown, node, filters);
            const endNodeOption: NodeOption | null = this.createNewOption(endNodeDropdown, node, filters);

            if (startNodeOption === null || endNodeOption === null) {
                console.warn(
                    "Start node or end node options might be null",
                    `Start Node Option Status: ${startNodeOption}; End Node Option Status: ${endNodeOption}`
                );
                return;
            }

            // add them to our node options array
            nodeOptions.push(startNodeOption, endNodeOption);

            // also collect all our node svg ids and store them
            const nodeSVGElement: HTMLElement | null = document.querySelector(`[id='${node.svg_id}']`);
            if (nodeSVGElement === null) {
                console.warn(`There is no nodeSVG group for the node with id ${node.svg_id}`);
                return;
            }
            this.nodeSVGs.push(new NodeSVG(nodeSVGElement));
        });

        // also init our checkboxes
        this.initFilterCheckboxes(filterCheckList, nodeTypesHashMap, nodeOptions);
    }

    // adds new option based on the given node data to the given dropdown and returns it
    private createNewOption(
        dropdown: HTMLDivElement, 
        node: NodeData,
        filters: Map<string,string>
    ): NodeOption | null {

        const layer: LayerData | undefined = this.station?.layer_models.find(
            (layer: LayerData) => layer.id === node.layer
        );
        if (layer === undefined) {
            console.warn("There is no layer model that equals to the node layer");
            return null;
        }

        // create the option (which automatically adds the option to the given dropdown container (and inits all logic/styling))
        const nodeOption: NodeOption = new NodeOption(
            dropdown,
            node.label, 
            node.id.toString(), 
            node.svg_id,
            layer,
            filters
        );
        // add additional event listener logic 
        nodeOption.Self.addEventListener("click", () => {
            // determine what this dropdown this selected node option belongs to
            const selectionRole: SelectionRole = nodeOption.Parent.id === "start-node-dropdown"? "start": "end";
            // highlight the selected node (either start or end)
            this.svgRenderer.highlightSelectedNode(nodeOption.SVGID, selectionRole);
            // unhighlight other nodes
            this.svgRenderer.unhighlightNodes();

            // toggle off any navigation if it exists
            if (this.navigationActive) {
                this.endNavigation();
                this.navigationActive = false;
            }
        });

        return nodeOption;
    } 

    // create all various filter checkboxes (for the filtering of our options)
    private initFilterCheckboxes (
        filterChecklist: HTMLDivElement, 
        nodeTypesHashMap: Map<string, string>, 
        nodeOptions: NodeOption[]
    ): void {
        // create a js object that holds all our node types in alphabetical order (by value not the readable label)
        const nodeTypesAlphabetized: {value: string, readableLabel: string}[] = [];

        // sort our node types based on their value names (which are more unified and actually relates similar items together)
        // for ex: values STRS_EXT (label: Exit Stairs) and STRS (label: Stairs) are grouped together 
        nodeTypesHashMap.forEach((readableLabel: string, value: string) => nodeTypesAlphabetized.push({value, readableLabel}));
        nodeTypesAlphabetized.sort((
            pairA: {value: string, readableLabel: string}, 
            pairB: {value: string, readableLabel: string}
        ) => pairA.value.localeCompare(pairB.value));

        // create a set to hold all active filters we have
        const activeFilters: Set<string> = new Set();
        // create a filter checkbox that reveals all options
        const allOptionFilterCheckbox: FilterCheckBox = this.createAllOptionFilterCheckbox(filterChecklist, nodeOptions, activeFilters);

        // create individual filter checkboxes for the various other node types
        this.createOtherFilterCheckboxes(
            filterChecklist,
            allOptionFilterCheckbox,
            nodeTypesAlphabetized,
            nodeOptions,
            activeFilters
        );
    }

    // create the all option filter checkbox (reveals the options in the dropdown for all node types)
    private createAllOptionFilterCheckbox(
        filterChecklist: HTMLDivElement, 
        nodeOptions: NodeOption[],
        activeFilters: Set<string>
    ): FilterCheckBox {
        // create our filter checkbox
        const filterCheckBox: FilterCheckBox = new FilterCheckBox("All Nodes", "ALL", filterChecklist);
        // init the logic for our all filter checkbox
        filterCheckBox.initAllFilterLogic(nodeOptions, activeFilters);
        // activate the event listener as default
        filterCheckBox.ButtonElement.click();

        return filterCheckBox;
    }   

    // create all the other checkboxes (for the different node types)
    private createOtherFilterCheckboxes(
        filterChecklist: HTMLDivElement,
        allOptionFilterCheckbox: FilterCheckBox,
        nodeTypesAlphabetized: {value: string, readableLabel: string}[] = [],
        nodeOptions: NodeOption[],
        activeFilters: Set<string>
    ): void {
        // iterate through our alphabetized node types
        nodeTypesAlphabetized.forEach((type: {value: string, readableLabel: string}) => {
            // create a filter checkbox 
            const filterCheckbox: FilterCheckBox = new FilterCheckBox(type.readableLabel, type.value, filterChecklist);
            // initiate the logic for it
            filterCheckbox.initSpecificFilterLogic(allOptionFilterCheckbox, nodeOptions, activeFilters);
        });
    }
}

