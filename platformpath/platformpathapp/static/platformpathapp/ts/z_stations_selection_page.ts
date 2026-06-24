import { DataFetch } from "./data_fetch_new.ts";
import { Slugifier } from "./slugifier.ts";
import { URLHandler } from "./url_handler.ts";

// this class will handle the stations selections route
export class StationsSelectionPage {
    private slugifier: Slugifier;

    constructor() {
        this.slugifier = new Slugifier();
    }

    // this is the function we'll run on app.ts
    public async init(): Promise<void> {
        console.log("Now we're selecting stations...");

        // clear query params with the key "selected_station" (if page refresh)
        URLHandler.removeQueryParameter("selected_station");
        await this.initElements();
        // initiate the submit button after everything is created
        this.initSubmitButton();
    }

    // umbrella function to init all elements in the html page, available or unavailable
    private async initElements(): Promise<void> {
        // extract the line slug from the URL and get the necessary data from it
        // the url currently is: discover/lines/some_line_slug/stations/
        const currentURL: string = URLHandler.getFullURLRoute();
        const urlSplit: string[] = currentURL.split("/");

        const lineSlug: string | undefined = urlSplit[urlSplit.length - 3];

        let lineName: string | null = null;
        let lineID: number | null = null;
        if (lineSlug !== undefined) {
            lineName = this.slugifier.deslugify(lineSlug)[0] as string ?? null;
            lineID = this.slugifier.deslugify(lineSlug)[1] as number ?? null;
        }

        // check if the line slug actually yields valid results
        if (lineName === null || lineID === null) {
            console.warn(
                "Cannot init the page because either lineName or lineID from the lineSlug is undefined",
                `lineName: ${lineName}; lineID: ${lineID}`
            );
            return;
        }

        // make the fetch request and retrieve the station data
        const stations: {
            name: string, 
            id: number, 
            station_order: number,
            lines: string[],
            diagram_path: string
        }[] = await DataFetch.fetchStations(lineID);
        
        // init variables to reference the target elements in our HTML template
        let targetLineSelectionContainer: HTMLDivElement | null = null;
        const unselectedLinesSelectionContainers: HTMLDivElement[] = [];

        // get the master container holding everything
        const stationsSelectionContainer: HTMLDivElement | null = document.getElementById(
            "stations_selection_container") as HTMLDivElement;
        const subwayLinesColorGroups: HTMLCollection = stationsSelectionContainer?.children;

        // recursively check the nested html elements till we get to our line selection containers
        for (const colorGroup of subwayLinesColorGroups) {
            for (const lineSelectionContainer of colorGroup.children) {
                // set targetLineSelectionContainer 
                if (lineSelectionContainer.id === `${lineName}_selection_container`) {
                    targetLineSelectionContainer = lineSelectionContainer as HTMLDivElement;
                }
                // add all the other containers to the div array
                else {
                    unselectedLinesSelectionContainers.push(lineSelectionContainer as HTMLDivElement);
                }
            }
        }

        // check if there is a container for our target line
        if (targetLineSelectionContainer === null) {
            console.warn(`The line selection container for the ${lineName} does not exist`);
            return;
        }

        // add the logic for our available input form
        this.initAvailableLineSelectionContainer(targetLineSelectionContainer, stations);
        // configure the logic for our unavailable input forms
        this.initUnavailableLineSelectionContainers(unselectedLinesSelectionContainers, targetLineSelectionContainer);
    }

    // provide the event listener and callback logic of the input form and selections list in the target container
    private initAvailableLineSelectionContainer(
        targetLineSelectionContainer: HTMLDivElement, 
        stations: {
            name: string, 
            id: number, 
            station_order: number,
            lines: string[],
            diagram_path: string
        }[]): void {

        const inputForm: HTMLInputElement | null = targetLineSelectionContainer.querySelector("input");
        const stationsList: HTMLOListElement | null = targetLineSelectionContainer.querySelector("ol");

        // check if either the input form or the ordered list item doesn't exist
        if (inputForm === null || stationsList === null) {
            console.warn(
                "Input form or the ordered list doesn't exist.",
                `Input form: ${inputForm}; Ordered List ${stationsList}`
            );
            return;
        }

        // create another array to hold all the button elements we will create and add to to our ordered list
        const stationListButtons: HTMLButtonElement[] = [];

        // create our buttons and add even listeners for each one
        for (const station of stations) {
            const button: HTMLButtonElement = document.createElement("button");
            button.innerHTML = station.name;
            button.value = station.name;
            stationsList.append(button);
            stationListButtons.push(button);

            button.addEventListener("click", () => {
                const currentURL: string = URLHandler.getFullURLRoute();
                const stationSlug: string = this.slugifier.slugify(station.name, station.id);
                window.location.href = currentURL + stationSlug + "/map/";
            });
        }

        // configure the logic for the input form (matching user input)
        inputForm.addEventListener("input", () => {
            // create a regexp that tests whether any string matches with the current input form value (case insensitive)
            const userInputRegex: RegExp = new RegExp(`${inputForm.value}`, "i");
            // iterate through each button amd check whether the user input value matches with their value
            for (const button of stationListButtons) {
                // if it doesn't have the value, add a class to make it "hidden" from the container (CSS will handle it)
                if (!userInputRegex.test(button.value)) {
                    button.classList.add("hidden");
                }
                else {
                    button.classList.remove("hidden");
                }
            }
        });
    }

    // provide the logic for the unavailable line selection containers (basically remove them)
    private initUnavailableLineSelectionContainers(
        unselectedLinesSelectionContainers: HTMLDivElement[],
        targetLineSelectionContainer: HTMLDivElement
        ): void {

        // fetch the color line group container that the target line belongs in 
        // this will be used for the deletion logic of the unused lines and their color line groups
        const targetLineColorGroup: HTMLDivElement | null = targetLineSelectionContainer.parentElement as HTMLDivElement;
        if (targetLineColorGroup === null) {
            console.warn("The targetLineSelectionContainer has no parent");
            return;
        }
        
        // iterate through each selection container that isn't used
        unselectedLinesSelectionContainers.forEach((container: HTMLDivElement | null) => {
            // since we're deleting the color line groups, the container itself might evaluate to null long before 
            // the .forEach() iterator gets to it; as such check for that
            if (container !== null) {
                // get the parent (color line group) element
                const currentLineColorGroup: HTMLDivElement | null = container.parentElement as HTMLDivElement;

                // delete the parent if it isn't the target line color group
                if (currentLineColorGroup !== null && currentLineColorGroup !== targetLineColorGroup) {
                    currentLineColorGroup.remove();
                }
                // if the parent is in the same color group, just delete the container
                else {
                    container.remove();
                }
            }
        });
    }



    // create the DOM button that actuall triggers redirection to the next page
    private initSubmitButton(): void {
        const submitButton: HTMLElement | null = document.getElementById("submission_button");

        if (submitButton !== null) {
            submitButton.addEventListener("click", () => {
                URLHandler.redirectTo("/full_path", `${URLHandler.getQueryParametersURL()}`);
            });
        }
    }
}