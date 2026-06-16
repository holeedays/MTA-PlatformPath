import { DataFetch } from "./data_fetch.js";
import { URLHandler } from "./url_handler.js";
import { URLS } from "./statics.js";
// this class will handle the stations selections route
export class StationsSelectionPage {
    constructor() {
    }
    // this is the function we'll run on app.ts
    async init() {
        console.log("Now we're selecting stations...");
        // clear query params with the key "selected_station" (if page refresh)
        URLHandler.removeQueryParameter("selected_station");
        // initiate dropdown elements
        await this.initDropdownElements();
        // initiate the submit button after everything is created
        this.initSubmitButton();
    }
    // add our selection elements corresponding to each subway line selected
    async initDropdownElements() {
        const lines = [];
        const allQueryParams = URLHandler.getQueryParameters();
        if (allQueryParams["selected_line"] !== undefined) {
            allQueryParams["selected_line"].forEach((line) => {
                lines.push(line);
            });
        }
        // might store this in app later...
        // fetching data for each line
        const stationsData = await DataFetch.fetchStations(lines, URLS.STATIONS_FETCH_API);
        try {
            const stationsSelectionContainer = document.getElementById("stations_selection_container");
            if (stationsSelectionContainer === null)
                throw Error("The station selection container div doesn't exist");
            // iterating through each line
            for (const line in stationsData) {
                // this create a select dropdown form while allowing user typing as well     
                const datalistForm = document.createElement("datalist");
                datalistForm.setAttribute("id", `dropdown_for_${line}`);
                const inputForm = document.createElement("input");
                inputForm.setAttribute("list", `dropdown_for_${line}`);
                // save the previous value to remove query params (if the user were to remove them)
                let previous_value = "";
                inputForm.addEventListener("change", () => {
                    // if an option was selected or form was filled
                    if (inputForm.value !== "") {
                        // check if the value put in the input form exists within the datalist
                        // this is only used in the cases where the user types a value instead of checking an option
                        let isValidValue = false;
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
                        const allQueryParams = URLHandler.getQueryParameters();
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
                stationsSelectionContainer.append(datalistForm, inputForm);
                stationsData[line]?.forEach((stationObj) => {
                    const option = document.createElement("option");
                    option.setAttribute("value", stationObj.name);
                    option.textContent = stationObj.name;
                    datalistForm.appendChild(option);
                });
            }
        }
        catch (err) {
            console.warn(err);
        }
    }
    // create the DOM button that actuall triggers redirection to the next page
    initSubmitButton() {
        const submitButton = document.getElementById("submission_button");
        if (submitButton !== null) {
            submitButton.addEventListener("click", () => {
                URLHandler.redirectTo("/full_path", `${URLHandler.getQueryParametersURL()}`);
            });
        }
    }
}
//# sourceMappingURL=z_stations_selection_page.js.map