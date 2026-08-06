import { SvgRenderer, type SelectionRole } from "./svg_renderer.ts";
import { PathFinder, type PathStep } from "./path_finder.ts";
import { type LayerData, type NodeData, type StationResponse } from "./station_data.ts";
import { NodeOption, FilterCheckBox } from "./station_custom_elements.ts";
import { URLHandler } from "./url_handler.ts";
import { DataFetch } from "./data_fetch.ts";

export class StationMapPage {
    private pathFinder: PathFinder;
    private currentPath: PathStep[] | null = null;
    private currentPathNodeIDs: Set<string> = new Set();
    private nodeSVGs: HTMLElement[] = [];
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

        await this.startNavigation(fromNodeId, toNodeId);
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
        this.currentPath?.forEach((step: PathStep) => {
            this.currentPathNodeIDs.add(step.svgId);
        });

        // reset our current index for our path so we start at the first step
        this.currentIndex = 0;
        // render the entire path
        this.renderPath();
        // Show the step UI and render the first step
        if (this.currentPath && this.currentPath.length > 0) {
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
                    `Previous Node Button Status: ${btnPrev}`,
                    `Next Node Button Status: ${btnNext}`
                );
                return;
            }
            stepUI.style.display = 'block';

            document.getElementById("btn-prev")
                ?.addEventListener("click", () => this.prevStep(instructionText, btnPrev, btnNext));
            document.getElementById("btn-next")
                ?.addEventListener("click", () => this.nextStep(instructionText, btnPrev, btnNext));

            this.renderCurrentStep(instructionText, btnPrev, btnNext);
        } else {
            console.warn('No path found');
        }
    }

    // renders the entirety of the path 
    // to be fixed...
    private renderPath(): void {
        this.nodeSVGs.forEach((nodeSVG: HTMLElement) => {
            if (!this.currentPathNodeIDs.has(nodeSVG.id)) {
                this.svgRenderer.fillNode(nodeSVG, "#3d3d3d");
            }
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
        this.svgRenderer.centerOnNode(step.svgId);

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

    // umbrella function to process all elements on the page involving the node data (e.g. route form + filter checkbox)
    // as well as the node data itself
    private processNodes(): void {
        if (this.station === null) {
            console.warn("The station response object has nothing in it");
            return;
        }

        // retrieve our dropdown elements
        const startNodeDropdown: HTMLSelectElement | null = document.getElementById("start-node-dropdown") as HTMLSelectElement;
        const endNodeDropdown: HTMLSelectElement | null = document.getElementById("end-node-dropdown") as HTMLSelectElement;
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
            const startNodeOption: NodeOption | null = this.addNewOptionToDropdown(startNodeDropdown, node, filters);
            const endNodeOption: NodeOption | null = this.addNewOptionToDropdown(endNodeDropdown, node, filters);

            if (startNodeOption === null || endNodeOption === null) {
                console.warn(
                    "Start node or end node options might be null",
                    `Start Node Option Status: ${startNodeOption}; End Node Option Status: ${endNodeOption}`
                );
                return;
            }

            // add them to our collection of node options
            nodeOptions.push(startNodeOption, endNodeOption);

            // also collect all our node svg ids and store them
            const nodeSVG: HTMLElement | null = document.querySelector(`[id='${node.svg_id}']`);
            if (nodeSVG === null) {
                console.warn(`There is no nodeSVG group for the node with id ${node.svg_id}`);
                return;
            }
            this.nodeSVGs.push(nodeSVG);
        });

        // also init our checkboxes
        this.initFilterCheckboxes(filterCheckList, nodeTypesHashMap, nodeOptions);
    }

    // adds new option based on the given node data to the given dropdown and returns it
    private addNewOptionToDropdown(
        dropdown: HTMLSelectElement, 
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

        // create the option
        const nodeOption: NodeOption = new NodeOption(
            node.label, 
            node.id.toString(), 
            layer,
            filters
        );

        // add it to our dropdown
        dropdown.appendChild(nodeOption.self);

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

        // create a filter checkbox that reveals all options
        const allOptionFilterCheckbox: FilterCheckBox = this.createAllOptionFilterCheckbox(filterChecklist,nodeOptions);

        // create individual filter checkboxes for the various other node types
        this.createOtherFilterCheckboxes(
            filterChecklist,
            allOptionFilterCheckbox,
            nodeTypesAlphabetized,
            nodeOptions
        );
    }

    // create the all option filter checkbox (reveals the options in the dropdown for all node types)
    private createAllOptionFilterCheckbox(
        filterChecklist: HTMLDivElement, 
        nodeOptions: NodeOption[]
    ): FilterCheckBox {
        // create our filter checkbox
        const filterCheckBox: FilterCheckBox = new FilterCheckBox("All Nodes", "ALL");

        // add the logic of the filter button for the all option filter checkbox
        filterCheckBox.buttonElement.addEventListener("click", () => {
            // clear all the styling for the other checkboxes
            document.querySelectorAll(".filter-checkbox__enabled").forEach((filterCheckbox: Element) => {
                filterCheckbox.classList.remove("filter-checkbox__enabled");
            });

            // iterate thru the node options and remove the hidden class if it exists
            nodeOptions.forEach((nodeOption: NodeOption) => {
                nodeOption.self.classList.remove("node-data__hidden");
            });
                
            // also indicate this filter check box has been clicked
            filterCheckBox.self.classList.add("filter-checkbox__enabled");
        });

        // activate the event listener as default
        filterCheckBox.buttonElement.click();
        // add the checkbox to the checklist parent container
        filterChecklist.append(filterCheckBox.self);

        return filterCheckBox;
    }   

    // create all the other checkboxes (for the different node types)
    private createOtherFilterCheckboxes(
        filterChecklist: HTMLDivElement,
        allOptionFilterCheckbox: FilterCheckBox,
        nodeTypesAlphabetized: {value: string, readableLabel: string}[] = [],
        nodeOptions: NodeOption[]
    ): void {

        // this is a set containing all enabled filters (excluding the all option since it's special)
        const activeFilters: Set<string> = new Set();
        // iterate through our alphabetized node types
        nodeTypesAlphabetized.forEach((type: {value: string, readableLabel: string}) => {
            const filterCheckbox: FilterCheckBox = new FilterCheckBox(type.readableLabel,type.value);

            // on/off switch boolean for the event listener
            let filterEnabled: boolean = false;
            // event listener logic here...
            filterCheckbox.buttonElement.addEventListener("click", () => {
                // if filter is not previously enabled
                if (!filterEnabled) {
                    // add this to our set of enabled filters
                    activeFilters.add(type.value);
    
                    // add the enabled styling to this checkbox
                    filterCheckbox.self.classList.add("filter-checkbox__enabled");
                    // and remove the styling on all option filter since it should be disabled if any other filter is enabled
                    allOptionFilterCheckbox.self.classList.remove("filter-checkbox__enabled");
                }
                // in the case this filter is disabled
                else {
                    // delete this filter value from enabled filters
                    activeFilters.delete(type.value);

                    // remove its class attribute
                    filterCheckbox.self.classList.remove("filter-checkbox__enabled");
                }

                // do the switch boolean statement here (so the active filters check can execute safely 
                // and the state change is consistent)
                filterEnabled = !filterEnabled;

                // now check if any other active filters are enabled
                if (activeFilters.size === 0) {
                    // activate the event listener for this
                    allOptionFilterCheckbox.buttonElement.click();
                    return;
                }

                // now loop through our node options with the activeFilters readjusted
                nodeOptions.forEach((nodeOption: NodeOption) => {
                    let matchesAFilter: boolean = false;
                    for (const filterValue of activeFilters) {
                        if (nodeOption.filters.has(filterValue)) {
                            matchesAFilter = true;
                            break;
                        }
                    }
                    // if not just hide it
                    if (!matchesAFilter) {
                        nodeOption.self.classList.add("node-data__hidden");
                    }
                    // else remove the hidden class if it exists
                    else {
                        nodeOption.self.classList.remove("node-data__hidden");
                    }
                });
            });

            // append the checkbox to the checklist parent
            filterChecklist.append(filterCheckbox.self);
        });
    }
}

