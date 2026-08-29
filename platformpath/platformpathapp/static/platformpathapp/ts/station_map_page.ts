import { SvgRenderer, type SelectionRole } from "./svg_renderer.ts";
import { PathFinder, type PathStep, type AccessibilityOption } from "./path_finder.ts";
import { type LayerData, type NodeData, type StationResponse } from "./station_data.ts";
import { NodeOption, FilterCheckBox, NodeSVG } from "./station_custom_elements.ts";
import { URLHandler } from "./url_handler.ts";
import { DataFetch } from "./data_fetch.ts";

export class StationMapPage {
    public pathFinder: PathFinder;
    public currentPath: PathStep[] | null = null;
    public currentPathNodeIDs: Set<string> = new Set();
    public nodeSVGs: NodeSVG[] = [];
    public selectedNodeOptions: {
        startNode: NodeOption | null, 
        endNode: NodeOption | null
    } = {startNode: null, endNode: null};
    public currentIndex: number = 0;
    public station: StationResponse | null = null;
    public svgRenderer: SvgRenderer;
    public isPreviewingRoute:boolean = false;
    public accessibleOption: AccessibilityOption = "none";

    constructor() {
        this.pathFinder = new PathFinder();
        this.svgRenderer = new SvgRenderer();
    }

    // umbrella function for all init methods (desktop specific and general init methods)
    public async init(): Promise<void> {
        // init base methods
        await this.initBase();
        // init desktop specific methods
        this.initDesktop();
    }

    // initializes methods specifically belonging to the desktop version of the station map page
    public initDesktop(): void {
        // create logic to handle enforcing user page sizing for the desktop version of the page
        this.initDesktopDimensionsEnforcement();
        // init our filter toggle button (will be responsible for revealing all of our filter checkboxes) and is only a 
        // desktop item
        this.initFilterChecklistToggleButton();
    }

    // initializes the page: loads diagram, fetches station data, sets up event listeners
    // this part is reusable (e.g. can be used in the station map mobile page)
    public async initBase(): Promise<void> {

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

        // METHODS THAT DON'T REQUIRE STATION DATA

        // init the site header toggle button (toggles the view of the site header, which could make diagram viewing more annoying in
        // lower resolutions/dimensions)
        this.initSiteHeaderToggleButton();
        // init the map legend
        this.initMapLegend();
        // init the base styling for step ui
        this.initStepUI();
        // init the base styling for the preview ui
        this.initPreview();
        // init the event handling for the element descriptions toggle button
        this.initElementDescriptionsToggleInfoButton();
        // init the event handling for the element descriptions
        this.initElementDescriptions();

        // METHODS THAT REQUIRE STATION DATA

        // init the station heading (name of station) on top of the page
        this.initStationHeading();
        // Load the station diagram
        await this.svgRenderer.loadDiagramWithControls(this.station.station_model.diagram_path);
        // init the route direction labels
        this.svgRenderer.initRouteDirectionLabels();
        // init our layer controls (toggling the different layers of the svg)
        this.initLayerControls();

        console.log('Fetched station data:', this.station);

        // init our find route button, which will handle activating the pathfinding between the start/end nodes
        this.initRouteFindButton();
        // init our override toggle container and its buttons
        this.initOverrideToggles();
        // init all dropdowns with node options and the filter checkbox (e.g. anything involving node data)
        this.initNodes();
        // init our path step buttons
        this.initPathStepButtons();
        // init our route preview controls
        this.initRoutePreviewControls();
        // init our map rotate button
        this.initMapRotateButton();
    }

    // initially enforce desktop dimensions as well as 
    // create an event handler that enforces desktop users to stick to specific website viewing dimensions for the desktop
    private initDesktopDimensionsEnforcement(): void {
        const djangoConfig: HTMLDivElement | null = document.querySelector("#django_config");
        if (djangoConfig === null || djangoConfig.dataset.staticPath === undefined) {
            console.warn("Django config element doesn't exist or 'data-static-path' attribute doesn't exist on it");
            return;
        }

        // this is our threshold number (in pixels)
        const horizontalResizeThreshold: number = 1270;

        // create our element and the base styling of it
        const dimensionEnforcementOverlay: HTMLDivElement = document.createElement("div");
        const enforcementTextBlock: HTMLSpanElement = document.createElement("span");
        const enforcementImageBlock: HTMLImageElement = document.createElement("img");

        // style the parent containr here
        dimensionEnforcementOverlay.classList.add("dimension-enforcement-overlay", "hidden");
        dimensionEnforcementOverlay.addEventListener("transitionend", (ev: TransitionEvent) => {
            if (ev.propertyName === "opacity" && dimensionEnforcementOverlay.classList.contains("hidden")) {
                dimensionEnforcementOverlay.remove();
            }
        });
        // style the text block here
        enforcementTextBlock.innerHTML = `
            <b>Please expand your window.</b> <br><br>
            The page's layout is meant for desktop dimensions, not tablet or mobile.
            To see the mobile view of the station map, please use a tablet or phone. <br><br>
            Thank you for understanding.`
        // style the image block here
        enforcementImageBlock.src = (
            djangoConfig.dataset.staticPath + "platformpathapp/decals/dimension_enforcement_window_expand_icon.svg"
        );
        enforcementImageBlock.alt = "Dimension enforcement window expand icon"

        dimensionEnforcementOverlay.append(enforcementImageBlock, enforcementTextBlock);
        // do our initial check here
        if (window.innerWidth < horizontalResizeThreshold) {
            document.body.prepend(dimensionEnforcementOverlay);
            dimensionEnforcementOverlay.classList.remove("hidden");
        }
        // add our event listener here (CSS queries are a lot more foolproof and efficient than doing a window resize
        // event listener here)
        const mediaQuery: MediaQueryList = window.matchMedia(`(max-width: ${horizontalResizeThreshold}px)`);
        mediaQuery.addEventListener("change", (ev: MediaQueryListEvent) => {
            if (ev.matches) {
                document.body.prepend(dimensionEnforcementOverlay);
                // currently, prepending the overlay and then removing the hidden attribute doesn't trigger the transition
                // so, the best other bet is to force a layout recalculation to cause the transition (or an arbitrary set timeout
                // or request animation frame... though these are finnicky and may cause race conditions)
                dimensionEnforcementOverlay.offsetWidth; 
                dimensionEnforcementOverlay.classList.remove("hidden");
            }
            else {
                dimensionEnforcementOverlay.classList.add("hidden");
            }
        })
    }

    // set the station name in the heading element + add some event handling logic 
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
        
        // add event logic for the station header (just redirects the user back to the stations selection page)
        const currentURL: string = URLHandler.getFullURLRoute();
        const currentURLSplit: string[] = currentURL.split("/");
        let stationsSelectionURL: string = "";
        for (let i = 0; i < currentURLSplit.length - 3; i++) {
            stationsSelectionURL += i === 0? currentURLSplit[i]: "/" + currentURLSplit[i];
        }
        stationHeading.addEventListener("click",  () => URLHandler.redirectTo(stationsSelectionURL));
    }

    // init the layer("levels") buttons 
    private initLayerControls(): void {
        if (!this.station) return;

        const layerOptions = document.getElementById("layer-options");
        const allLayersButton = document.getElementById("show-all-layers") as HTMLButtonElement | null;
        
        if (!layerOptions || !allLayersButton) return;

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

    // set up event listeners for the find route button (form submission after selecting start/end nodes)
    private initRouteFindButton(): void {
        const findRouteButton: HTMLButtonElement | null = document.querySelector("#find-route");
        if (findRouteButton === null) {
            console.warn("Find route button doesn't exist");
            return;
        }
        findRouteButton.addEventListener("click", async () => await this.handleFormSubmit());
    }

    // add styling + event handling for the override toggle container and its override toggle buttons (e.g. like accessibility only 
    // button and avoid accessible nodes) that may exist
    private initOverrideToggles(): void {
        const overrideTogglesParentContainer: HTMLDivElement | null = document.querySelector(".override-toggles");
        const accessibilityOnlyToggleButton: HTMLButtonElement | null | undefined = (
            overrideTogglesParentContainer?.querySelector(".override-toggles__accessibility-only-toggle-button")
        );
        const accessibilityNoneToggleButton: HTMLButtonElement | null | undefined = (
            overrideTogglesParentContainer?.querySelector(".override-toggles__accessibility-none-toggle-button")
        );

        if (
            overrideTogglesParentContainer === null ||
            accessibilityOnlyToggleButton === null ||
            accessibilityOnlyToggleButton === undefined ||
            accessibilityNoneToggleButton === null ||
            accessibilityNoneToggleButton === undefined
        ) {
            console.warn(
                "Override toggles parent container and/or the accessibility only toggle button doesn't exist",
                `Override Toggles Parent Container Status: ${overrideTogglesParentContainer}`,
                `Accessibility Only Toggle Button Status: ${accessibilityOnlyToggleButton}`,
                `Accessibility None Toggle Button Status: ${accessibilityNoneToggleButton}`
            );
            return;
        }

        // also check if the station has data or else all the override toggle buttons would be useless
        if (this.station === null) {
            console.warn("There is no station data, cannot modify override toggles section without the data");
            return;
        }   

        // now checking whether to validate the accessibility only/none toggle buttons
        if (this.station.station_model.accessible_station) {
            let isAccessibleOnly: boolean = false;
            let isAccessibleNone: boolean = false;
            
            // also add a human readable label (just for human legibility, does not have styling significance, 
            // this attribute will exist in the template already)
            accessibilityOnlyToggleButton.setAttribute("aria-selected", "false");
            accessibilityNoneToggleButton.setAttribute("aria-selected", "false");

            accessibilityOnlyToggleButton.addEventListener("click", (ev: MouseEvent) => {
                // if the accessibileNone button is toggled then we want to turn it off
                if (isAccessibleNone) {
                    isAccessibleNone = false;
                    accessibilityNoneToggleButton.classList.remove("enabled");
                    accessibilityNoneToggleButton.setAttribute("aria-selected", "false");
                }
                // set our isAccessibleOnly boolean (this boolean will determine whether the pathfinding algorithm will
                // choose to select accessible nodes)
                this.accessibleOption = isAccessibleOnly ? "none" : "accessible-only";
                isAccessibleOnly = !isAccessibleOnly;

                // this is for visual styling to confirm whether this override is selected
                accessibilityOnlyToggleButton.classList.toggle("enabled", isAccessibleOnly);
                // toggle our readable label
                const ariaSelectedVal: string = isAccessibleOnly.toString();
                accessibilityOnlyToggleButton.setAttribute("aria-selected", ariaSelectedVal);

            });

            accessibilityNoneToggleButton.addEventListener("click", () => {
                // if the accessibileOnly button is toggled then we want to turn it off
                if (isAccessibleOnly) {
                    isAccessibleOnly = false;
                    accessibilityOnlyToggleButton.classList.remove("enabled");
                    accessibilityOnlyToggleButton.setAttribute("aria-selected", "false");
                }
                // set our isAccessibleNone boolean (this boolean will determine whether the pathfinding algorithm will
                // choose to select non-accessible nodes)
                this.accessibleOption = isAccessibleNone ? "none" : "avoid-accessible";
                isAccessibleNone = !isAccessibleNone;

                // this is for visual styling to confirm whether this override is selected
                accessibilityNoneToggleButton.classList.toggle("enabled", isAccessibleNone);
                // toggle our readable label
                const ariaSelectedVal: string = isAccessibleNone.toString();
                accessibilityNoneToggleButton.setAttribute("aria-selected", ariaSelectedVal);
            });
        }
        // if the station is not accessible
        else {
            // remove the override toggles completely
            overrideTogglesParentContainer.remove();
        }
    }

    // NOTE: FOR DESKTOP ONLY 
    // add event handling of the toggle button 
    private initFilterChecklistToggleButton(): void {
        const filterChecklistToggleButton: HTMLButtonElement | null = document.querySelector(".filter-checklist__toggle-button");
        // the checkbox container will receive the styling since it is responsible for the actual css state styling of the 
        // acrual container
        const filterChecklistCheckboxesContainerWrapper: HTMLDivElement | null = (
            document.querySelector(".filter-checklist__checkboxes-container-wrapper")
        );

        if (
            filterChecklistToggleButton === null || 
            filterChecklistCheckboxesContainerWrapper === null
        ) {
            console.warn(
                "Filter checklist toggle button doesn't exist and/or its wrapper doesn't exist", 
                "and/or the filter checklist checkboxes container wrapper does not exist",
                `Filter Checklist Toggle Button Status: ${filterChecklistToggleButton}`,
                `Filter Checklist Checkboxes Container Wrapper Status: ${filterChecklistCheckboxesContainerWrapper}`
            );
            return;
        }

        // though hidden should already be added, make sure the checkboxes container wrapper is already hidden to begin with 
        // NOTE: do note that since there are already transition properties, on page load, you can see the animation of the checklist
        // being hidden, we'll compensate for this with a longer opacity load of the entire page
        filterChecklistCheckboxesContainerWrapper.classList.add("hidden");

        let isPressed: boolean = false;
        let filterChecklistToggleButtonIsTransitioning: boolean = false;
        // toggle event handling of toggle button here (it's all styling for the other elements)
        filterChecklistToggleButton.addEventListener("click", () => {
            if (filterChecklistToggleButtonIsTransitioning)
                return;

                filterChecklistToggleButton.classList.toggle("enabled", !isPressed);
                filterChecklistCheckboxesContainerWrapper.classList.toggle("hidden", isPressed);

            filterChecklistToggleButtonIsTransitioning = true;
            isPressed = !isPressed;
        });

        // add a boolean to prevent the toggle button from transitioning multiple times before its animation is finished
        filterChecklistToggleButton.addEventListener("transitionend", (ev: TransitionEvent) => {
            if (ev.propertyName === "transform") 
                filterChecklistToggleButtonIsTransitioning = false;
        })
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

    // init the buttons on the route preview 
    private initRoutePreviewControls(): void {
        const startButton: HTMLButtonElement | null = document.querySelector("#start-navigation");
        const cancelButton: HTMLButtonElement | null = document.querySelector("#cancel-route-preview");

        if (startButton === null || cancelButton === null) {
            console.warn(
                "Route preview buttons don't exist",
                `Start Navigation Button Status: ${startButton}; Cancel Route Button Status: ${cancelButton}`
            );
            return;
        }

        // Handle start navigation logic
        startButton.addEventListener("click", () => this.beginStepNavigation());
        // Handle cancel route preview logic
        cancelButton.addEventListener("click", () => this.endNavigation());
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

        let isPressed: boolean = false;
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
                !isPressed && 
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
            isPressed = !isPressed;
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
        toNodeId: number
    ): Promise<void> {
        if (!this.station) {
            console.error('No station data available');
            return;
        }

        if (this.currentPath !== null) {
            this.endNavigation();
        }

        // Find the path using the PathFinder
        this.currentPath = this.pathFinder.findPath(
            this.station,
            fromNodeId,
            toNodeId,
            this.accessibleOption
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

            // restore route direction label
            const labelIds = this.getRouteDirectionLabelIds(this.currentPath);
            this.svgRenderer.showRouteDirectionLabels(labelIds);

            // start the route preview
            this.startRoutePreview();
        } else {
            console.warn('No path found');
        }
    }

    // Function that sets up the UI elements for the preview and
    // makes them visible
    private startRoutePreview(): void {
        if (!this.currentPath || this.currentPath.length === 0) {
            console.warn('No path available for preview');
            return;
        }

        // Retrieving all the UI elements for the preview
        const preview: HTMLDivElement | null = document.querySelector("#route-preview");
        const previewDescription: HTMLSpanElement | null = document.querySelector("#route-preview-description");
        const allLayersButton: HTMLButtonElement | null = document.querySelector("#show-all-layers");

        if (preview === null || previewDescription === null || allLayersButton === null) {
            console.warn(
                "Route preview container, preview description, or the all layers button does not exist",
                `Preview Container Status: ${preview}`,
                `Preview Description Status: ${previewDescription}`,
                `All Layers Button Status: ${allLayersButton}`
            );
            return;
        }

        // toggle global boolean that we are previewing the route
        this.isPreviewingRoute = true;
        // Keep the full map visible during preview
        allLayersButton.click();
        // style the preview elements
        const movementCount: number = Math.max(this.currentPath.length, 0);
        previewDescription.innerHTML = `There are <b>${movementCount} step${movementCount === 1 ? "" : "s"}</b> in this route`;
        // preview.style.display = "grid";
        preview.classList.remove("hidden");
        // start our route preview for the svg
        this.svgRenderer.startRoutePreview(
            this.currentPath.map((step: PathStep) => step.svgId)
        );
    }

    // function that starts the step by step navigation of the route
    private beginStepNavigation(): void {
        if (!this.currentPath || this.currentIndex >= this.currentPath.length) {
            console.warn('No valid step to navigate to');
            return;
        }
            // get the relevant ui elements
            const preview: HTMLDivElement | null = document.querySelector("#route-preview");
            const stepUI: HTMLDivElement | null = document.querySelector('#step-ui');
            const instructionText: HTMLElement | null = document.querySelector("#instruction-text");
            const btnPrev: HTMLButtonElement | null = document.querySelector("#btn-prev");    
            const btnNext: HTMLButtonElement | null = document.querySelector("#btn-next");

            if (
                preview === null ||
                stepUI === null ||
                instructionText === null ||
                btnPrev === null ||
                btnNext === null
            ) {
                console.warn(
                    "Preview UI, stepUI parent object, instruction text, previous node button, and/or next node button does not exist",
                    `Preview UI Status: ${preview}`,
                    `StepUI Status: ${stepUI}`,
                    `Instruction Text Status: ${instructionText}`,
                    `Previous Node Button Status: ${btnPrev}`,
                    `Next Node Button Status: ${btnNext}`
                );
                return;
            }

            // remove previewing syling (node highligting + hiding preview)
            this.isPreviewingRoute = false;
            this.svgRenderer.stopRoutePreview();
            preview.classList.add("hidden");

            // make the stepui insvisible
            stepUI.classList.remove("hidden");
            // render the current style
            this.renderCurrentStep(instructionText, btnPrev, btnNext);
    }

    // end the navigation process (the opposite of StartNavigation)
    private endNavigation(): void {
        const stepUI: HTMLDivElement | null = document.querySelector('#step-ui');
        const allLayersButton: HTMLButtonElement | null = document.querySelector("#show-all-layers");
        const preview: HTMLDivElement | null = document.querySelector("#route-preview");

        if (
            stepUI === null ||
            allLayersButton === null ||
            preview === null
        ) {
            console.warn(
                "There is no step ui element, all layers button, and or preview ui",
                `Step UI Status: ${stepUI};`,
                `All Layers Button Status: ${allLayersButton}`,
                `Preview UI Status: ${preview}`
            );
            return;
        }


        // NOTE: we will not clear the selectedNodeOptions because we want the state of those to be saved (for now at least)

        // clear the current path
        this.currentPath = null;
        // clear all path node ids 
        this.currentPathNodeIDs.clear();
        // derender the existing path
        this.derenderPath();
        // end route preview if it is currently enabled
        this.isPreviewingRoute = false;
        this.svgRenderer.stopRoutePreview();
        // unhighlight all the other nodes
        this.svgRenderer.unhighlightNodes();
        // hide route direction labels
        this.svgRenderer.hideRouteDirectionLabels();
        // remove the step ui + preview ui from view
        stepUI.classList.add("hidden");
        preview.classList.add("hidden");
        // click the all layers button to reveal all layers again
        allLayersButton.click();
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

        // prevent more clicks depending on what current index we have on the prev btn and next btn
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
            const startNodeOption: NodeOption | null = this.createNewNodeOption(startNodeDropdown, node, filters);
            const endNodeOption: NodeOption | null = this.createNewNodeOption(endNodeDropdown, node, filters);

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

    // adds new node option based on the given node data to the given dropdown and returns it
    private createNewNodeOption(
        dropdown: HTMLDivElement, 
        node: NodeData,
        filters: Map<string,string>
    ): NodeOption | null {

        // check if the data exists and 
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

        // event listener here deals with the selection of the item (mainly its own styling and some state changes)
        nodeOption.Self.addEventListener("click", () => {
            // check if there is an option already selected (depending on whether this node option is a start or end node option)
            // and if it matches our current nodeOption
            const role: SelectionRole = nodeOption.selectionRole();
            if (role === "start") {
                // if the start node doesn't match this node option, remove the .selected class from it
                if (this.selectedNodeOptions.startNode !== null && this.selectedNodeOptions.startNode !== nodeOption)
                    this.selectedNodeOptions.startNode.Self.classList.remove("selected");
                // and then set the start node option as this one
                this.selectedNodeOptions.startNode = nodeOption;
            }
            // do the same for the end node
            else if (role === "end") {
                if (this.selectedNodeOptions.endNode !== null && this.selectedNodeOptions.endNode !== nodeOption)
                    this.selectedNodeOptions.endNode.Self.classList.remove("selected");

                this.selectedNodeOptions.endNode = nodeOption;
            }
            // add the .selected class to our node option
            nodeOption.Self.classList.add("selected");
            // hide dropdown afterwards
            nodeOption.Parent.hidePopover();
            // and add the selected class to the dropdown's toggle button (for styling purposes)... might change the logic here
            // later since it makes a lot of calls to the document redundantly
            const parentToggleButton: HTMLButtonElement | null = nodeOption.getParentToggleButton();
            if (parentToggleButton === null) {
                console.warn(`There is no toggle button for the dropdown: ${nodeOption.Parent.id}`);
            }
            else {
                parentToggleButton.classList.add("option-selected");
            }
        });
        // event listener here deals with the extraneous effects of the selection (highlighting, current path interruption, etc)
        nodeOption.Self.addEventListener("click", () => {
            // highlight the selected node (it'll be either a start or end node, svg renderer will handle all the logic from here)
            this.svgRenderer.highlightSelectedNode(nodeOption);

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
        const allOptionFilterCheckbox: FilterCheckBox = this.createAllOptionFilterCheckbox(
            filterCheckboxesContainer, 
            nodeOptions, 
            activeFilters
        );

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
        filterCheckBox.ButtonElement.addEventListener("click", () => {
            // clear our active filters list
            activeFilters.clear();
            // clear all the styling for the other enabled checkboxes
            document.querySelectorAll(".filter-checklist__checkbox.enabled").forEach((filterCheckbox: Element) => {
                filterCheckbox.classList.remove("enabled");
            });

            // iterate thru the node options and remove the hidden class if it exists
            nodeOptions.forEach((nodeOption: NodeOption) => {
                nodeOption.Self.classList.remove("hidden");
            });
                
            // also indicate this filter check box has been clicked
            filterCheckBox.Self.classList.add("enabled");
        });
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
            filterCheckbox.ButtonElement.addEventListener("click", () => {
                // if filter is not previously enabled
                if (!activeFilters.has(filterCheckbox.Value)) {
                    // add this to our set of enabled filters
                    activeFilters.add(filterCheckbox.Value);

                    // add the enabled styling to this checkbox
                    filterCheckbox.Self.classList.add("enabled");
                    // and remove the styling on all option filter since it should be disabled if any other filter is enabled
                    allOptionFilterCheckbox.Self.classList.remove("enabled");
                }
                // in the case this filter is disabled
                else {
                    // delete this filter value from enabled filters
                    activeFilters.delete(filterCheckbox.Value);

                    // remove its class attribute
                    filterCheckbox.Self.classList.remove("enabled");
                }

                // now check if any other active filters are enabled
                if (activeFilters.size === 0) {
                    // if not, activate our all option filter checkbox (e.g. enable all node options again)
                    allOptionFilterCheckbox.ButtonElement.click();
                    return;
                }

                // now loop through our node options with the activeFilters readjusted
                nodeOptions.forEach((nodeOption: NodeOption) => {
                    // create a boolean to determine if any filters match 
                    let matchesAFilter: boolean = false;
                    for (const filterValue of activeFilters) {
                        if (nodeOption.Filters.has(filterValue)) {
                            matchesAFilter = true;
                            break;
                        }
                    }
                    // if not just hide it and update all styling relating to that deselection
                    if (!matchesAFilter) {
                        nodeOption.Self.classList.add("hidden");
                        // also remove the option__selected class if it is to be hidden
                        nodeOption.Self.classList.remove("selected");

                        // if navigating is already happening, just ignore the following statements below
                        // (e.g. won't break the current navigation despite the option not existing no more)
                        if (this.currentPath !== null)
                            return;

                        // also remove it from the selected node options (since it won't be seen anymore if it doesn't match a filter)
                        // and remove highlighting and other styling attributes from it
                        const role: SelectionRole = nodeOption.selectionRole();
                        if (
                            role === "start" && 
                            this.selectedNodeOptions.startNode !== null && 
                            this.selectedNodeOptions.startNode === nodeOption 
                        ) {
                            // unhighlight the node
                            this.svgRenderer.unhighlightSelectedNode(role);
                            // remove this class on the dropdown parent's toggle button (mainly just for styling 
                            // (removing this class removes an image indicator that signals an option has been selected on the button))
                            const parentToggleButton: HTMLButtonElement | null = nodeOption.getParentToggleButton();
                            if (parentToggleButton === null) {
                                console.warn(
                                    "There is no toggle button for the dropdown:",
                                    nodeOption.Self.id
                                );
                            }
                            else {
                                parentToggleButton.classList.remove("option-selected");
                            }
                            // set our selected node option for this start node as null
                            this.selectedNodeOptions.startNode = null;
                        }
                        // same logic as for the start node goes for the end node
                        else if (
                            role === "end" && 
                            this.selectedNodeOptions.endNode !== null &&
                            this.selectedNodeOptions.endNode === nodeOption
                        ) {
                            this.svgRenderer.unhighlightSelectedNode(role);
                            const parentToggleButton: HTMLButtonElement | null = nodeOption.getParentToggleButton();
                            if (parentToggleButton === null) {
                                console.warn(
                                    "There is no toggle button for the dropdown:",
                                    this.selectedNodeOptions.endNode.Self.id
                                );
                            }
                            else {
                                parentToggleButton.classList.remove("option-selected");
                            }
                            this.selectedNodeOptions.endNode = null;
                        }
                    }
                    // else remove the hidden class if it exists (since it an option that may be visible)
                    else {
                        nodeOption.Self.classList.remove("hidden");
                    }
                });
            });
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
            this.svgRenderer.highlightSelectedNode(this.selectedNodeOptions.startNode);
        if (this.selectedNodeOptions.endNode !== null)
            this.svgRenderer.highlightSelectedNode(this.selectedNodeOptions.endNode);
        // reinit the route direction labels
        this.svgRenderer.initRouteDirectionLabels();

        // if preview is already in progress
        if (this.isPreviewingRoute) {
            this.startRoutePreview();
            return;
        }

        // if navigation is already in progress
        if (this.currentPath !== null) {
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

    ////////////////////////////////////// PAGE STYLING THAT DOESN'T REQUIRE API DATA

    // inits the event handling for the site header toggle button, toggles classes for a couple elements with the site header 
    // (and map/station header/element descriptions toggle info button) ideally should retract the header so that the diagram can be 
    // completely unobstructed
    private initSiteHeaderToggleButton(): void {
        const siteHeaderContainer: HTMLDivElement | null = document.querySelector(".site-header--station-map");
        const siteHeaderToggleButton: HTMLButtonElement | null | undefined = (
            siteHeaderContainer?.querySelector(".site-header__toggle-button"));
        const stationHeaderContainer: HTMLDivElement | null = document.querySelector(".map-header");
        const elementDescriptionsToggleInfoButton: HTMLButtonElement | null = (
            document.querySelector(".element-descriptions__toggle-info-button")
        );

        if (
            siteHeaderContainer === null ||
            siteHeaderToggleButton === null ||
            siteHeaderToggleButton === undefined ||
            stationHeaderContainer === null ||
            elementDescriptionsToggleInfoButton === null
        ) {
            console.warn(
                "Site header, site header toggle button, station header doesn't exist, and/or element descriptions toggle info button",
                `Site Header Status: ${siteHeaderContainer}`,
                `Site Header Toggle Button Status: ${siteHeaderToggleButton}`,
                `Station Header Status: ${stationHeaderContainer}`,
                `Element Descriptions Toggle Info Button Status: ${elementDescriptionsToggleInfoButton}`
            );
            return;
        }

        // button switch boolean
        let isPressed: boolean = false;
        // boolean to prevent rapid succession of clicking (causing possibly weird race conditions, ruining our event handling system)
        let siteHeaderButtonIsAnimating: boolean = false;

        // toggle event handling here (just style changes currently)
        siteHeaderToggleButton.addEventListener("click", () => {
            if (siteHeaderButtonIsAnimating) 
                return;

            // NOTE: animating is similar to the map rotate button's animating (which is temp and will be removed almost immediately)
            siteHeaderToggleButton.classList.add("animating");
            siteHeaderToggleButton.classList.toggle("enabled", !isPressed);
            siteHeaderContainer.classList.toggle("retracted", !isPressed);
            stationHeaderContainer.classList.toggle("shifted-up", !isPressed);
            elementDescriptionsToggleInfoButton.classList.toggle("shifted-up", !isPressed);

            siteHeaderButtonIsAnimating = true;
            isPressed = !isPressed;
        });

        // also add event listener for animation end for the button
        siteHeaderToggleButton.addEventListener("animationend", (ev: AnimationEvent) => {
            if (ev.animationName === "SiteHeaderButtonAnimation") {
                siteHeaderToggleButton.classList.remove("animating");
                siteHeaderButtonIsAnimating = false;
            }
        });
    }

    // initialize the map legend
    private initMapLegend(): void {
        // init the toggle button here
        this.initMapLegendToggleButton();
    }

    // initialize the event handling logic of the map legend toggle button
    private initMapLegendToggleButton(): void {
        // we need the wrapper over the actual info container since it'll be responsible for most of the css state changes when 
        // class attributes are added
        const mapLegendInfoContainerWrapper: HTMLDivElement | null = document.querySelector(".map-legend__info-container-wrapper");
        const mapLegendToggleButton: HTMLButtonElement | null = document.querySelector(".map-legend__toggle-button");

        if (mapLegendInfoContainerWrapper === null || mapLegendToggleButton === null) {
            console.warn(
                "Map legend info container wrapper and/or the map toggle button doesn't exist",
                `Map Legend Info Container Wrapper Status: ${mapLegendInfoContainerWrapper}`,
                `Map Legend Toggle Button Status: ${mapLegendToggleButton}`
            );
            return;
        }

        let isPressed: boolean = false;
        let toggleButtonIsAnimating: boolean = false;

        // make sure the hidden class is added to the info container wrapper (it should already exist in the html template)
        // this is the same as the filterChecklistCheckboxesContainer
        mapLegendInfoContainerWrapper.classList.add("hidden");

        // add event handler for the toggle button (mainly for styling)
        mapLegendToggleButton.addEventListener("click", () => {
            if (toggleButtonIsAnimating)
                return;

            mapLegendInfoContainerWrapper.classList.toggle("hidden", isPressed);
            // same as the site header toggle button + map rotate button, add a temp animating class 
            mapLegendToggleButton.classList.add("animating");
            mapLegendToggleButton.classList.toggle("enabled", !isPressed);
            
            toggleButtonIsAnimating = true;
            isPressed = !isPressed;
        });

        // event handling to remove the 'animating' class once the animation is done
        mapLegendToggleButton.addEventListener("animationend", (ev: AnimationEvent) => {
            if (ev.animationName === "MapLegendToggleButtonAnimation") {
                mapLegendToggleButton.classList.remove("animating");
                toggleButtonIsAnimating = false;
            }
        });
    }

    // init certain styling for the stepUI (the container to see all the steps from the path found) during page load
    private initStepUI(): void {
        const stepUI: HTMLDivElement | null = document.querySelector("#step-ui");
        if (stepUI === null) {
            console.warn("Step UI doesn't exist");
            return;
        }
        // make sure the stepui has the hidden element (though it should already be set in the template)
        stepUI.classList.add("hidden");
    }

    // init certain styling for the preview (the container that contains buttons to either find a new route or start navigation) 
    // during page load
    private initPreview(): void {
        const preview: HTMLDivElement | null = document.querySelector("#route-preview");
        if (preview === null) {
            console.warn("Preview UI does not exist");
            return;
        }
        // make sure the preview has the hidden element (though it should already be set in the template)
        preview.classList.add("hidden");
    }

    // toggles the event handling for the element descriptions toggle info button (mainly for styling purposes)
    private initElementDescriptionsToggleInfoButton(): void {
        const elementDescriptionsToggleInfoButton: HTMLButtonElement | null = (
            document.querySelector(".element-descriptions__toggle-info-button")
        );
        const elementDescriptions: NodeListOf<HTMLDivElement> = document.querySelectorAll<HTMLDivElement>(".element-description");

        if (elementDescriptionsToggleInfoButton === null || elementDescriptions.length === 0) {
            console.warn(
                "Element descriptions toggle info button does not exist and/or the element description elements",
                `Element Descriptions Toggle Info Button Status: ${elementDescriptionsToggleInfoButton}`,
                `Number Of Element Description Elements: ${elementDescriptions.length}`
            );
            return;
        }

        // though the hidden class should already be added to the template, make sure all the element descriptions are hidden
        elementDescriptions.forEach((elementDescription: HTMLDivElement) => elementDescription.classList.add("hidden"));

        // add the event handler here 
        let isPressed: boolean = false;
        elementDescriptionsToggleInfoButton.addEventListener("click", () => {
            elementDescriptions.forEach((elementDescription: HTMLDivElement) => elementDescription.classList.toggle("hidden", isPressed));
            elementDescriptionsToggleInfoButton.classList.toggle("enabled", !isPressed);

            isPressed = !isPressed;
        });
    }

    // inits some event logic for the element descriptions
    private initElementDescriptions(): void {
        const elementDescriptions: NodeListOf<HTMLDivElement> = document.querySelectorAll<HTMLDivElement>(".element-description");
        // since some of these element descriptions are literally embedded in buttons, it's included as part of the event listners
        // of those buttons (which we don't want); this prevents bubbling from occuring 
        elementDescriptions.forEach((elementDescription: HTMLDivElement) => {
            elementDescription.addEventListener("click", (ev: MouseEvent) => ev.stopPropagation());
        });
    }

}

