import type { PathStep } from "./path_finder.ts";
import { type LayerData } from "./station_data.ts";
import { SvgRenderer, type SelectionRole } from "./svg_renderer.ts";

// a node option class used to house various proprties pertaining to an option for the node dropdown
export class NodeOption {
    private label: string;
    private id: number;
    private svgID: string;
    private layer: LayerData; 
    // NOTE: filters is in the structure {value: readableLabel}
    private filters: Map<string,string>;

    private parent: HTMLDivElement;
    private parentToggleButton: HTMLButtonElement;
    private self: HTMLButtonElement;

    constructor(
        parent: HTMLDivElement,
        parentToggleButton: HTMLButtonElement,
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
        this.parentToggleButton = parentToggleButton;
        this.self = document.createElement("button");

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
    get ParentToggleButton(): HTMLButtonElement {
        return this.parentToggleButton;
    }
    get Self(): HTMLButtonElement {
        return this.self;
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

        // append the label componenets to the node option
        this.self.append(labelComponent, filterDescriptionComponent);
        // and now append it to its parent
        this.parent.append(this.self);
    }

    // gets the selection role of this node option
    public selectionRole(): SelectionRole {
        if (this.parent.id === "start-node-dropdown")
            return "start"
        else
            return "end"
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

// interface to deal with station map handlers (allows us to modify certain event handling logic depending on whether
// we're on mobile or desktop)
export interface StationMapInteractionHandler {
    element: HTMLElement,
    handler: () => void; 
}

// another related class to NodeOptions, except has the dropdown button as the basis and different logic associated with it
export class NodeDropdownButton {
    private nodeOptions: NodeOption[];
    private linkedDropdown: HTMLDivElement;
    private self: HTMLButtonElement;

    private isToggled: boolean;

    constructor(self: HTMLButtonElement, linkedDropdown: HTMLDivElement) {
        this.nodeOptions = [];
        this.linkedDropdown = linkedDropdown;
        this.self = self;

        this.isToggled = false;
    }

    get NodeOptions(): NodeOption[] {
        return this.nodeOptions;
    }
    get LinkedDropdown(): HTMLDivElement {
        return this.linkedDropdown;
    }
    get Self(): HTMLButtonElement {
        return this.self;
    }

    get IsToggled(): boolean {
        return this.isToggled;
    }

    set IsToggled(value: boolean) {
        this.isToggled = value;
        this.linkedDropdown.classList.toggle("hidden", !this.isToggled);
    } 
}
