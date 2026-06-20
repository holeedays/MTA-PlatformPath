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
            // initiate the logic for the input forms of the lines the users selected
            this.initSelectedLinesInputForms(stationsData);
            // initiate the logic for the input forms of the lines the users did not select (remove them basically)
            this.initUnselectedLinesInputForms(stationsData);
        }
        catch (err) {
            console.warn(err);
        }
    }
    // render the logic for the input form html elements for the lines that are available (available station options, etc)
    initSelectedLinesInputForms(stationsData) {
        // iterate through each line object in the data we fetched
        for (const line in stationsData) {
            // access the following DOM elements in our template
            const inputContainer = document.getElementById(`${line}_input_container`);
            const inputForm = inputContainer?.querySelector("input");
            const dataList = inputContainer?.querySelector("datalist");
            // make sure they exist
            if (inputForm === undefined || inputForm === null || dataList === undefined || dataList === null)
                throw new Error(`Input form status: ${inputForm}. DataList status: ${dataList}`);
            // create the options (stations) for our data list
            this.createOptions(stationsData, line, dataList);
            // configure the callback logic of input form for this subway line
            this.configureInputFormLogic(inputForm, line, dataList);
        }
    }
    // create the options for the data list based off the current line selected
    createOptions(stationsData, line, dataList) {
        // set all the available options for each station
        stationsData[line]?.forEach((stationObj) => {
            const option = document.createElement("option");
            option.setAttribute("value", stationObj.name);
            // we need this for the actual text to be visible to the user
            option.textContent = stationObj.name;
            dataList.appendChild(option);
        });
    }
    // create the callback logic for our input form (of the specified line) when a value is filled in
    configureInputFormLogic(inputForm, line, dataList) {
        // get our container for selected options
        const selectedOptionsContainer = document.getElementById(`${line}_selected_options_container`);
        if (selectedOptionsContainer === undefined || selectedOptionsContainer === null)
            throw new Error(`Selected stations container for ${line} line doesn't exist`);
        // again we use a hashmap/set to track which options we have selected to avoid repeats
        const usedOptions = new Set();
        // create the event listener for our input form
        // we'll use oninput vs onchange since oninput occurs everytime the value is changed while onchange only occurs when focus
        // is lost...
        inputForm.addEventListener("input", () => {
            for (const option of dataList.options) {
                // if the input is a valid station
                if (inputForm.value === option.value && !usedOptions.has(option.value)) {
                    usedOptions.add(option.value);
                    // create a label-like container and create all the necessary children for it
                    const selectedOptionContainer = document.createElement("div");
                    const selectedOptionText = document.createElement("div");
                    const deleteStationButton = document.createElement("button");
                    const deleteButtonImage = document.createElement("img");
                    selectedOptionContainer.classList.add("selected_option_container");
                    selectedOptionText.classList.add("selected_option_text");
                    deleteStationButton.classList.add("delete_button");
                    deleteButtonImage.src = "/static/platformpathapp/decals/delete_button_logo.svg"; // to be filled...
                    selectedOptionText.innerHTML = option.value;
                    deleteStationButton.addEventListener("click", () => {
                        // delete the item in our hashmap/set
                        usedOptions.delete(option.value);
                        // remove the selected options container
                        selectedOptionContainer.remove();
                        // remove it from our query params
                        URLHandler.removeQueryParameter("selected_station", option.value + `_${line}`);
                    });
                    deleteStationButton.appendChild(deleteButtonImage);
                    selectedOptionContainer.append(selectedOptionText, deleteStationButton);
                    selectedOptionsContainer.appendChild(selectedOptionContainer);
                    // add it to our query params
                    URLHandler.addQueryParameter("selected_station", option.value + `_${line}`);
                    // remove the current text in our input form
                    inputForm.value = "";
                }
            }
        });
    }
    // remove the line input forms the users didn't select
    initUnselectedLinesInputForms(stationsData) {
        // deal with the other subway line containers that aren't in use (since the template has all lines)
        // get parent container of all lines 
        const stationsSelectionContainer = document.getElementById("stations_selection_container");
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