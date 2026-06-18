import { DataFetch } from "./data_fetch.ts";
import { URLHandler } from "./url_handler.ts";
import { URLS } from "./statics.ts";

// this class will handle the stations selections route
export class StationsSelectionPage {
    constructor() {
    }

    // this is the function we'll run on app.ts
    public async init(): Promise<void> {
        console.log("Now we're selecting stations...");

        // clear query params with the key "selected_station" (if page refresh)
        URLHandler.removeQueryParameter("selected_station");
        // initiate dropdown elements
        await this.initDropdownElements();
        // initiate the submit button after everything is created
        this.initSubmitButton();
    }

    // add our selection elements corresponding to each subway line selected
    private async initDropdownElements(): Promise<void> {
        const lines: string[] = [];
        const allQueryParams: Record<string,string[]> = URLHandler.getQueryParameters();
        if (allQueryParams["selected_line"] !== undefined) {
            allQueryParams["selected_line"].forEach((line: string) => {
                lines.push(line)
            });
        }

        // might store this in app later...
        // fetching data for each line
        const stationsData: {[key: string]: any[]} = await DataFetch.fetchStations(lines, URLS.STATIONS_FETCH_API);

        try {
            // initiate the logic for the input forms of the lines the users selected
            this.initSelectedLinesInputForms(stationsData);
            // initiate the logic for the input forms of the lines the users did not select (remove them basically)
            this.initUnselectedLinesInputForms(stationsData);
        }
        catch (err: any) {
            console.warn(err);
        }
    }

    // render the logic for the input form html elements for the lines that are available (available station options, etc)
    private initSelectedLinesInputForms(stationsData: {[key: string]: any[]}): void {
        // iterate through each line object in the data we fetched
        for (const line in stationsData) {
            // access the following DOM elements in our template
            const lineContainer: HTMLElement | null = document.getElementById(`${line}_line_container`);
            const inputForm: HTMLInputElement | null | undefined = lineContainer?.querySelector("input");
            const dataList: HTMLDataListElement | null | undefined = lineContainer?.querySelector("datalist");

            // make sure they exist
            if (inputForm === undefined || inputForm === null || dataList === undefined || dataList === null)
                throw new Error(`Input form status: ${inputForm}. DataList status: ${dataList}`);

            // set all the available options for each station
            stationsData[line]?.forEach((stationObj: any) => {
                const option: HTMLElement = document.createElement("option");
                option.setAttribute("value", stationObj.name);
                option.textContent = stationObj.name;
                dataList.appendChild(option);
            });

            // add additional logic to input form to prevent users for filling answers that don't exist
            inputForm.addEventListener("change", () => {
                // if an option was selected or form was filled
                if (inputForm.value !== "") {
                    // check if the value put in the input form exists within the datalist
                    // this is only used in the cases where the user types a value instead of checking an option
                    let isValidValue: boolean = false;

                    for (const option of dataList.options) {
                        if (inputForm.value === option.value) {
                            URLHandler.addQueryParameter("selected_station", inputForm.value);
                            isValidValue = true;
                        }
                    }

                    if (!isValidValue) 
                        inputForm.value = "";
                }
            });
        }
    }

    // remove the line input forms the users didn't select
    private initUnselectedLinesInputForms(stationsData: {[key: string]: any[]}): void {
        // deal with the other subway line containers that aren't in use (since the template has all lines)
        // get parent container of all lines 
        const stationsSelectionContainer: HTMLElement | null = document.getElementById("stations_selection_container");
        if (stationsSelectionContainer === null)
            throw new Error("The parent stations_selection_container div doesn't exist");

        // get the div elements holding the lines (organized by color)
        for (const subwayLineGroups of stationsSelectionContainer.children) {
            // iterate thru this div element to get each individual line (we're deleting those that are not in use)

            // make a shallow copy to prevent elements to prevent elements from being skipped since we're deleting elements
            // unlike python... js/ts actually bases for..of loops based on indices hence the need to track the position
            for (const subwayLine of [...subwayLineGroups.children]) {
                if (subwayLine.id[0] !== undefined && !(subwayLine.id[0] in stationsData))
                    subwayLine.remove();
            }
        }
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