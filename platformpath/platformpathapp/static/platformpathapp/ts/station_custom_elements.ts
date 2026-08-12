import { type LayerData } from "./station_data.ts";
import { SvgRenderer } from "./svg_renderer.ts";
import { type SelectionRole } from "./svg_renderer.ts";

// a node option class used to house various proprties pertaining to an option for the node dropdown
export class NodeOption {
    private label: string;
    private id: number;
    private svgID: string;
    private layer: LayerData; 
    // NOTE: filters is in the structure {value: readableLabel}
    private filters: Map<string,string>;

    private parent: HTMLDivElement;
    private self: HTMLButtonElement;

    constructor(
        parent: HTMLDivElement,
        label: string,
        id: number,
        svgID: string,
        layer: LayerData,
        filters: Map<string,string>
    ) {
        
        this.label = label;
        this.id = id;
        this.svgID = svgID;
        this.layer = layer;

        this.filters = filters;

        this.parent = parent;
        this.self = document.createElement("button");
        this.parent.append(this.self);

        this.setBaseLogic();
        this.setStyling();
    }

    // we're using getters to access the private members since we want the data to be immutable after construction
    get Label(): string {
        return this.label;
    }
    get SVGID(): string {
        return this.svgID;
    }
    get ID(): number {
        return this.id;
    }
    get Layer(): LayerData {
        return this.layer;
    }
    get Filters(): Map<string, string> {
        return this.filters;
    }
    get Parent(): HTMLDivElement {
        return this.parent;
    }
    get Self(): HTMLButtonElement {
        return this.self;
    }

    // set the logic for the dropdown (still involves some styling changes but this is only involved with the event logic)
    private setBaseLogic(): void {
        this.self.addEventListener("click", () => {
            // check if the parent has an option that is selected
            const previouslySelectedOption: HTMLButtonElement | null = this.parent.querySelector<HTMLButtonElement>(".selected");
            // determine if the previously selected option matches our current option
            if (previouslySelectedOption !== this.self) {
                // and then apply class changes
                previouslySelectedOption?.classList.remove("selected");
                this.self.classList.add("selected");
            }
            // hide dropdown afterwards
            this.parent.hidePopover();
        });
    }

    // set the styling/visual look of the element
    private setStyling(): void {
        this.self.classList.add("route-field__dropdown-option");

        this.self.style.setProperty("--bg-color", this.layer.color);
        this.self.style.color = "#111";

        // just some legibility enhancements (in the html) for the filters in the options element
        let dataFilters: string = "";
        let descriptionFilters: string = "";
        let count: number = 0;
        this.filters.forEach((readableLabel: string, value: string) => {
            if (count > 0) {
                dataFilters += "," + " ";
                descriptionFilters += "," + " ";
            }

            dataFilters += value;
            descriptionFilters += readableLabel;
            count++;
        });
        // attaches some legible metadata on the client end to view
        this.self.setAttribute("data-filters", dataFilters);

        // we will split the label and filter descriptions as separate parts of the option (for more flexible styling later on)
        const labelComponent: HTMLElement = document.createElement("strong");
        const filterDescriptionComponent: HTMLSpanElement = document.createElement("span");
        
        labelComponent.innerHTML = this.label;
        filterDescriptionComponent.innerHTML = descriptionFilters;

        this.self.append(labelComponent, filterDescriptionComponent);
    }
}

// a filter checkbox class used to house custom properties for a compound html object ("The filter checkbox")
export class FilterCheckBox {
    private label: string;
    private value: string;
    private logicHasBeenInit: boolean = false;

    private parent: HTMLDivElement;
    private self: HTMLDivElement;
    private labelElement: HTMLSpanElement;
    private buttonElement: HTMLButtonElement;

    constructor(label: string, value: string, parent: HTMLDivElement) {
        this.label = label;
        this.value = value;

        this.parent = parent;
        this.self = document.createElement("div");
        this.labelElement = document.createElement("span");
        this.buttonElement = document.createElement("button");
        
        this.setStyling();
    }

    get Label(): string { 
        return this.label;
    }
    get Value(): string {
        return this.value;
    }

    get Self(): HTMLDivElement {
        return this.self;
    }
    get LabelElement(): HTMLSpanElement {
        return this.labelElement;
    }
    get ButtonElement(): HTMLButtonElement {
        return this.buttonElement;
    }
    
    get LogicHasBeenInit(): boolean {
        return this.logicHasBeenInit;
    }

    // checker function to prevent multiple event handlers to be assigned to one checbox
    private logicWasInitializedPreviously(): boolean {
        if (this.logicHasBeenInit) {
            console.log("This filter checkbox's event logic has already been initiated");
            return true;
        }
        this.logicHasBeenInit = true;
        return false;
    }   

    // init the logic for an all option filter checkbox
    // to be utilized in the station map page where these params can be fulfilled
    public initAllFilterLogic(nodeOptions: NodeOption[], activeFilters: Set<string>): void {
        // include this check to prevent accidental assignments of multiple event handlers 
        if (this.logicWasInitializedPreviously())
            return;

        this.buttonElement.addEventListener("click", () => {
            // clear our active filters list
            activeFilters.clear();
            // clear all the styling for the other enabled checkboxes
            document.querySelectorAll(".filter-checklist__checkbox, .enabled").forEach((filterCheckbox: Element) => {
                filterCheckbox.classList.remove("enabled");
            });

            // iterate thru the node options and remove the hidden class if it exists
            nodeOptions.forEach((nodeOption: NodeOption) => {
                nodeOption.Self.classList.remove("hidden");
            });
                
            // also indicate this filter check box has been clicked
            this.self.classList.add("enabled");
        });
    }

    // init the logic for a specific option checkbox (e.g. STRS, MEZZ, etc.. VS ALL)
    // to be utilized in the station map page where these params can be fulfilled
    public initSpecificFilterLogic(
        allOptionFilterCheckbox: FilterCheckBox, 
        nodeOptions: NodeOption[],
        selectedNodeOptions: {startNode: NodeOption | null, endNode: NodeOption | null},
        activeFilters: Set<string>
    ): void {
        if (this.logicWasInitializedPreviously())
            return;

        // event listener logic here...
        this.buttonElement.addEventListener("click", () => {
            // if filter is not previously enabled
            if (!activeFilters.has(this.value)) {
                // add this to our set of enabled filters
                activeFilters.add(this.value);

                // add the enabled styling to this checkbox
                this.self.classList.add("enabled");
                // and remove the styling on all option filter since it should be disabled if any other filter is enabled
                allOptionFilterCheckbox.Self.classList.remove("enabled");
            }
            // in the case this filter is disabled
            else {
                // delete this filter value from enabled filters
                activeFilters.delete(this.value);

                // remove its class attribute
                this.self.classList.remove("enabled");
            }

            // now check if any other active filters are enabled
            if (activeFilters.size === 0) {
                // activate the event listener for this
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
                // if not just hide it and remove the selected value
                if (!matchesAFilter) {
                    nodeOption.Self.classList.add("hidden");
                    // also remove the option__selected class if it is to be hidden
                    nodeOption.Self.classList.remove("selected");

                    // also remove it from the selected node options (since it won't be seen anymore if it doesn't match a filter)
                    if (selectedNodeOptions.startNode !== null && nodeOption.SVGID === selectedNodeOptions.startNode.SVGID) 
                        selectedNodeOptions.startNode = null;
                    if (selectedNodeOptions.endNode !== null && nodeOption.SVGID === selectedNodeOptions.endNode.SVGID) 
                        selectedNodeOptions.endNode = null;
                }
                // else remove the hidden class if it exists
                else {
                    nodeOption.Self.classList.remove("hidden");
                }
            });
        });
    }


    // like node option, sets the styling/visual look of element and anything extraneous involving the html part of the element
    private setStyling(): void {
        this.self.classList.add("filter-checklist__checkbox");
        // NOTE: this attribute is just for legibility and semantic understanding of what the checkbox does... etc
        this.self.setAttribute("aria-label", "Filter checkbox");
        this.labelElement.innerHTML = this.label;
        this.buttonElement.value = this.value;

        // append all these children to the container
        this.self.append(this.labelElement, this.buttonElement);
        // and then append this container to the parent that holds all the other filters
        this.parent.append(this.self);
    }
}

// a class to hold all *colored* svgs of a node together and apply certain methods to them accordingly
export class NodeSVG {
    private self: SVGComponentElement;
    private coloredComponents: SVGComponentElement[];

    constructor(baseElement: HTMLElement) {
        this.self = new SVGComponentElement(baseElement);
        this.coloredComponents = this.getColoredComponents(baseElement);
    }

    get Self(): SVGComponentElement {
        return this.self;
    } 
    get ColoredComponents(): SVGComponentElement[] {
        return this.coloredComponents;
    }
    get AllComponents(): SVGComponentElement[] {
        return [this.self, ... this.coloredComponents];
    }

    // get the children of the parent container that have an explicit fill attribute
    private getColoredComponents(baseElement: HTMLElement): SVGComponentElement[] {
        // instantiate an array to hold our colored components (excluding the base element)
        const coloredComponents: SVGComponentElement[] = [];
        // find all components in our base element (parent container basically) that has an explicit fill
        const allColoredComponents: NodeListOf<HTMLElement> = baseElement.querySelectorAll<HTMLElement>("[fill]");
        // iterate through each component (exclude the base element since that is already assigned to self)
        allColoredComponents.forEach((component: HTMLElement) => {
            if (component !== baseElement) {
                // then push it to our colored components array
                coloredComponents.push(
                    new SVGComponentElement(component)
                );
            }
        });
        return coloredComponents;
    }
}

// a class to include some metadata with an svg type element in our html
export class SVGComponentElement {
    private baseElement: HTMLElement;
    private originalFill: string;

    constructor(baseElement: HTMLElement) {
        this.baseElement = baseElement;
        this.originalFill = baseElement.style.fill || baseElement.getAttribute("fill") || "";

        this.setStyling();
    }

    get BaseElement(): HTMLElement {
        return this.baseElement;
    }
    get OriginalFill(): string {
        return this.originalFill;
    }

    // set necessary styling (css/html) for the svg element
    private setStyling(): void {
        this.baseElement.style.setProperty("--original-fill", this.originalFill);
    }
}
