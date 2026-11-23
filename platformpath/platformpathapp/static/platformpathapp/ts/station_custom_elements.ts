import { type LayerData, type NodeData } from "./station_data.ts";
import { type SelectionRole } from "./svg_renderer.ts";

// a node option class used to house various proprties pertaining to an option for the node dropdown
export class NodeOption {
    private nodeSVG: NodeSVG;
    private node: NodeData;
    private layer: LayerData; 
    // NOTE: filters is in the structure {value: readableLabel}
    private filters: Map<string,string>;
    private handler: (() => void) | null = null;

    private parent: HTMLDivElement;
    private parentToggleButton: HTMLButtonElement;
    private self: HTMLButtonElement;

    constructor(
        parent: HTMLDivElement,
        parentToggleButton: HTMLButtonElement,
        nodeSVG: NodeSVG,
        node: NodeData,
        layer: LayerData,
        filters: Map<string,string>,
    ) {
        this.nodeSVG = nodeSVG;
        this.node = node
        this.layer = layer;

        this.filters = filters;

        this.parent = parent;
        this.parentToggleButton = parentToggleButton;
        this.self = document.createElement("button");
    }

    // we're using getters to access the private members since we want the data to be immutable after construction
    get NODESVG(): NodeSVG {
        return this.nodeSVG;
    }
    get Node(): NodeData {
        return this.node;
    }
    get Layer(): LayerData {
        return this.layer;
    }

    get Filters(): Map<string, string> {
        return this.filters;
    }
    get Handler(): (() => void) | null {
        if (this.handler === null)
            console.warn("The node option has not been initialized, there is no handler");

        return this.handler;
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

    // initializes this node options (configuring additional event/styling logic post constructor)
    public init(handler: () => void): void {
        // set the handler to the given property
        this.handler = handler;
        // set the styling of the element in the DOM
        this.setStyling();
    }

    // set the styling/visual look of the element and add it to the DOM
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
        
        labelComponent.innerHTML = this.node.label;
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
    private handler: (() => void) | null = null;

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
    get Handler(): (() => void) | null {
        if (this.handler === null)
            console.warn("The filter checkbox has not been initialized, there is no handler");

        return this.handler;
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

    // same as node options, initializes additional event/styling logic of the filter check box
    public init(handler: () => void): void {
        // set this property to the given handler
        this.handler = handler;
        // set the styling/structure of the element
        this.setStyling();
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

// a class used to hold the various layers/levels/floors (they all mean the same thing) of the given station
export class LayerOption {
    private label: string;
    private color: string;
    private handler: (() => void) | null = null;

    private parent: HTMLDivElement;
    private layerSVGs: SVGGraphicsElement[];
    private self: HTMLButtonElement;

    constructor (parent: HTMLDivElement, layerSVGs: SVGGraphicsElement[], label: string, color: string) {
        this.label = label;
        this.color = color;

        this.parent = parent;
        this.layerSVGs = layerSVGs;
        this.self = document.createElement("button");
    }

    get Label(): string {
        return this.label;
    }
    get Color(): string {
        return this.color;
    }
    get Handler(): (() => void) | null {
        if (this.handler === null)
            console.warn("The node option has not been initialized, there is no handler");

        return this.handler;
    }

    get Parent(): HTMLDivElement {
        return this.parent;
    }
    get LayerSVGs(): SVGGraphicsElement[] {
        return this.layerSVGs;
    }
    get Self(): HTMLButtonElement {
        return this.self;
    } 

    // like node options and filter checkbox, the .init() fn configures additional event/styling logic of the layer options
    public init(handler: () => void): void {
        // set the given handler to the handler property
        this.handler = handler;
        // set the styling of the element
        this.setStyling();
    }

    // sets the styling and layout of this layer options
    private setStyling(): void {
        this.self.type = "button";
        this.self.classList.add("layer-option");
        this.self.innerText = this.label;
        // this is to allow access to the color in the css
        this.self.style.setProperty("--bg-color", this.color);
        // append self to the DOM
        this.parent.append(this.self);
    }
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

// a class to hold all *colored* svgs of a node together and apply certain methods to them accordingly
export class NodeSVG {
    private self: SVGComponentElement;
    private coloredComponents: SVGComponentElement[];
    private allComponents: SVGComponentElement[];

    constructor(baseElement: SVGGraphicsElement) {
        this.self = new SVGComponentElement(baseElement);
        this.coloredComponents = this.getColoredComponents(baseElement);
        this.allComponents = this.getAllComponents(baseElement);
    }

    get Self(): SVGComponentElement {
        return this.self;
    } 
    get ColoredComponents(): SVGComponentElement[] {
        return this.coloredComponents;
    }
    get AllComponents(): SVGComponentElement[] {
        return this.allComponents;
    }

    // get the children of the parent container that have an explicit fill attribute
    private getColoredComponents(baseElement: SVGGraphicsElement): SVGComponentElement[] {
        // instantiate an array to hold our colored components (excluding the base element)
        const coloredComponents: SVGComponentElement[] = [];
        // find all components in our base element (parent container basically) that has an explicit fill
        const allColoredComponents: NodeListOf<SVGGraphicsElement> = baseElement.querySelectorAll<SVGGraphicsElement>("[fill]");
        // iterate through each component (exclude the base element since that is already assigned to self)
        allColoredComponents.forEach((component: SVGGraphicsElement) => {
            if (component !== baseElement) {
                // then push it to our colored components array
                coloredComponents.push(
                    new SVGComponentElement(component)
                );
            }
        });
        return coloredComponents;
    }

    // gets all children of the parent container
    private getAllComponents(baseElement: SVGGraphicsElement): SVGComponentElement[] {
        const components: SVGComponentElement[] = [];
        // the asterisk symbol selects all children
        const children: NodeListOf<SVGGraphicsElement> = baseElement.querySelectorAll<SVGGraphicsElement>("*");
        children.forEach((child: SVGGraphicsElement) => {
            components.push(
                new SVGComponentElement(child)
            );
        })

        return components;
    }
}

// a class to include some metadata with an svg type element in our html
export class SVGComponentElement {
    private baseElement: SVGGraphicsElement;
    private originalFill: string;

    constructor(baseElement: SVGGraphicsElement) {
        this.baseElement = baseElement;
        this.originalFill = baseElement.style.fill || baseElement.getAttribute("fill") || "";

        this.setStyling();
    }

    get BaseElement(): SVGGraphicsElement {
        return this.baseElement;
    }
    get OriginalFill(): string {
        return this.originalFill;
    }

    // set necessary styling (css/html) for the svg element
    private setStyling(): void {
        // these properties and classes are for highlighting related styling
        this.baseElement.style.setProperty("--original-fill", this.originalFill);
        this.baseElement.classList.add("node-SVG__component");
    }
}

// interface to deal with station map handlers (allows us to modify certain event handling logic depending on whether
// we're on mobile or desktop)
export interface StationMapInteractionHandler {
    element: HTMLElement,
    handler: () => void; 
}