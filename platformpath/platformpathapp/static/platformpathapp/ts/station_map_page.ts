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
    private selectedNodeOptions: {
        startNode: NodeOption | null, 
        endNode: NodeOption | null
    } = {startNode: null, endNode: null};
    private currentIndex: number = 0;
    private station: StationResponse | null = null;
    private svgRenderer: SvgRenderer;

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

        // init the site header toggle button (toggles the view of the site header, which could make diagram viewing more annoying in
        // lower resolutions/dimensions)
        this.initSiteHeaderToggleButton();

        // init the station heading (name of station) on top of the page
        this.initStationHeading();
        // Load the station diagram
        await this.svgRenderer.loadDiagramWithControls(this.station.station_model.diagram_path);
        this.svgRenderer.hideRouteDirectionLabels();
        // init our layer controls (toggling the different layers of the svg)
        this.initLayerControls();

        console.log('Fetched station data:', this.station);

        // init our find route button, which will handle activating the pathfinding between the start/end nodes
        this.initRouteFindButton();
        // init our filter toggle button (will be responsible for revealing all of our filter checkboxes)
        this.initFilterChecklistToggleButton();
        // init all dropdowns with node options and the filter checkbox (e.g. anything involving node data)
        this.initNodes();
        // init our path step buttons
        this.initPathStepButtons();
        // init our map rotate button
        this.initMapRotateButton();
    }

    // Set the station name in the heading element 
    private initStationHeading(): void {
        const stationHeading: HTMLDivElement | null = document.querySelector('#diagram-name');
        if (stationHeading === null || this.station === null) {
            console.warn(
                "Station heading is null or the fetched station data is empty",
                `Station Heading Status: ${stationHeading}`,
                `Station Data Status: ${this.station}`
            );
            return;
        }
        stationHeading.innerText = this.station.station_model.name;
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

        // activate the all layers button by default
        allLayersButton.click();
    }

    // Creates a button with the specified label and background color
    private createLayerButton(label: string, color: string): HTMLButtonElement {
        const button = document.createElement("button");
        button.type = "button";
        button.classList.add("layer-option");
        button.innerText = label;
        // this is to allow access to the color in the css
        button.style.setProperty("--bg-color", color);
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
    
    // Reads from the form and delegates to startNavigation (NOTE: id here is not svgID, it's actual databse ID of the node)
    private async handleFormSubmit(): Promise<void> {
        const startNodeID: number | undefined = this.selectedNodeOptions.startNode?.ID;
        const endNodeID: number | undefined = this.selectedNodeOptions.endNode?.ID;

        if (startNodeID === undefined || endNodeID === undefined) {
            console.warn("Invalid start and/or end node ID");
            return;
        }

        await this.startNavigation(startNodeID, endNodeID);
    }

    // Set up event listeners for the find route button (form submission after selecting start/end nodes)
    private initRouteFindButton(): void {
        const findRouteButton: HTMLButtonElement | null = document.querySelector("#find-route");
        if (findRouteButton === null) {
            console.warn("Find route button doesn't exist");
            return;
        }
        findRouteButton.addEventListener("click", () => this.handleFormSubmit());
    }

    // add event handling of the toggle button 
    private initFilterChecklistToggleButton(): void {
        const filterChecklistToggleButton: HTMLButtonElement | null = document.querySelector(".filter-checklist__toggle-button");
        const filterChecklistToggleButtonGraphic: HTMLImageElement | null| undefined = filterChecklistToggleButton?.querySelector("img");
        const filterChecklistCheckboxesContainer: HTMLDivElement | null = document.querySelector(".filter-checklist__checkboxes-container");

        if (
            filterChecklistToggleButton === null || 
            // technically don't need both lines just null check but typescript won't allow just a singular check
            filterChecklistToggleButtonGraphic === null || 
            filterChecklistToggleButtonGraphic === undefined || 
            filterChecklistCheckboxesContainer === null
        ) {
            console.warn(
                "Filter checklist toggle button doesn't exist and/or it's image graphic doesn't exist", 
                "and/or the filter checklist checkboxes container does not exist",
                `Filter Checklist Toggle Button Status: ${filterChecklistToggleButton}`,
                `Toggle Button Image Graphic Status: ${filterChecklistToggleButtonGraphic}`,
                `Filter Checklist Checkboxes Container Status: ${filterChecklistCheckboxesContainer}`
            );
            return;
        }

        // though hidden should already be added, make sure the checkboxes container is already hidden to begin with 
        filterChecklistCheckboxesContainer.classList.add("hidden");

        let pressed: boolean = false;
        // toggle event handling of toggle button here (it's all styling for the other elements)
        filterChecklistToggleButton.addEventListener("click", () => {
            if (!pressed) {
                filterChecklistToggleButtonGraphic.classList.add("reversed");
                filterChecklistCheckboxesContainer.classList.remove("hidden");
            }
            else {
                filterChecklistToggleButtonGraphic.classList.remove("reversed");
                filterChecklistCheckboxesContainer.classList.add("hidden");
            }

            pressed = !pressed;
        });
    }

    // init the logic for the path step buttons
    private initPathStepButtons(): void {
        const instructionText: HTMLElement | null = document.querySelector("#instruction-text");
        const btnPrev: HTMLButtonElement | null = document.querySelector("#btn-prev");    
        const btnNext: HTMLButtonElement | null = document.querySelector("#btn-next");

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

        // add event listening logic for the buttons (e.g. click and moving either back or forth in the path steps)
        btnPrev.addEventListener("click", () => this.prevStep(instructionText, btnPrev, btnNext));
        btnNext.addEventListener("click", () => this.nextStep(instructionText, btnPrev, btnNext))
    }

    // adds event handling of the map rotate button as well as the map SVG (since the map rotate button works in tandem with
    // switching the svg)
    private initMapRotateButton(): void {
        const mapRotateButton: HTMLButtonElement | null = document.querySelector(".map__rotate-button");
        const diagramContainer: HTMLDivElement | null = document.querySelector("#diagram-container");

        if (
            mapRotateButton === null || 
            diagramContainer === null
        ) {
            console.warn(
                "The map rotate button or the diagram container doesn't exist",
                `Map Rotate Button Status: ${mapRotateButton}`,
                `Diagram Container Status: ${diagramContainer}`
            );
            return;
        }

        let pressed: boolean = false;
        // booleans to prevent rapid succession of clicking (causing possibly weird race conditions, ruining our event handling system)
        let diagramContainerIsAnimating: boolean = false;
        let mapRotateButtonIsTransitioning: boolean = false;

        const diagramPath: string | null | undefined = this.station?.station_model.diagram_path;
        const diagramRotatedPath: string | null | undefined = this.station?.station_model.diagram_rotated_path;
        
        mapRotateButton.addEventListener("click", async () => { 
            if (diagramContainerIsAnimating || mapRotateButtonIsTransitioning)
                return;

            // add a TEMPORARY class that functions as a brief animatic for the button (to provide a little more juice to interactivity)
            mapRotateButton.classList.add("animating");
            diagramContainer.classList.add("swapping");

            // if the button hasn't been toggled before and the diagram rotated path exists 
            if (
                !pressed && 
                diagramRotatedPath !== null &&
                diagramRotatedPath !== undefined
            ) {
                await this.svgRenderer.loadDiagramWithControls(diagramRotatedPath);
            }
            else if (
                diagramPath !== null &&
                diagramPath !== undefined
            ) {
                await this.svgRenderer.loadDiagramWithControls(diagramPath);
            }

            this.reinitMap();

            diagramContainerIsAnimating = true;
            mapRotateButtonIsTransitioning = true;
            pressed = !pressed;
        });

        // since the classes are temporary, we want to remove the class for both the button and container 
        // transition end event listener for the map button
        mapRotateButton.addEventListener("transitionend", (ev: TransitionEvent) => {
            if (ev.propertyName === "transform") {
                mapRotateButton.classList.remove("animating");
                mapRotateButtonIsTransitioning = false;
            }
        });
        // animation end event listener (e.g. keyframe animation end event listener) for diagram container 
        // since using a standard transition animation doesn't work very well
        diagramContainer.addEventListener("animationend", (ev: AnimationEvent) => {
            if (ev.animationName === "SVGSwappingAnimation") {
                diagramContainer.classList.remove("swapping");
                diagramContainerIsAnimating = false;
            }
        }); 
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
        // reset our current index for our path so we start at the first step
        this.currentIndex = 0;
        // Show the step UI and render the first step
        if (this.currentPath && this.currentPath.length > 0) {
            // clear out the previous values from our set
            this.currentPathNodeIDs.clear();
            // add the new values
            this.currentPath.forEach((step: PathStep) => {
                this.currentPathNodeIDs.add(step.svgId);
            });

            // render the entire path
            this.renderPath();

            // get label ids
            const labelIds = this.getRouteDirectionLabelIds(this.currentPath);
            // Enables all stair labels for the complete route
            this.svgRenderer.showRouteDirectionLabels(labelIds);

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

            // make the stepui visible now
            stepUI.style.display = 'block';
            // render the current style
            this.renderCurrentStep(instructionText, btnPrev, btnNext);
        } else {
            console.warn('No path found');
        }
    }

    // end the navigation process (the opposite of StartNavigation)
    private endNavigation(): void {
        const stepUI: HTMLDivElement | null = document.querySelector('#step-ui') as HTMLDivElement;
        const allLayersButton = document.getElementById("show-all-layers") as HTMLButtonElement | null;

        if (stepUI === null) {
            console.warn("There is no step ui element");
            return;
        }

        // NOTE: we will not clear the selectedNodeOptions because we want the state of those to be saved (for now at least)

        // clear the current path
        this.currentPath = null;
        // clear all path node ids 
        this.currentPathNodeIDs.clear();
        // derender the existing path
        this.derenderPath();
        // hide route direction labels
        this.svgRenderer.hideRouteDirectionLabels();
        // remove the step ui from view
        stepUI.style.display = 'none';
        // click the all layers button to reveal all layers again
        allLayersButton?.click();
    }

    // renders the entirety of the path 
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
        this.svgRenderer.centerOnNode(step.svgId);

        btnPrev.disabled = (this.currentIndex === 0);
        btnNext.disabled = (this.currentIndex === this.currentPath.length - 1);
    }

    // these 2 functions are just the incrementing of the pathfinding steps
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
    private initNodes(): void {
        if (this.station === null) {
            console.warn("The station response object has nothing in it");
            return;
        }

        // retrieve our dropdown elements
        const startNodeDropdown: HTMLDivElement | null = document.querySelector("#start-node-dropdown");
        const endNodeDropdown: HTMLDivElement | null = document.querySelector("#end-node-dropdown");
        // retrieve our filter check boxes container (the part of the checklist that holds the filters)
        const filterCheckboxesContainer: HTMLDivElement | null = document.querySelector(".filter-checklist__checkboxes-container") as HTMLDivElement;

        if (startNodeDropdown === null || endNodeDropdown === null || filterCheckboxesContainer === null) {
            console.warn(
                "Start/End node dropdowns (either one or both) don't exist or filter checklist's checkboxes container doesn't exist",
                `Start Node Dropdown Status: ${startNodeDropdown}`,
                `End Node Dropdown Status: ${endNodeDropdown}`,
                `Filter Checklist Checkboxes Container Status: ${filterCheckboxesContainer}`
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

            // also collect all our node svg ids and store them in our nodeSVG array
            const nodeSVG: NodeSVG | null = this.initNodeSVG(node);
            if (nodeSVG !== null)
                this.nodeSVGs.push(nodeSVG);
        });

        // also init our checkboxes
        this.initFilterCheckboxes(filterCheckboxesContainer, nodeTypesHashMap, nodeOptions);
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
            node.id,
            node.svg_id,
            layer,
            filters
        );
        // add additional event listener logic 
        nodeOption.Self.addEventListener("click", () => {
            // determine what this dropdown this selected node option belongs to
            let selectionRole: SelectionRole | null = null;
            if (nodeOption.Parent.id === "start-node-dropdown") {
                selectionRole = "start";
                // also store the nodeOption in our selectedNodeOptions (which is crucial for handling path finding) 
                this.selectedNodeOptions.startNode = nodeOption;
            }
            else {
                selectionRole = "end";
                this.selectedNodeOptions.endNode = nodeOption;
            }
            // highlight the selected node (either start or end)
            this.svgRenderer.highlightSelectedNode(nodeOption.SVGID, selectionRole);
            // unhighlight other nodes
            this.svgRenderer.unhighlightNodes();

            // toggle off any navigation if it exists
            if (this.currentPath !== null) {
                this.endNavigation();
                this.currentPath = null;
            }
        });

        return nodeOption;
    } 

    // create all various filter checkboxes (for the filtering of our options)
    private initFilterCheckboxes (
        filterCheckboxesContainer: HTMLDivElement, 
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
        const allOptionFilterCheckbox: FilterCheckBox = this.createAllOptionFilterCheckbox(filterCheckboxesContainer, nodeOptions, activeFilters);

        // create individual filter checkboxes for the various other node types
        this.createOtherFilterCheckboxes(
            filterCheckboxesContainer,
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
        filterCheckboxesContainer: HTMLDivElement,
        allOptionFilterCheckbox: FilterCheckBox,
        nodeTypesAlphabetized: {value: string, readableLabel: string}[] = [],
        nodeOptions: NodeOption[],
        activeFilters: Set<string>
    ): void {
        // iterate through our alphabetized node types
        nodeTypesAlphabetized.forEach((type: {value: string, readableLabel: string}) => {
            // create a filter checkbox 
            const filterCheckbox: FilterCheckBox = new FilterCheckBox(type.readableLabel, type.value, filterCheckboxesContainer);
            // initiate the logic for it
            filterCheckbox.initSpecificFilterLogic(allOptionFilterCheckbox, nodeOptions, this.selectedNodeOptions, activeFilters);
        });
    }

    // (in the case that a new diagram is loaded in) reset the necessary items for the map and navigation to work properly
    private reinitMap(): void {
        if (this.station === null) {
            console.warn("The station response object has nothing in it");
            return;
        }

        // clear the array of current nodeSVGs (since the diagram container is being completely reloaded)
        this.nodeSVGs = [];
        // reinit our nodeSVGs
        this.station.node_models.forEach((node: NodeData) => {
            const nodeSVG: NodeSVG | null = this.initNodeSVG(node);
            if (nodeSVG !== null)
                this.nodeSVGs.push(nodeSVG);
        });

        // highlight the start and end nodes again (if selected)
        if (this.selectedNodeOptions.startNode !== null)
            this.svgRenderer.highlightSelectedNode(this.selectedNodeOptions.startNode.SVGID, "start");
        if (this.selectedNodeOptions.endNode !== null)
            this.svgRenderer.highlightSelectedNode(this.selectedNodeOptions.endNode.SVGID, "end");

        // if navigation is already in progress
        if (this.currentPath !== null) {
            // hide the route direction labels
            this.svgRenderer.hideRouteDirectionLabels();
            // and get back all the direction label ids to display the proper ones
            const labelIDs: Set<string> = this.getRouteDirectionLabelIds(this.currentPath);
            this.svgRenderer.showRouteDirectionLabels(labelIDs);
            // render the path again (currentNodeIDs + currentPath should have all the needed information to continue the 
            // navigation from where we left off)
            this.renderPath();
            // render the current step
            const instructionText: HTMLElement | null = document.querySelector("#instruction-text");
            const btnPrev: HTMLButtonElement | null = document.querySelector("#btn-prev") as HTMLButtonElement;    
            const btnNext: HTMLButtonElement | null = document.querySelector("#btn-next") as HTMLButtonElement;

            if (instructionText === null || btnPrev === null || btnNext === null) {
                console.warn(
                    "Instructions text block, previous step button, and/or next step button doesn't exist",
                    `Instructions Text Status: ${instructionText}`,
                    `Previous Button Status: ${btnPrev}`,
                    `Next Button Status: ${btnNext}`
            );
                return;
            }

            this.renderCurrentStep(instructionText, btnPrev, btnNext);
        }
    }

    // creates a new nodeSVG item given a nodeData obj
    private initNodeSVG(node: NodeData): NodeSVG | null {
        const nodeSVGElement: HTMLElement | null = document.querySelector(`[id='${node.svg_id}']`);
            if (nodeSVGElement === null) {
                console.warn(`There is no nodeSVG group for the node with id ${node.svg_id}`);
                return null;
            }
        return new NodeSVG(nodeSVGElement);
    }

    // Helper function to get the svgId of the correct label for the stairs
    // that are a part of the route that was found
    private getRouteDirectionLabelIds(path: PathStep[]): Set<string> {
        const labelIds = new Set<string>();

        // Loops through each step in the path and generates the svg_id of the stairs
        // label based on the direction of the edge if has a vertical direction
        for (const step of path) {
            // look at the edge of the path and see if it has a vertical direction
            const edge = step.incomingEdge;
            if (!edge || edge.vertical_direction === "NONE") {
                continue;
            }

            // Each edge has two nodes, so each one has to be checked
            // to see if it is a structure that actually has the label
            const endpointIds: number[] = [
                edge.from_node,
                edge.to_node,
            ];
            for (const nodeId of endpointIds) {
                const node: NodeData | undefined = this.station?.node_models.find(
                    (candidate: NodeData) => candidate.id === nodeId
                );

                // "STRS" is the stored value for NodeTypes.STAIRS,
                // "RMP" is the stored value for NodeTypes.RAMP,
                // "ELVTR" is the stored value for NodeTypes.ELEVATOR
                // all of these node types are directionally-based (e.g. they have arrow indicators for which way they go)
                if (
                    node === undefined || 
                    !(
                        "STRS" in node.types_dict ||
                        "RMP" in node.types_dict ||
                        "ELVTR" in node.types_dict
                    )
                ) {
                    continue;
                }

                labelIds.add(
                    `${node.svg_id}_${edge.vertical_direction}`
                );
            }
        }

        return labelIds;
    }

    // inits the event handling for the site header toggle button, toggles classes for a couple elements with the site header 
    // (and map/station header) ideally should retract the header so that the diagram can be completely unobstructed
    private initSiteHeaderToggleButton(): void {
        const siteHeaderContainer: HTMLHeadElement | null = document.querySelector(".site-header");
        const siteHeaderToggleButton: HTMLButtonElement | null | undefined = (
            siteHeaderContainer?.querySelector(".site-header__toggle-button"));
        const stationHeaderContainer: HTMLDivElement | null = document.querySelector(".map-header");

        if (
            siteHeaderContainer === null ||
            siteHeaderToggleButton === null ||
            siteHeaderToggleButton === undefined ||
            stationHeaderContainer === null
        ) {
            console.warn(
                "Site header, site header toggle button, and/or station header doesn't exist",
                `Site Header Status: ${siteHeaderContainer}`,
                `Site Header Toggle Button Status: ${siteHeaderToggleButton}`,
                `Station Header Status: ${stationHeaderContainer}`
            );
            return;
        }

        // button switch boolean
        let pressed: boolean = false;
        // boolean to prevent rapid succession of clicking (causing possibly weird race conditions, ruining our event handling system)
        let siteHeaderButtonIsAnimating: boolean = false;

        // toggle event handling here (just style changes currently)
        siteHeaderToggleButton.addEventListener("click", () => {
            if (siteHeaderButtonIsAnimating) 
                return;

            if (!pressed) {
                // NOTE: animating is similar to the map rotate button's animating (which is temp and will be removed almost immediately)
                siteHeaderToggleButton.classList.add("reversed", "animating");
                siteHeaderContainer.classList.add("retracted");
                stationHeaderContainer.classList.add("shifted-up");
            }
            else {
                siteHeaderToggleButton.classList.add("animating");
                siteHeaderToggleButton.classList.remove("reversed");
                siteHeaderContainer.classList.remove("retracted");
                stationHeaderContainer.classList.remove("shifted-up");
            }

            siteHeaderButtonIsAnimating = true;
            pressed = !pressed;
        });

        // also add event listener for animation end for the button
        siteHeaderToggleButton.addEventListener("animationend", (ev: AnimationEvent) => {
            if (ev.animationName === "SiteHeaderButtonAnimation") {
                siteHeaderToggleButton.classList.remove("animating");
                siteHeaderButtonIsAnimating = false;
            }
        });
    }

}

