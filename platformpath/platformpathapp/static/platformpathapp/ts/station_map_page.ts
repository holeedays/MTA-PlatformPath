import { SvgRenderer, MapView, type SelectionRole } from "./svg_renderer.ts";
import { PathFinder, type PathStep, type AccessibilityOption } from "./path_finder.ts";
import { type LayerData, type NodeData, type StationResponse } from "./station_data.ts";
import { 
    NodeOption, FilterCheckBox, NodeSVG, SVGComponentElement, type StationMapInteractionHandler, NodeDropdownButton 
} from "./station_custom_elements.ts";
import { URLHandler } from "./url_handler.ts";
import { DataFetch } from "./data_fetch.ts";
import { Vector2 } from "./transformations.ts";

export class StationMapPage {
    protected pathFinder: PathFinder;
    protected currentPath: PathStep[] | null = null;
    protected currentPathNodeIDs: Set<string> = new Set();

    protected navigationElements: {
        routePreview: {
            self: HTMLDivElement,
            startNavBtn: HTMLButtonElement,
            endNavBtn: HTMLButtonElement,
            previewDescription: HTMLDivElement
        },
        stepUI: {
            self: HTMLDivElement,
            btnPrev: HTMLButtonElement,
            btnNext: HTMLButtonElement,
            toggleOffBtn: HTMLButtonElement,
            instructionText: HTMLDivElement
        }
    } | null = null;
    protected layerElements: {
        layerOptions: HTMLDivElement,
        allLayersButton: HTMLButtonElement
    } | null = null;

    protected nodeSVGs: NodeSVG[] = [];
    protected filterCheckboxes: {
        all: FilterCheckBox, 
        other: FilterCheckBox[]
    } | null = null;
    protected activeFilters: Set<string> = new Set();

    protected nodeDropdownButtons: {
        startNode: NodeDropdownButton,
        endNode: NodeDropdownButton
    } | null = null;
    protected selectedNodeOptions: {
        startNode: NodeOption | null, 
        endNode: NodeOption | null
    } = {startNode: null, endNode: null};
    protected currentIndex: number = 0;
    protected station: StationResponse | null = null;
    protected svgRenderer: SvgRenderer;
    protected isPreviewingRoute:boolean = false;
    protected accessibleOption: AccessibilityOption = "none";

    protected stationMapInteractionHandlers: StationMapInteractionHandler[] = [];


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

        /////////////// METHODS THAT DON'T REQUIRE STATION DATA

        ///// field initializers 

        // init the navigation elements field
        this.initNavigationElementsField();
        // init the layer elements field
        this.initLayerElementsField();

        ///// element Initializers

        // inits the site header and all related elements to it
        this.initSiteHeaderRelatedElements();
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

        /////////////// METHODS THAT REQUIRE STATION DATA

        // init the station heading (name of station) on top of the page
        this.initStationHeading();
        // load the station diagram
        await this.svgRenderer.loadDiagramWithControls(
            this.station.station_model.diagram_path, 
            this.station.station_model.road_map_high_res_grid_pic_paths,
            this.station.station_model.satellite_map_high_res_grid_pic_paths
        );
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
        // init our step UI controls
        this.initStepUIControls();
        // init our route preview controls
        this.initRoutePreviewControls();
        // init the event handling for the node dropdown buttons
        this.initNodeDropdownButtons();
        // init the event handling for our map views block
        this.initMapViews();

        // init all our "click" and "touch"-like event listeners
        this.initInteractionHandlers();
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

        // create out interaction handler
        const stationHeadingInteractionHandler: StationMapInteractionHandler = {
            element: stationHeading,
            handler: () => URLHandler.redirectTo(stationsSelectionURL)
        };
        // then push it
        this.stationMapInteractionHandlers.push(stationHeadingInteractionHandler);
    }

    // init the layer("levels") buttons 
    private initLayerControls(): void {
        if (this.station === null || this.layerElements === null) {
            console.warn(
                "Station data and/or layer elements field is not initialized",
                `Station Data Status: ${this.station}`,
                `Layer Elements Field Status: ${this.layerElements}`
            );
            return;
        }

        // destructure layerElements to make the properties calls slightly more legible 
        const {layerOptions, allLayersButton} = this.layerElements;
        
        // Setup button to display all layers of the station map and hook control to 
        const allLayersHandler: () => void = () => {
            this.svgRenderer.showAllLayers(this.station?.layer_models || []);
            this.setActiveLayerButton(allLayersButton);
        };
        const allLayersBtnInteractionHandler: StationMapInteractionHandler = {
            element: allLayersButton,
            handler: allLayersHandler
        };
        this.stationMapInteractionHandlers.push(allLayersBtnInteractionHandler);

        // Create and setup buttons to show individual layers of the map of the station
        for (const layer of this.station.layer_models) {
            const layerButton: HTMLButtonElement = this.createLayerButton(layer.name, layer.color);

            // add the event logic here
            const layersBtnHandler: () => void = () => {
                this.svgRenderer.showLayer(layer.svg_id, this.station?.layer_models || []);
                this.setActiveLayerButton(layerButton);
            };
            const layersBtnInteractionHandler: StationMapInteractionHandler = {
                element: layerButton,
                handler: layersBtnHandler
            };
            this.stationMapInteractionHandlers.push(layersBtnInteractionHandler);

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
        if (this.selectedNodeOptions.startNode === null || this.selectedNodeOptions.endNode === null) {
            console.warn("No start and/or end node is selected");
            return;
        }

        const startNodeID: number | undefined = this.selectedNodeOptions.startNode.ID;
        const endNodeID: number | undefined = this.selectedNodeOptions.endNode.ID;

        await this.startNavigation(startNodeID, endNodeID);
    }

    // set up event listeners for the find route button (form submission after selecting start/end nodes)
    private initRouteFindButton(): void {
        const findRouteButton: HTMLButtonElement | null = document.querySelector("#find-route");
        if (findRouteButton === null) {
            console.warn("Find route button doesn't exist");
            return;
        }

        // init our find route button event logic here
        const findRouteBtnInteractionHandler: StationMapInteractionHandler = {
            element: findRouteButton,
            handler: async () => await this.handleFormSubmit()        
        }
        this.stationMapInteractionHandlers.push(findRouteBtnInteractionHandler);
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

            // handle accessible only toggle button logic here 
            const accessibilityOnlyBtnHandler: () => void = () => {
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
            };
            // handle accessible none toggle button logic here
            const accessibilityNoneBtnHandler: () => void = () => {
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
            };

            const accessibilityOnlyBtnInteractionHandler: StationMapInteractionHandler = { 
                element: accessibilityOnlyToggleButton, 
                handler: accessibilityOnlyBtnHandler
            };
            const acessibilityNoneBtnInteractionHandler: StationMapInteractionHandler = { 
                element: accessibilityNoneToggleButton, 
                handler: accessibilityNoneBtnHandler
            };

            this.stationMapInteractionHandlers.push(
                accessibilityOnlyBtnInteractionHandler, 
                acessibilityNoneBtnInteractionHandler
            );
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
        // ... since this doesn't exist in the mobile version, we will handle this event logic explicitly here
        // rather than our initInteractionHandlers() method
        filterChecklistToggleButton.addEventListener("click", () => {
            if (filterChecklistToggleButtonIsTransitioning)
                return;

                filterChecklistToggleButton.classList.toggle("enabled", !isPressed);
                filterChecklistCheckboxesContainerWrapper.classList.toggle("hidden", isPressed);
                filterChecklistToggleButton.setAttribute("aria-expanded", (!isPressed).toString());
                filterChecklistToggleButton.setAttribute(
                    "aria-label",
                    isPressed ? "Show station feature filters" : "Hide station feature filters"
                );

            filterChecklistToggleButtonIsTransitioning = true;
            isPressed = !isPressed;
        });

        // add a boolean to prevent the toggle button from transitioning multiple times before its animation is finished
        filterChecklistToggleButton.addEventListener("transitionend", (ev: TransitionEvent) => {
            if (ev.propertyName === "transform") 
                filterChecklistToggleButtonIsTransitioning = false;
        })
    }

    // init the logic for the stepUI
    private initStepUIControls(): void {
        if (this.navigationElements === null) {
            console.warn("Navigation elements field is not initialized");
            return;
        }

        // destructure the stepUI from the navigation elements field (destructuring here is just for legibility purposes, dont have to
        // access the nested property with multiple dot operators)
        const {stepUI} = this.navigationElements;

        // add event listening logic for the buttons

        // event logic for the path step buttons (e.g. moving back and forth between steps)
        const btnPrevInteractionHandler: StationMapInteractionHandler = { 
            element: stepUI.btnPrev, 
            handler: () => this.prevStep(stepUI.instructionText, stepUI.btnPrev, stepUI.btnNext)
        };
        const btnNextInteractionHandler: StationMapInteractionHandler = { 
            element: stepUI.btnNext, 
            handler: () => this.nextStep(stepUI.instructionText, stepUI.btnPrev, stepUI.btnNext)
        };

        // event logic for the toggle off button 
        const toggleOffButtonHandler: () => void = () => {
            // end navigation
            this.endNavigation();
            // and hide the stepUI
            stepUI.self.classList.add("hidden");
        }

        const toggleOffBtnInteractionHandler: StationMapInteractionHandler = {
            element: stepUI.toggleOffBtn,
            handler: toggleOffButtonHandler
        };

        this.stationMapInteractionHandlers.push(
            btnPrevInteractionHandler, 
            btnNextInteractionHandler,
            toggleOffBtnInteractionHandler
        );
    }

    // init the buttons on the route preview 
    private initRoutePreviewControls(): void {
        if (this.navigationElements === null) {
            console.warn("Navigation elements field is not initialized");
            return;
        }

        // destructure to get a more legible names of the start/end nav button 
        const {startNavBtn, endNavBtn} = this.navigationElements.routePreview;

        // Handle start navigation logic
        const startNavBtnInteractionHandler: StationMapInteractionHandler = { 
            element: startNavBtn, 
            // do remember that we need an arrow function to run functions that have "this" keyword
            // whether that be creating a separate handler obj (e.g. const handler = () => func()) and setting it to the
            // the handler property or creating the arrow function in the handler property (e.g. handler: () => func()) as seen
            // below
            handler: () => this.beginStepNavigation()
        };
        // Handle cancel route preview logic
        const endNavBtnInteractionHandler: StationMapInteractionHandler = { 
            element: endNavBtn, 
            handler: () => this.endNavigation()
        };

        this.stationMapInteractionHandlers.push(
            startNavBtnInteractionHandler, 
            endNavBtnInteractionHandler
        );
    }

    // inits the event handling logic for the node dropdown buttons (toggling their respective dropdowns)
    public initNodeDropdownButtons(): void {
        if (this.nodeDropdownButtons === null) {
            console.warn("There are no node dropdown buttons instantiated");
            return;
        }

        // create an array from our node dropdowns so the code is less redundant
        const nodeDropdownButtonsArray: NodeDropdownButton[] = Object.values(this.nodeDropdownButtons);

        // this essentially hides/shows all node dropdown button (IsToggled is a setter that alters isToggled and toggles the 
        // visibility of the associated dropdown)
        nodeDropdownButtonsArray.forEach((nodeDropdownButton: NodeDropdownButton) => {
            nodeDropdownButton.Self.addEventListener("click", () => {
                nodeDropdownButton.IsToggled = !nodeDropdownButton.IsToggled;
            });
        });
    }

    // uses the PathFinder to get a path and initializes the UI for navigation
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
        // handle our navigation (if there was a path found)
        if (this.currentPath && this.currentPath.length > 0) {
            this.handleSuccessfulNavigation();
        } else {
            console.warn('No path found');
        }
    }

    // this function handle a successful navigation
    public handleSuccessfulNavigation(): void {
        if (this.currentPath === null)
            return;

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
    }


    // Function that sets up the UI elements for the preview and makes them visible
    private startRoutePreview(): void {
        if (!this.currentPath || this.currentPath.length === 0) {
            console.warn('No path available for preview');
            return;
        }

        if (this.navigationElements === null || this.layerElements === null) {
            console.warn(
                "Navigation elements and/or layer elements field are not initialized",
                `Navigation Elements Field Status: ${this.navigationElements}`,
                `Layer Elements Field Status: ${this.layerElements}`
            );
            return;
        }

        // destructure the corresponding properties from layer elements/navigation elements
        const {allLayersButton} = this.layerElements;
        const {routePreview} = this.navigationElements;

        // toggle global boolean that we are previewing the route
        this.isPreviewingRoute = true;
        // Keep the full map visible during preview
        allLayersButton.click();
        // style the preview elements
        const movementCount: number = Math.max(this.currentPath.length, 0);
        routePreview.previewDescription.innerHTML = `There are <b>${movementCount} step${movementCount === 1 ? "" : "s"}</b> in this route`;
        routePreview.self.classList.remove("hidden");
        // start our route preview for the svg
        this.svgRenderer.startRoutePreview(
            this.currentPath.map((step: PathStep) => step.svgId)
        );
    }

    // function that starts the step by step navigation of the route
    public beginStepNavigation(): void {
        if (this.currentPath === null || this.currentIndex >= this.currentPath.length) {
            console.warn('No valid step to navigate to');
            return;
        }

        if (this.navigationElements === null) {
            console.warn("Navigation elements field is not initialized");
            return;
        }

        const {routePreview, stepUI} = this.navigationElements;

        // remove previewing syling (node highligting + hiding preview)
        this.isPreviewingRoute = false;
        this.svgRenderer.stopRoutePreview();
        routePreview.self.classList.add("hidden");

        // make the stepui insvisible
        stepUI.self.classList.remove("hidden");
        // render the current style
        this.renderCurrentStep(stepUI.instructionText, stepUI.btnPrev, stepUI.btnNext);
    }

    // end the navigation process (the opposite of StartNavigation)
    public endNavigation(): void {
        if (this.navigationElements === null || this.layerElements === null) {
            console.warn(
                "Navigation elements and/or layer elements field is not initialized",
                `Navigation Elements Field Status: ${this.navigationElements}`,
                `Layer Elements Field Status: ${this.layerElements}`
            );
            return;
        }

        // NOTE: we will not clear the selectedNodeOptions because we want the state of those to be saved (for now at least)

        // destructure the required fields 
        const {stepUI, routePreview} = this.navigationElements;
        const {allLayersButton} = this.layerElements;

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
        stepUI.self.classList.add("hidden");
        routePreview.self.classList.add("hidden");
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
        const startNodeDropdownButtonElement: HTMLButtonElement | null = (
            document.querySelector('.route-form__button[data-target="start-node-dropdown"]')
        );
        const endNodeDropdownButtonElement: HTMLButtonElement | null = (
            document.querySelector('.route-form__button[data-target="end-node-dropdown"]')
        );

        // retrieve our filter check boxes container (the part of the checklist that holds the filters)
        const filterCheckboxesContainer: HTMLDivElement | null = (
            document.querySelector(".filter-checklist__checkboxes-container") as HTMLDivElement
        );

        if (
            startNodeDropdown === null || 
            endNodeDropdown === null || 
            startNodeDropdownButtonElement === null ||
            endNodeDropdownButtonElement === null ||
            filterCheckboxesContainer === null
        ) {
            console.warn(
                "Start/End node dropdowns (either one or both) or their buttons don't exist,",
                "and/or filter checklist's checkboxes container doesn't exist",
                `Start Node Dropdown Status: ${startNodeDropdown}`,
                `End Node Dropdown Status: ${endNodeDropdown}`,
                `Start Node Dropdown Button Status: ${startNodeDropdownButtonElement}`,
                `End Node Dropdown Button Status: ${endNodeDropdownButtonElement}`,
                `Filter Checklist Checkboxes Container Status: ${filterCheckboxesContainer}`
            );
            return;
        }

        // init node option container to hold our newly created node options
        const nodeOptions: NodeOption[] = [];
        const nodeTypesHashMap: Map<string,string> = new Map();

        // init our node dropdown buttons
        const startNodeDropdownButton: NodeDropdownButton = new NodeDropdownButton(startNodeDropdownButtonElement, startNodeDropdown);
        const endNodeDropdownButton: NodeDropdownButton = new NodeDropdownButton(endNodeDropdownButtonElement, endNodeDropdown);
        // push them into our array of dropdown buttons
        this.nodeDropdownButtons = { startNode: startNodeDropdownButton, endNode: endNodeDropdownButton };

        // initializing dropdown with node options
        this.station.node_models.forEach((node: NodeData) => {
            const filters: Map<string,string> = new Map();
            // add these types into our type dict
            Object.entries(node.types_dict).forEach((dictPair: [string, string]) => {
                // just doing this for readability sake
                // the key is the actual value of the type/filter
                const value: string = dictPair[0];
                // the value is the readable label that will be presented to the user
                const readableLabel: string = dictPair[1];

                filters.set(value, readableLabel);
                nodeTypesHashMap.set(value, readableLabel);
            });

            // now create the nodeSVGs
            const nodeSVG: NodeSVG | null = this.initNodeSVG(node);
            if (nodeSVG === null) {
                console.warn(`Could not create a nodeSVG object for this node: ${node}`);
                return;
            }
            // and push it into our array of node SVGs
            this.nodeSVGs.push(nodeSVG);

            // create our node options and add it to our dropdown
            const startNodeOption: NodeOption | null = this.createNewNodeOption(
                startNodeDropdownButton, node, nodeSVG, filters
            );
            const endNodeOption: NodeOption | null = this.createNewNodeOption(
                endNodeDropdownButton, node, nodeSVG, filters
            );

            if (startNodeOption === null || endNodeOption === null) {
                console.warn(
                    "Start node or end node options might be null",
                    `Start Node Option Status: ${startNodeOption}; End Node Option Status: ${endNodeOption}`
                );
                return;
            }

            // add them to our node options array
            nodeOptions.push(startNodeOption, endNodeOption);
        });

        // also init our checkboxes
        this.initFilterCheckboxes(filterCheckboxesContainer, nodeTypesHashMap, nodeOptions);
        // init node SVG logic here
        this.initNodeSVGLogic(nodeOptions);
    }

    // adds new node option based on the given node data to the given dropdown and returns it
    private createNewNodeOption(
        dropdownButton: NodeDropdownButton,
        node: NodeData,
        nodeSVG: NodeSVG,
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
            dropdownButton.LinkedDropdown,
            dropdownButton.Self,
            node.label, 
            node.id,
            node.svg_id,
            nodeSVG,
            layer,
            filters
        );
        // add the nodeoption to our dropdown button 
        dropdownButton.NodeOptions.push(nodeOption);

        // init our event handling logic here...
        const nodeOptionHandler: () => void = () => {
            // this block deals with the selection of the item (mainly its own styling and some state changes)
            {
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
                // mark the dropdown button as not toggled (this will hide the dropdown parent from view))
                dropdownButton.IsToggled = false;
                // and add the selected class to the dropdown's toggle button as well (for styling purposes)...
                dropdownButton.Self.classList.add("option-selected");
            }

            // this code block deals with the extraneous effects of the selection (highlighting, current path interruption, etc)
            {
                // highlight the selected node (it'll be either a start or end node, svg renderer will handle all the logic from here)
                this.svgRenderer.highlightSelectedNode(nodeOption);

                // toggle off any navigation if it exists
                if (this.currentPath !== null) {
                    this.endNavigation();
                    this.currentPath = null;
                }
            }
        };
        // store our event handler here (we'll init the click logic in a dedicated function for all station map handlers)
        const nodeOptionInteractionHandler: StationMapInteractionHandler = { 
            element: nodeOption.Self, 
            handler: nodeOptionHandler 
        };
        this.stationMapInteractionHandlers.push(nodeOptionInteractionHandler);

        return nodeOption;
    } 

    // inits event logic related to the Node SVG
    private initNodeSVGLogic(nodeOptions: NodeOption[]): void {
        if (this.svgRenderer.stationSVG === null || this.filterCheckboxes === null) {
            console.warn(
                "Station SVG and/or the filter checkboxes field has not been initialized",
                `Station SVG Status: ${this.svgRenderer.SVG}`,
                `Filter Checkboxes Field Status: ${this.filterCheckboxes}`
            );
            return;
        }
        // using pointer logic here because it is the same for both platforms 

        // create a hashmap mapping each child of the nodeSVG (as well as itself) to itself 
        // by the way the reason this works is because each nodeSVG and its children are **unique to each other**
        // no nodeSVGs share ANY children
        const nodeSVGMap: Map<SVGGraphicsElement,NodeSVG> = new Map();
        this.nodeSVGs.forEach((nodeSVG: NodeSVG) => {
            // initialize the components map
            // set the components mapping here
            nodeSVG.AllComponents.forEach((component: SVGComponentElement) => {
                nodeSVGMap.set(component.BaseElement, nodeSVG);
            });
            // set the nodeSVG to itself here
            nodeSVGMap.set(nodeSVG.Self.BaseElement, nodeSVG);
        });

        // create a map mapping each nodeSVG to its respective start/end nodeOption
        const nodeOptionsMap: Map<NodeSVG,{startOption: NodeOption | null, endOption: NodeOption | null}> = new Map();
        nodeOptions.forEach((nodeOption: NodeOption) => {
            let nodeOptionsObj: {
                startOption: NodeOption | null, endOption: NodeOption | null
            } | undefined = nodeOptionsMap.get(nodeOption.NODESVG);

            // if the obj doesn't exist, initialize it
            if (nodeOptionsObj === undefined)
                nodeOptionsObj = {startOption: null, endOption: null};

            // configure the node option to their respective role
            if (nodeOption.selectionRole() === "start")
                nodeOptionsObj.startOption = nodeOption;
            else
                nodeOptionsObj.endOption = nodeOption;

            // now update the map   
            // technically it isn't needed if the object has already been initialized before (because we have a reference to
            // it but this is for consistency and readability)
            nodeOptionsMap.set(nodeOption.NODESVG, nodeOptionsObj);
        });

        // create boolean to indicate whether a gesture was a press/touch vs a drag motion
        let isDragging: boolean = false;
        // and a boolean to indicate mouse was pressed or finger touched down
        let isPressed: boolean = false;
        // set a vector to hold the starting position of a pointerdown event
        let startPos: Vector2 = new Vector2(0,0);
        // 10 px should be more than enough to determine whether a pointer event is a press versus a panning/dragging gesture
        const dragDeltaThrehold: number = 10; 
        // create an object that holds the selected nodeSVG (the one we click) and the one we're currently hovering over
        // selected and hovering can be the same or different... this is to help us apply different highlighted styling classes
        // during hover events and click/touch events
        const targetNodeSVG: {selected: NodeSVG | null, hovering: NodeSVG | null} = {selected: null, hovering: null};

        // also get the mobile route form and some of its children cause we need to configure some styling logic for it when pressing down
        // on a NodeSVG
        // this is done in tandem with initializing the mobile route forms element's base event/styling logic
        const mobileRouteFormElements: {
            mobileRouteForm: HTMLDivElement, nodeDisplayDescription: HTMLDivElement
        } | null = this.initMobileRouteForm(targetNodeSVG, nodeOptionsMap);
        if (mobileRouteFormElements === null) {
            console.warn("Mobile route form elements were not initialized properly");
            return;
        }
        // for readability, will destructure the indiivudal components from the mobileRouteFormElements obj
        const {mobileRouteForm, nodeDisplayDescription} = mobileRouteFormElements;

        // get the start position on pointer down
        this.svgRenderer.stationSVG.addEventListener("pointerdown", (ev: PointerEvent) => {
            // if a path is being viewed, do not run logic here
            if (this.currentPath !== null)
                return;

            startPos.x = ev.x;
            startPos.y = ev.y;

            // also remove certain classes from the targetNodeSVG and set its properties back to null
            targetNodeSVG.selected?.Self.BaseElement.classList.remove("highlighted__static");
            targetNodeSVG.hovering?.Self.BaseElement.classList.remove("highlighted__hovering");
            targetNodeSVG.selected = null;
            targetNodeSVG.hovering = null;

            // and set isPressed to true
            isPressed = true;
        });

        // now determine if this gesture is a click or a dragging/panning gesture
        // as well as add some cosmetic styling for the current nodeSVG we're hovering over
        this.svgRenderer.stationSVG.addEventListener("pointermove", (ev: PointerEvent) => {
            // if a path is being viewed, do not run logic here
            if (this.currentPath !== null)
                return;

            // remove the highlighted__hover class from the previously hovered nodeSVG (if it existed)
            targetNodeSVG.hovering?.Self.BaseElement.classList.remove("highlighted__hover");
            const targetElement: SVGGraphicsElement | null = ev.target as SVGGraphicsElement | null;
            // target element shouldn't be null given the way panning works but this is here to satisfy the compiler
            if (targetElement === null) {
                console.log("No target element was recorded");
                return;
            }
            // get the parentNodeSVG, if there is, for this element
            const parentNodeSVG: NodeSVG | undefined = nodeSVGMap.get(targetElement);
            if (parentNodeSVG === undefined)
                return;

            // set the targetNodeSVG's hovering property to this nodeSVG
            targetNodeSVG.hovering = parentNodeSVG;
            // add the highlighted__hover class
            parentNodeSVG.Self.BaseElement.classList.add("highlighted__hover");

            // pointermove runs even if no press action happens so we added a guard to prevent the press-based based logic 
            // from happening
            if (!isPressed)
                return;

            const currentPos: Vector2 = new Vector2(ev.x, ev.y);
            isDragging = startPos.getDist(currentPos) > dragDeltaThrehold;
        });

        // this is a follow up for the hovering styling logic in pointer move (except for leaving the bounds of the given nodeSVG)
        this.svgRenderer.stationSVG.addEventListener("pointerout", (ev: PointerEvent) => {
            // if a path is being viewed, do not run logic here
            if (this.currentPath !== null)
                return;

            // remove the currently hovered nodeSVG and then set the hovering property on targetNodeSVG to null
            targetNodeSVG.hovering?.Self.BaseElement.classList.remove("highlighted__hover");
            targetNodeSVG.hovering = null;
        });

        // on release, now run the actual event logic
        this.svgRenderer.stationSVG.addEventListener("pointerup", (ev: PointerEvent) => {
            // if a path is being viewed, do not run logic here
            if (this.currentPath !== null)
                return;

            // get the target element that bubbled up
            const targetElement: SVGGraphicsElement | null = ev.target as SVGGraphicsElement | null;

            // target element shouldn't be null given the way panning works but this is here to satisfy the compiler
            if (targetElement === null) {
                console.log("No target element was recorded");
                isDragging = true;
                isPressed = false;
                return;
            }

            if (!isDragging) {
                // get the parent node SVG here
                const parentNodeSVG: NodeSVG | undefined = nodeSVGMap.get(targetElement);
                if (parentNodeSVG === undefined) 
                    return;

                // get the node options from our node options map, this is the only check that should have a console warning
                // since if there is a nodeSVG from the map, there should definitely be a corresponding nodeOptions obj (with non
                // null start and end nodeOptions) in this map for that specific nodeSVG
                const nodeOptions: {
                    startOption: NodeOption | null, endOption: NodeOption | null
                } | undefined = nodeOptionsMap.get(parentNodeSVG);
                if (nodeOptions === undefined || nodeOptions.startOption === null || nodeOptions.endOption === null) {
                    console.warn(`Node options for nodeSVG — ${parentNodeSVG} — in nodeOptionsMap doesn't exist`);
                    return;
                }

                // if the nodeSVG does exist in the map (which it should)
                // set the targetNodeSVG to the retrieved node SVG
                targetNodeSVG.selected = parentNodeSVG;

                // do some styling logic here...

                // reveal the mobile route form
                mobileRouteForm.classList.remove("hidden");
                // set the nodeOption label to the mobile route form's node display description
                // the label should exist for both nodeOptions but we'll just set it to either or label for the sake of it
                nodeDisplayDescription.innerHTML = nodeOptions.startOption.Label || nodeOptions.endOption.Label;
                // add highlighted__static class to the target element of the node SVG and remove the highlighted__hover class
                parentNodeSVG.Self.BaseElement.classList.add("highlighted__static");
            }

            // reset the booleans here
            isDragging = false;
            isPressed = false;
        });
    }

    // initializes the event and styling logic for the mobile route form
    // returns elements that we need to affect logic for outside of the scope of this function
    private initMobileRouteForm(
        targetNodeSVG: {selected: NodeSVG | null, hovering: NodeSVG | null}, 
        nodeOptionsMap: Map<NodeSVG,{startOption: NodeOption | null, endOption: NodeOption | null}>
    ): {
        mobileRouteForm: HTMLDivElement,
        nodeDisplayDescription: HTMLDivElement
    } | null {

        // get the mobile route form and its children
        const mobileRouteForm: HTMLDivElement | null = document.querySelector(".mobile-route-form");
        // the start and end node buttons (determine whether the node you selected is the start or end destination)
        const startNodeButton: HTMLButtonElement | null | undefined = (
            mobileRouteForm?.querySelector(".node-buttons__start-node")
        );
        const endNodeButton: HTMLButtonElement | null | undefined = (
            mobileRouteForm?.querySelector(".node-buttons__end-node")
        );
        // toggle off mobile route form button
        const toggleOffButton: HTMLButtonElement | null | undefined = (
            mobileRouteForm?.querySelector(".mobile-route-form__toggle-off-button")
        );
        // currently selected node description displau
        const nodeDisplayDescription: HTMLDivElement | null | undefined = (
            mobileRouteForm?.querySelector(".node-display__description")
        );

        if (
            mobileRouteForm === null ||

            startNodeButton === null ||
            startNodeButton === undefined ||

            endNodeButton === null ||
            endNodeButton === undefined ||

            toggleOffButton === null ||
            toggleOffButton === undefined ||

            nodeDisplayDescription === null ||
            nodeDisplayDescription === undefined
        ) {
            console.warn(
                "Mobile route form and/or its children don't exist",
                `Mobile Route Form Status: ${mobileRouteForm}`,
                `Start Node Button Status: ${startNodeButton}`,
                `End Node Button Status: ${endNodeButton}`,
                `Toggle Off Button Status: ${toggleOffButton}`,
                `Node Display Status: ${nodeDisplayDescription}`
            );
            return null;
        }

        // since both the start node button and end node button function the same, I just set the logic to a handler
        const startEndNodeButtonHandler: (selectionRole: SelectionRole) => void = (selectionRole: SelectionRole) => {
            if (targetNodeSVG.selected === null || this.filterCheckboxes === null)
                return;

            // get the selected node option from our node options map
            const selectedNodeOption: {
                startOption: NodeOption | null, endOption: NodeOption | null
            } | undefined = nodeOptionsMap.get(targetNodeSVG.selected);

            if (
                selectedNodeOption === undefined || 
                selectedNodeOption.startOption === null || 
                selectedNodeOption.endOption === null
            ) {
                console.warn(`Node options for this nodeSVG — ${targetNodeSVG.selected} — doesn't exist in this map`);
                return;
            }

            // set the target node option depending on which selectio role is passed
            const targetNodeOption: NodeOption = (
                selectionRole === "start" ? selectedNodeOption.startOption: selectedNodeOption.endOption
            );

            // create a boolean that determines if a filter was matched
            let filterMatched: boolean = false;
            // node options filter field is a map structured like this: 'filter: readable_filter'
            for (const filter of this.activeFilters) {
                if (targetNodeOption.Filters.has(filter)) {
                    filterMatched = true;
                    break;
                }
            }

            // if no filters are matched
            if (!filterMatched) {
                // just run the all filter checkbox handle
                this.filterCheckboxes.all.ButtonElement.click();
            }              

            // activate the handler the the selected node option
            targetNodeOption.Self.click();
            // now the hide the mobile route form
            mobileRouteForm.classList.add("hidden");
        }

        // now create handler for the toggle off button
        const toggleOffBtnHandler: () => void = () => {
            mobileRouteForm.classList.add("hidden");
            targetNodeSVG.selected?.Self.BaseElement.classList.remove("highlighted__static");
        }

        // create the station map interaction handlers for the start/end node option and toggle off button elements
        const startNodeOptionBtnInteractionHandler: StationMapInteractionHandler = {
            element: startNodeButton,
            handler: () => startEndNodeButtonHandler("start")
        };
        const endNodeOptionBtnInteractionHandler: StationMapInteractionHandler = {
            element: endNodeButton,
            handler: () => startEndNodeButtonHandler("end")
        };
        const toggleOffBtnInteractionHandler: StationMapInteractionHandler = {
            element: toggleOffButton,
            handler: toggleOffBtnHandler
        }

        // now push into the stationMapInteractionHandlers array
        this.stationMapInteractionHandlers.push(
            startNodeOptionBtnInteractionHandler, 
            endNodeOptionBtnInteractionHandler,
            toggleOffBtnInteractionHandler
        );

        // although it should be set in the html, make sure the mobile route form is hidden at the start
        mobileRouteForm.classList.add("hidden");
        // finally return the elements that we need from the mobile route form
        return {mobileRouteForm: mobileRouteForm, nodeDisplayDescription: nodeDisplayDescription};
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

        // create a filter checkbox that reveals all options
        const allOptionFilterCheckboxAndHandler: { 
            checkbox: FilterCheckBox, 
            handler: () => void 
        } = (
            this.createAllOptionFilterCheckbox(
                filterCheckboxesContainer, 
                nodeOptions
            )
        );

        // create individual filter checkboxes for the various other node types
        const otherOptionFilterCheckboxesAndHandlers: {
            checkbox: FilterCheckBox, 
            handler: () => void 
        }[] = this.createOtherFilterCheckboxes(
            filterCheckboxesContainer,
            allOptionFilterCheckboxAndHandler,
            nodeTypesAlphabetized,
            nodeOptions
        );

        // create a handler to create a station map interaction handler and push it to the array of station map interaction handlers
        const initAndPushNewStationMapInteractionHandler: (
            element: HTMLElement, handler: () => void
        ) => void = (element: HTMLElement, handler: () => void) => {
            const stationMapInteractionHandler: StationMapInteractionHandler = {
                element: element,
                handler: handler
            };

            this.stationMapInteractionHandlers.push(stationMapInteractionHandler);
        }

        // run this handler for the all option filter checkbox
        initAndPushNewStationMapInteractionHandler(
            allOptionFilterCheckboxAndHandler.checkbox.ButtonElement, 
            allOptionFilterCheckboxAndHandler.handler
        );
        // create an array to hold all the other option filter checkboxes
        const otherOptionFilterCheckboxes: FilterCheckBox[] = [];
        // iterate thru each other filter checkbox and their respective handler
        otherOptionFilterCheckboxesAndHandlers.forEach((checkboxAndHandler: {
            checkbox: FilterCheckBox, 
            handler: () => void 
        }) => {
            // run the create station map interaciton handler for each of these checkboxes and their handlers
            initAndPushNewStationMapInteractionHandler(
                checkboxAndHandler.checkbox.ButtonElement, 
                checkboxAndHandler.handler
            );
            // as well as append the checkbox handlers to the other option filter checkboxes
            otherOptionFilterCheckboxes.push(checkboxAndHandler.checkbox);
        });

        // now initialize the filter checkboxes field
        this.filterCheckboxes = {
            all: allOptionFilterCheckboxAndHandler.checkbox, 
            other: otherOptionFilterCheckboxes
        }
    }

    // create the all option filter checkbox (reveals the options in the dropdown for all node types)
    private createAllOptionFilterCheckbox(
        filterChecklist: HTMLDivElement, 
        nodeOptions: NodeOption[]
    ): {checkbox: FilterCheckBox, handler: () => void}
    {
        // create our filter checkbox
        const filterCheckbox: FilterCheckBox = new FilterCheckBox("All Nodes", "ALL", filterChecklist);

        // init the logic for our all filter checkbox
        const handler: () => void = () => {
            // clear our active filters list
            this.activeFilters.clear();
            // clear all the styling for the other enabled checkboxes
            document.querySelectorAll(".filter-checklist__checkbox.enabled").forEach((filterCheckbox: Element) => {
                filterCheckbox.classList.remove("enabled");
            });

            // iterate thru the node options and remove the hidden class if it exists
            nodeOptions.forEach((nodeOption: NodeOption) => {
                nodeOption.Self.classList.remove("hidden");
            });
                
            // also indicate this filter check box has been clicked
            filterCheckbox.Self.classList.add("enabled");
        };

        // activate the handler at the start (since it is the default option)
        handler();

        return { checkbox: filterCheckbox, handler: handler};
    }   

    // create all the other checkboxes (for the different node types)
    private createOtherFilterCheckboxes(
        filterCheckboxesContainer: HTMLDivElement,
        allOptionFilterCheckboxAndHandler: {checkbox: FilterCheckBox, handler: () => void},
        nodeTypesAlphabetized: {value: string, readableLabel: string}[] = [],
        nodeOptions: NodeOption[]
    ): {
        checkbox: FilterCheckBox,
        handler: () => void
    }[] {
        // extract our checkbox and associated handler (to make the items more legible)
        const allOptionFilterCheckbox: FilterCheckBox = allOptionFilterCheckboxAndHandler.checkbox;
        const allOptionFilterCheckboxHandler: () => void = allOptionFilterCheckboxAndHandler.handler;

        // initialize an empty array that will hold all the other filter checkboxes and their respective handlers
        const otherFilterCheckboxesAndHandlers: {
            checkbox: FilterCheckBox,
            handler: () => void
        }[] = [];

        // iterate through our alphabetized node types
        nodeTypesAlphabetized.forEach((type: {value: string, readableLabel: string}) => {
            // create a filter checkbox 
            const filterCheckbox: FilterCheckBox = new FilterCheckBox(type.readableLabel, type.value, filterCheckboxesContainer);
            // initiate the logic for it
            const handler: () => void = () => {
                // if filter is not previously enabled
                if (!this.activeFilters.has(filterCheckbox.Value)) {
                    // add this to our set of enabled filters
                    this.activeFilters.add(filterCheckbox.Value);

                    // add the enabled styling to this checkbox
                    filterCheckbox.Self.classList.add("enabled");
                    // and remove the styling on all option filter since it should be disabled if any other filter is enabled
                    allOptionFilterCheckbox.Self.classList.remove("enabled");
                }
                // in the case this filter is disabled
                else {
                    // delete this filter value from enabled filters
                    this.activeFilters.delete(filterCheckbox.Value);

                    // remove its class attribute
                    filterCheckbox.Self.classList.remove("enabled");
                }

                // now check if any other active filters are enabled
                if (this.activeFilters.size === 0) {
                    // if not, activate our all option filter checkbox handler (e.g. enable all node options again)
                    allOptionFilterCheckboxHandler();
                    return;
                }

                // now loop through our node options with the activeFilters readjusted
                nodeOptions.forEach((nodeOption: NodeOption) => {
                    // create a boolean to determine if any filters match 
                    let matchesAFilter: boolean = false;
                    for (const filter of this.activeFilters) {
                        if (nodeOption.Filters.has(filter)) {
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
                            // set our selected node option for this start node as null
                            this.selectedNodeOptions.startNode = null;
                        }
                        // same logic as for the start node goes for the end node
                        else if (
                            role === "end" && 
                            this.selectedNodeOptions.endNode !== null &&
                            this.selectedNodeOptions.endNode === nodeOption
                        ) {
                            this.selectedNodeOptions.endNode = null;
                        }

                        // unhighlight the node
                        this.svgRenderer.unhighlightSelectedNode(role);
                        // remove this class on the dropdown parent's toggle button (mainly just for styling 
                        // (removing this class removes an image indicator that signals an option has been selected on the button))
                        nodeOption.ParentToggleButton.classList.remove("option-selected");
                    }
                    // else remove the hidden class if it exists (since it an option that may be visible)
                    else {
                        nodeOption.Self.classList.remove("hidden");
                    }
                });
            };

            // store our newly created filter checkbox and handler here
            otherFilterCheckboxesAndHandlers.push({
                checkbox: filterCheckbox,
                handler: handler
            });
        });

        return otherFilterCheckboxesAndHandlers;
    }

    // creates a new nodeSVG item given a nodeData obj
    private initNodeSVG(node: NodeData): NodeSVG | null {
        const nodeSVGElement: SVGGraphicsElement | null = document.querySelector(`[id='${node.svg_id}']`);
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

    // inits all elements related to the map views (including the block panel and the toggle button)
    private initMapViews(): void {
        // retrieve the map views block parent container here (used to init all related map view elements)
        const mapViewsContainer: HTMLDivElement | null = document.querySelector(".map-views");
        if (mapViewsContainer === null) {
            console.warn("Parent container of the map views block doesn't exist");
            return;
        }

        // init the map views block
        this.initMapViewsBlock(mapViewsContainer);
        // init all buttons that toggle the map views block
        this.initMapViewsBlockToggleButtons(mapViewsContainer);
    }

    // initialize the map views toggle button event logic
    private initMapViewsBlockToggleButtons(mapViewsContainer: HTMLDivElement): void {
        const mapViewsToggleButton: HTMLButtonElement | null = document.querySelector(".map-views__toggle-button");
        const mapViewsToggleOffButton: HTMLButtonElement | null  = mapViewsContainer.querySelector(
            ".map-views__toggle-off-button"
        );

        if (mapViewsToggleButton === null || mapViewsToggleOffButton === null) {
            console.warn(
                "The map views block toggle button and/or the map views toggle off button doesn't exist",
                `Map Views Toggle Button Status: ${mapViewsToggleButton}`,
                `Map Views Toggle Off Button Status: ${mapViewsToggleOffButton}`
            );
            return;
        }

        // event logic for the map views toggle button (only styling for the map views container)
        let isPressed: boolean = false;
        const mapViewsToggleBtnHandler: () => void = () => {
            if (!isPressed) 
                mapViewsContainer.classList.remove("hidden");
            else
                mapViewsContainer.classList.add("hidden");

            isPressed = !isPressed;
        }
        // event logic for the map views toggle off button 
        const mapViewsToggleOffBtnHandler: () => void = () => {
            isPressed = false;
            mapViewsContainer.classList.add("hidden");
        }

        // create station map interaction handlers for each element and its respective handle
        const mapViewsToggleBtnInteractionHandler: StationMapInteractionHandler = {
            element: mapViewsToggleButton,
            handler: mapViewsToggleBtnHandler
        };
        const mapViewsToggleOffBtnInteractionHandler: StationMapInteractionHandler = {
            element: mapViewsToggleOffButton,
            handler: mapViewsToggleOffBtnHandler
        };
        // push it into the array of station map interaction handlers
        this.stationMapInteractionHandlers.push(mapViewsToggleBtnInteractionHandler, mapViewsToggleOffBtnInteractionHandler);
    }

    // init the map views block and the event logic surrounding it (e.g. switching between map views)
    private initMapViewsBlock(mapViewsContainer: HTMLDivElement): void {
        const opacityAdjustSlider: HTMLInputElement | null = mapViewsContainer.querySelector(
            ".opacity-adjust__slider"
        );
        const defaultMapViewToggleButton: HTMLButtonElement | null = mapViewsContainer.querySelector(
            ".views-toggle__default-button"
        );
        const roadMapViewToggleButton: HTMLButtonElement | null = mapViewsContainer.querySelector(
            ".views-toggle__road-button"
        );
        const satelliteMapViewToggleButton: HTMLButtonElement | null = mapViewsContainer.querySelector(
            ".views-toggle__satellite-button"
        );

        if (
            opacityAdjustSlider === null ||
            defaultMapViewToggleButton === null ||
            roadMapViewToggleButton === null ||
            satelliteMapViewToggleButton === null 
        ) {
            console.warn(
                "opacity adjust slider, and/or default/road/satellite view toggle buttons don't exist",
                `Opacity Adjust Slider Status: ${opacityAdjustSlider}`,
                `Default Map View Toggle Button Status: ${defaultMapViewToggleButton}`,
                `Road Map View Toggle Button Status: ${roadMapViewToggleButton}`,
                `Satellite Map View Toggle Button Status: ${satelliteMapViewToggleButton}`
            );
            return;
        }

        // init our opacity adjust slider

        // set a handler for every shift in the slider's value
        const handleSliderShift: (value: string) => void = (value: string) => {
            // set the opacity of the map respective to the slider's value
            this.svgRenderer.adjustMapOpacity(
                parseFloat(value)
            );
            // this is just for view in the inspection panel
            opacityAdjustSlider.setAttribute("value", value);
        }
        // though already set on the template, make sure the slider's starting value is a little less than 100% opacity
        // make sure to call the handler so that all present changes are reflected
        const viewCurrentOpacity: number = 70;
        handleSliderShift(viewCurrentOpacity.toString());
        // and attach the handler to an input event listener (which runs continuously when the value changes)
        opacityAdjustSlider.addEventListener("input", (ev: InputEvent) => handleSliderShift(opacityAdjustSlider.value));

        // init the map view toggle buttons

        // create station map interaction handlers for each views toggle button
        const defaultViewBtnInteractionHandler: StationMapInteractionHandler = {
            element: defaultMapViewToggleButton,
            handler: () => this.svgRenderer.setCurrentMapView(MapView.DEFAULT)
        };
        const roadViewBtnInteractionHandler: StationMapInteractionHandler = {
            element: roadMapViewToggleButton,
            handler: () => this.svgRenderer.setCurrentMapView(MapView.ROAD)
        };
        const satelliteViewBtnInteractionHandler: StationMapInteractionHandler = {
            element: satelliteMapViewToggleButton,
            handler: () => this.svgRenderer.setCurrentMapView(MapView.SATELLITE)
        };

        // push them into the station map interaction handlers array to be initialized later
        this.stationMapInteractionHandlers.push(
            defaultViewBtnInteractionHandler, 
            roadViewBtnInteractionHandler, 
            satelliteViewBtnInteractionHandler
        );
    }

    ////////////////////////////////////// FIELDS INITIALIZING/ELEMENT STYLING THAT DOESN'T REQUIRE API DATA
    
    //////////// FIELD INITIALIZERS

    // initializes the navigation elements field
    private initNavigationElementsField(): void {
        // get the route preview and its children elements
        const routePreview: HTMLDivElement | null = document.querySelector("#route-preview");
        const startNavButton: HTMLButtonElement | null | undefined = routePreview?.querySelector("#start-navigation");
        const endNavButton: HTMLButtonElement | null | undefined = routePreview?.querySelector("#end-navigation");
        const previewDescription: HTMLDivElement | null | undefined = routePreview?.querySelector("#route-preview-description");

        // get the stepUI and its children elements
        const stepUI: HTMLDivElement | null = document.querySelector('#step-ui');
        const previousStepButton: HTMLButtonElement | null | undefined = stepUI?.querySelector("#btn-prev");    
        const nextStepButton: HTMLButtonElement | null | undefined = stepUI?.querySelector("#btn-next");
        const toggleOffButton: HTMLButtonElement | null | undefined = stepUI?.querySelector(".step-ui__toggle-off-button");
        const instructionText: HTMLDivElement | null | undefined = stepUI?.querySelector("#instruction-text");

        if (
            routePreview === null ||

            startNavButton === null || 
            startNavButton === undefined ||

            endNavButton === null ||
            endNavButton === undefined ||

            previewDescription === null || 
            previewDescription === undefined ||

            stepUI === null ||

            previousStepButton === null || 
            previousStepButton === undefined ||

            nextStepButton === null ||
            nextStepButton === undefined ||

            toggleOffButton === null ||
            toggleOffButton === undefined ||

            instructionText === null ||
            instructionText === undefined
        ) {
            console.warn(
                "Route preview and/or stepUI and their children don't exist",
                `Route Preview Status: ${routePreview}`,
                `Start Nav Button Status: ${startNavButton}`,
                `End Nav Button Status: ${startNavButton}`,
                `Preview Description Status: ${previewDescription}`,
                `Step UI Status: ${stepUI}`,
                `Previous Step Button Status: ${previousStepButton}`,
                `Next Step Button Status: ${nextStepButton}`,
                `Toggle Off Button Status: ${toggleOffButton}`,
                `Step Instruction Text Status: ${instructionText}`
            );
            return;
        }

        // initialize the navigation elements field here
        this.navigationElements = {
            routePreview: {
                self: routePreview,
                startNavBtn: startNavButton,
                endNavBtn: endNavButton,
                previewDescription: previewDescription
            },
            stepUI: {
                self: stepUI,
                btnPrev: previousStepButton,
                btnNext: nextStepButton,
                toggleOffBtn: toggleOffButton,
                instructionText: instructionText
            }
        }
    }

    // initializes the layerElements field
    // it's a bit of a misnomer because the layer elements field only includes the layer options (the container that holds all the 
    // layer buttons that isn't the all layers button) and the all layers button but it'll suffice for now
    private initLayerElementsField(): void {
        // get the layer options and the all layers button
        const layerOptions: HTMLDivElement | null = document.querySelector("#layer-options");
        const allLayersButton: HTMLButtonElement | null = document.querySelector("#show-all-layers");

        if (layerOptions === null || allLayersButton === null) {
            console.warn(
                "Layer options container and/or the all layers button doesn't exist",
                `Layer Options Status: ${layerOptions}`,
                `All Layers Button Status: ${allLayersButton}`
            );
            return;
        }

        // initialize the layer elements field
        this.layerElements = {layerOptions: layerOptions, allLayersButton: allLayersButton};
    }

    //////////// STYLING INITIALIZERS8

    // inits handling for all site header related elements
    private initSiteHeaderRelatedElements(): void {
        const siteHeaderContainer: HTMLDivElement | null = document.querySelector(".site-header");
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

        // init global styling for the header
        this.initSiteHeaderGlobalStyling(
            siteHeaderContainer,
            stationHeaderContainer,
            elementDescriptionsToggleInfoButton
        );
        // init event logic for the site header toggle button
        this.initSiteHeaderToggleButton(
            siteHeaderToggleButton, 
            siteHeaderContainer, 
            stationHeaderContainer, 
            elementDescriptionsToggleInfoButton
        );
    }

    // init global styling (root variables, etc) for the site header and related elements
    private initSiteHeaderGlobalStyling(
        siteHeaderContainer: HTMLDivElement,
        stationHeaderContainer: HTMLDivElement,
        elementDescriptionsToggleInfoButton: HTMLButtonElement
    ): void {
        const root: HTMLElement = document.documentElement; 
        // set these variables to account for responsive layout changes (not in real world usage, but for developer console users)
        const phoneToTabletWidthThreshold: number = 768; 
        const mediaQuery: MediaQueryList = window.matchMedia(`(max-width: ${phoneToTabletWidthThreshold}px)`);
        // set our header height variable initially
        this.handleHeaderHeightChange(root, siteHeaderContainer, stationHeaderContainer, elementDescriptionsToggleInfoButton);
        // allows us to change the site header height when we change dimensions (in an inspector panel)
        mediaQuery.addEventListener("change", () => this.handleHeaderHeightChange(
            root, 
            siteHeaderContainer, 
            stationHeaderContainer, 
            elementDescriptionsToggleInfoButton)
        );

    }

    // handler for dealing with changes with the header
    public handleHeaderHeightChange(
        root: HTMLElement,
        siteHeaderContainer: HTMLDivElement,
        stationHeaderContainer: HTMLDivElement,
        elementDescriptionsToggleInfoButton: HTMLButtonElement | null
    ): void {
        // set our header height variable (which controls the map header/toggle button's vertical positioning)
        root.style.setProperty("--site-header-height", `${siteHeaderContainer.offsetHeight}px`);
        // add styling classes to our site header related elements
        siteHeaderContainer.classList.add("no-transition");
        stationHeaderContainer.classList.add("no-transition");
        elementDescriptionsToggleInfoButton?.classList.add("no-transition");
    }

    // inits the event handling for the site header toggle button, toggles classes for a couple elements with the site header 
    // (and map/station header/element descriptions toggle info button) ideally should retract the header so that the diagram can be 
    // completely unobstructed
    private initSiteHeaderToggleButton(
        siteHeaderToggleButton: HTMLButtonElement,
        siteHeaderContainer: HTMLDivElement,
        stationHeaderContainer: HTMLDivElement,
        elementDescriptionsToggleInfoButton: HTMLButtonElement
    ): void {
        // boolean to prevent rapid succession of clicking (causing possibly weird race conditions, ruining our event handling system)
        let siteHeaderButtonIsAnimating: boolean = false;

        // toggle event handling here (just style changes currently)
        let isPressed = false;
        const siteHeaderToggleBtnHandler: () => void = () => {
            if (siteHeaderButtonIsAnimating) 
                return;

            // toggle all the relevant styling for the site header related elements
            this.handleSiteHeaderButtonToggling(
                siteHeaderToggleButton, 
                siteHeaderContainer, 
                stationHeaderContainer, 
                elementDescriptionsToggleInfoButton,
                isPressed
            );
            siteHeaderButtonIsAnimating = true;
            isPressed = !isPressed;
        }
        // store our event handler here (we'll init the click logic in a dedicated function for all station map handlers)
        const siteHeaderToggleBtnInteractionHandler: StationMapInteractionHandler = { 
            element: siteHeaderToggleButton, 
            handler: siteHeaderToggleBtnHandler 
        };
        this.stationMapInteractionHandlers.push(siteHeaderToggleBtnInteractionHandler);

        // also add event listener for animation end for the button
        siteHeaderToggleButton.addEventListener("animationend", (ev: AnimationEvent) => {
            if (ev.animationName === "SiteHeaderButtonAnimation") {
                siteHeaderToggleButton.classList.remove("animating");
                siteHeaderButtonIsAnimating = false;
            }
        });
    }

    // this is the event logic (styling for site header related elements) for when the site header button is toggled
    public handleSiteHeaderButtonToggling(
        siteHeaderToggleButton: HTMLButtonElement, 
        siteHeaderContainer: HTMLDivElement,
        stationHeaderContainer: HTMLDivElement,
        elementDescriptionsToggleInfoButton: HTMLButtonElement | null,
        isToggled: boolean
    ): void {
        // NOTE: animating is similar to the map rotate button's animating (which is temp and will be removed almost immediately)
        siteHeaderToggleButton.classList.add("animating");
        siteHeaderToggleButton.classList.toggle("enabled", !isToggled);
        siteHeaderToggleButton.setAttribute("aria-expanded", isToggled.toString());
        siteHeaderToggleButton.setAttribute(
            "aria-label",
            !isToggled ? "Show site navigation": "Hide site navigation"
        );
        siteHeaderContainer.classList.toggle("retracted", !isToggled);
        stationHeaderContainer.classList.toggle("shifted-up", !isToggled);
        elementDescriptionsToggleInfoButton?.classList.toggle("shifted-up", !isToggled);

        // (see initSiteHeaderGlobalStyling() for more info), this removes a class that disables transitions; the reason for this
        // is the positioning of all header related items use a dynamically updated css variable, to avoid issues with weird
        // positional translations (for ex: station header moves down on page load or when the site header is resized) we're gonna
        // opt for this architectural implementation
        siteHeaderContainer.classList.remove("no-transition");
        stationHeaderContainer.classList.remove("no-transition");
        elementDescriptionsToggleInfoButton?.classList.remove("no-transition");
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

        let toggleButtonIsAnimating: boolean = false;

        // make sure the hidden class is added to the info container wrapper (it should already exist in the html template)
        // this is the same as the filterChecklistCheckboxesContainer
        mapLegendInfoContainerWrapper.classList.add("hidden");

        // add event handler for the toggle button (mainly for styling)
        let isPressed: boolean = false;
        const mapLegendToggleBtnHandler: () => void = () => {
            if (toggleButtonIsAnimating)
                return;

            mapLegendInfoContainerWrapper.classList.toggle("hidden", isPressed);
            // same as the site header toggle button + map rotate button, add a temp animating class 
            mapLegendToggleButton.classList.add("animating");
            mapLegendToggleButton.classList.toggle("enabled", !isPressed);
            mapLegendToggleButton.setAttribute("aria-expanded", (!isPressed).toString());
            mapLegendToggleButton.setAttribute(
                "aria-label", 
                isPressed ? "Show map legend" : "Hide map legend"
            );
        
            toggleButtonIsAnimating = true;
            isPressed = !isPressed;
        };
        // store our event handler here (we'll init the click logic in a dedicated function for all station map handlers)
        const mapLegendToggleBtnInteractionHandler: StationMapInteractionHandler = { 
            element: mapLegendToggleButton, 
            handler: mapLegendToggleBtnHandler 
        };
        this.stationMapInteractionHandlers.push(mapLegendToggleBtnInteractionHandler);

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
        if (this.navigationElements === null) {
            console.warn("Navigation elements field is not initialized");
            return;
        }

        // destructure the stepUI field from navigation elements
        const {stepUI} = this.navigationElements;

        // make sure the stepui has the hidden element (though it should already be set in the template)
        stepUI.self.classList.add("hidden");
    }

    // init certain styling for the preview (the container that contains buttons to either find a new route or start navigation) 
    // during page load
    private initPreview(): void {
        if (this.navigationElements === null) {
            console.warn("Navigation elements field is not initialized");
            return;
        }

        // destructure the routePreview field from navigation elements
        const {routePreview} = this.navigationElements;

        // make sure the preview has the hidden element (though it should already be set in the template)
        routePreview.self.classList.add("hidden");
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

        // init our event handling here 
        let isPressed: boolean = false;
        const elementDescriptionToggleBtnHandler: () => void = () => {
            elementDescriptions.forEach((elementDescription: HTMLDivElement) => elementDescription.classList.toggle("hidden", isPressed));
            elementDescriptionsToggleInfoButton.classList.toggle("enabled", !isPressed);
            elementDescriptionsToggleInfoButton.setAttribute("aria-pressed", (!isPressed).toString());

            isPressed = !isPressed;
        };
        // store our event handler here (we'll init the click logic in a dedicated function for all station map handlers)
        const elementDescriptionToggleBtnInteractionHandler: StationMapInteractionHandler = { 
            element: elementDescriptionsToggleInfoButton, 
            handler: elementDescriptionToggleBtnHandler 
        };
        this.stationMapInteractionHandlers.push(elementDescriptionToggleBtnInteractionHandler);
    }

    // inits some event logic for the element descriptions
    public initElementDescriptions(): void {
        const elementDescriptions: NodeListOf<HTMLDivElement> = document.querySelectorAll<HTMLDivElement>(".element-description");
        // since some of these element descriptions are literally embedded in buttons, it's included as part of the event listners
        // of those buttons (which we don't want); this prevents bubbling from occuring 
        elementDescriptions.forEach((elementDescription: HTMLDivElement) => {
            elementDescription.addEventListener("click", (ev: MouseEvent) => ev.stopPropagation());
        });
    }

    // init all the "click"-like and "touch"-like event listeners
    public initInteractionHandlers(): void {
        this.stationMapInteractionHandlers.forEach((stationMapInteractionHandler: StationMapInteractionHandler) => {
            stationMapInteractionHandler.element.addEventListener("click", () => stationMapInteractionHandler.handler());
        }); 
    }
}

