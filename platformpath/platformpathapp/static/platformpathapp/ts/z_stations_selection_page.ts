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
            const stationsSelectionContainer: HTMLElement | null = document.getElementById("stations_selection_container");

            if (stationsSelectionContainer === null)
                throw Error("The station selection container div doesn't exist");

            // iterating through each line
            for (const line in stationsData) { 
                // create a parent div to house all the forms we'll be creating
                const formContainer: HTMLElement = document.createElement("div");
                formContainer.innerHTML = line;
                // this create a select dropdown form while allowing user typing as well     
                const datalistForm: HTMLDataListElement = document.createElement("datalist");
                datalistForm.setAttribute("id", `dropdown_for_${line}`);
                const inputForm: HTMLInputElement = document.createElement("input");
                inputForm.setAttribute("list", `dropdown_for_${line}`);

                // save the previous value to remove query params (if the user were to remove them)
                let previous_value: string = "";

                inputForm.addEventListener("change", () => {
                    // if an option was selected or form was filled
                    if (inputForm.value !== "") {
                        // check if the value put in the input form exists within the datalist
                        // this is only used in the cases where the user types a value instead of checking an option
                        let isValidValue: boolean = false;

                        for (const option of datalistForm.options) {
                            if (inputForm.value === option.value) {
                                URLHandler.addQueryParameter("selected_station", inputForm.value);
                                isValidValue = true;
                            }
                        }

                        if (!isValidValue) 
                            inputForm.value = "";
                    }
                    else { // if inputForm is empty
                        //check if query param exists
                        const allQueryParams: Record<string,string[]> = URLHandler.getQueryParameters();
                        if (allQueryParams["selected_station"] !== undefined) {
                            for (const queryParam of allQueryParams["selected_station"]) {
                                if (queryParam === previous_value) {
                                    URLHandler.removeQueryParameter("selected_station", previous_value);
                                    break;
                                }
                            }
                        }
                    }

                    previous_value = inputForm.value;
                });

                // create all the dropdown options of available stations
                stationsData[line]?.forEach((stationObj: any) => {
                    const option: HTMLElement = document.createElement("option");
                    option.setAttribute("value", stationObj.name);
                    option.textContent = stationObj.name;
                    datalistForm.appendChild(option);
                });

                // configure all these items so they are grouped up properly in the html
                formContainer.append(datalistForm, inputForm);
                stationsSelectionContainer.appendChild(formContainer);
            }
        }
        catch (err: any) {
            console.warn(err);
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