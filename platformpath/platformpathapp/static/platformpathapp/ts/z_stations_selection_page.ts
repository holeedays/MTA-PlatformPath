import { DataFetch } from "./data_fetch_new.ts";
import { slugify } from "./slugs.ts";
import { URLHandler } from "./url_handler.ts";

// this class will handle the stations selections route
export class StationsSelectionPage {
    constructor() {
    }

    // this is the function we'll run on app.ts
    public async init(): Promise<void> {
        console.log("Now we're selecting stations...");
        // init all the elements in our page
        await this.initElements();
    }

    // umbrella function to init all elements in the html page, available or unavailable
    private async initElements(): Promise<void> {
        // retrieve the metadata embedded in our url
        const lineID: number | null = this.getLineIDFromSlug();
        if (lineID === null) {
            console.warn("Cannot extract the ID from the URL. Aborting initializing this page.");
            return;
        }
        // get our stations data using the corresponding line id from our slug data
        const stations: {
            line_reference: {
                name: string,
                color: string, 
                id: number
            },
            stations: {
                name: string, 
                id: number, 
                station_order: number, 
                lines: string[], 
                diagram_path: string
            }[]
            } | null = await this.fetchData(lineID);
        if (stations === null) {
            console.warn("Cannot fetch station data. Aborting initializing this page.");
            return;
        }
        console.log(stations);
        
        // get the main elements we'll be modifying
        const stationsSelectionContainer: HTMLDivElement | null = (
            document.getElementById("stations_selection_container") as HTMLDivElement);
        const inputForm: HTMLInputElement | null = stationsSelectionContainer?.querySelector("input");
        const stationsList: HTMLOListElement | null = stationsSelectionContainer?.querySelector("ol");
        const logoDiv: HTMLDivElement | null = document.getElementById("logo") as HTMLDivElement;

        if (stationsSelectionContainer === null || inputForm === null || stationsList === null || logoDiv === null) {
            console.warn(
                "Cannot find stations selection container, input form, stations list, or logo div",
                `Station Selection Container Status: ${stationsSelectionContainer};`,
                `Input Form Status: ${inputForm};`,
                `Stations List Status: ${stationsList}`,
                `Logo div: ${logoDiv}`
            );
            return;
        }

        // configure these elements
        this.initStationSelectionContainer(stationsSelectionContainer, stations.line_reference.color);
        const stationListElements: [HTMLLIElement, HTMLButtonElement][] = this.initStationsList(stationsList, stations.stations);
        this.initInputForm(inputForm, stationListElements);
        this.initLogoDiv(logoDiv, stations.line_reference.name);
    }
    
    // get data from the slug in our url
    private getLineIDFromSlug(): number | null {
        // extract the line slug from the URL and get the necessary data from it
        // the url currently is: discover/lines/some_line_slug/stations/
        const currentURL: string = URLHandler.getFullURLRoute();
        const urlSplit: string[] = currentURL.split("/");
        
        const lineSlug: string | undefined = urlSplit[urlSplit.length - 3];
        const lineSlugSplit: string[] | undefined = lineSlug?.split("-");
        const lineID: number | undefined = Number(lineSlugSplit?.at(-1));
        
        if (lineID !== undefined && !Number.isNaN(lineID))
            return lineID;
        else 
            return null;
    }

    // fetch the stations data given our our line ID
    private async fetchData(lineID: number): Promise<{ 
        line_reference: {
            name: string,
            color: string, 
            id: number
        },
        stations: {
            name: string, 
            id: number, 
            station_order: number, 
            lines: string[], 
            diagram_path: string
        }[]} | null> {

        return await(DataFetch.fetchStations(lineID));
    }

    // configure our stations selection container (the parent container of our input form/selection container)
    // it's mainly just to add classes to it
    private initStationSelectionContainer(stationsSelectionContainer: HTMLDivElement, ...classes: string[]): void {
        classes.forEach((cls: string) => stationsSelectionContainer.classList.add(cls));
    }

    // create the elements in our stations list
    private initStationsList(
        stationsList: HTMLOListElement, 
        stations: {
            name: string, 
            id: number, 
            station_order: number,
            lines: string[],
            diagram_path: string
        }[]): [HTMLLIElement, HTMLButtonElement][] {

        // create another array to hold all the list & button elements (tuples) we will create and add to to our list
        const stationListElements: [HTMLLIElement, HTMLButtonElement][] = [];

        // create our buttons and add even listeners for each one
        for (const station of stations) {
            const button: HTMLButtonElement = document.createElement("button");
            // this items will contain the button and will be appended to our list
            const listItemWrapper: HTMLLIElement = document.createElement("li");
            // also add this div to contain the order number (it'll be custom over the original ordered list)
            const orderIdentifier: HTMLDivElement = document.createElement("div");

            button.innerHTML = station.name;
            button.value = station.name;
            // we'll use this ordering over the ordered list's default numbering style
            orderIdentifier.innerHTML = `${station.station_order}`;
            orderIdentifier.classList.add("order_identifier");

            listItemWrapper.append(orderIdentifier, button);
            stationsList.appendChild(listItemWrapper);
            stationListElements.push([listItemWrapper, button]);

            // add the event listener logic for our buttons (redirecting to another part of our url)
            button.addEventListener("click", () => {
                const currentURL: string = URLHandler.getFullURLRoute();
                const stationSlug: string = slugify(station.name, station.id);
                window.location.href = currentURL + stationSlug + "/map/";
            });
        }

        // return our list elements (to be used later)
        return stationListElements;
    }

    // configure the event logic of the input form
    private initInputForm(inputForm: HTMLInputElement, stationListElements: [HTMLLIElement, HTMLButtonElement][]): void {
        // configure the logic for the input form (matching user input)
        inputForm.addEventListener("input", () => {
            // create a regexp that tests whether any string matches with the current input form value (case insensitive)
            const userInputRegex: RegExp = new RegExp(`${inputForm.value}`, "i");
            // iterate through each button amd check whether the user input value matches with their value
            for (const [listElement, buttonElement] of stationListElements) {
                // if it doesn't have the value, add a class to make it "hidden" from the container (CSS will handle it)
                if (!userInputRegex.test(buttonElement.value)) {
                    listElement.classList.add("hidden");
                }
                else {
                    listElement.classList.remove("hidden");
                }
            }
        });
    }

    // configure the logo div (it's just adding the line name to the logoDiv so the text is visible)
    private initLogoDiv(logoDiv: HTMLDivElement, lineName: string): void {
        logoDiv.innerHTML = lineName;
    }
}
