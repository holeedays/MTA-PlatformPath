import { type LayerData } from "./station_data.ts";

// a node option class used to house various proprties pertaining to an option for the node dropdown
export class NodeOption {
    public label: string;
    public id: string;
    public layer: LayerData; 
    // NOTE: filters is in the structure {value: readableLabel}
    public filters: Map<string,string>;
    public self: HTMLOptionElement;

    constructor(
        label: string,
        id: string,
        layer: LayerData,
        filters: Map<string,string>) {

        this.label = label;
        this.id = id;
        this.layer = layer;

        this.filters = filters;

        this.self = document.createElement("option");
        this.setStyling();
    }

    // set the styling/visual look of the element
    private setStyling() {
        this.self.value = this.id;

        this.self.style.backgroundColor = this.layer.color;
        this.self.style.color = "#111";

        // just some legibility enhancements (in the html) for the filters in the options element
        let dataFilters: string = "";
        let descriptionFilters: string = "";
        let count: number = 0;
        this.filters.forEach((readableLabel: string, value: string) => {
            if (count > 0) {
                dataFilters += "," + " ";
                descriptionFilters += "," + "";
            }

            dataFilters += value;
            descriptionFilters += readableLabel;
            count++;
        });
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
    public label: string;
    public value: string;

    public self: HTMLDivElement;
    public labelElement: HTMLSpanElement;
    public buttonElement: HTMLButtonElement;

    constructor(label: string, value: string) {
        this.label = label;
        this.value = value;

        this.self = document.createElement("div");
        this.labelElement = document.createElement("span");
        this.buttonElement = document.createElement("button");
        
        this.setStyling();
    }

    // like node option, sets the styling/visual look of element and anything extraneous involving the html part of the element
    private setStyling() {
        // note: these attributes are just for legibility and semantic understanding of what the checkbox does... etc
        this.self.setAttribute("label", "filter checkbox");
        this.labelElement.innerHTML = this.label;
        this.buttonElement.value = this.value;

        // append all these children to the parent container
        this.self.append(this.labelElement, this.buttonElement);
    }
}