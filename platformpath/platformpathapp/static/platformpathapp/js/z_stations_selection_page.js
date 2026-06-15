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
        await this.initSelectionElements();
    }
    // add our selection elements corresponding to each subway line selected
    async initSelectionElements() {
        const lines = [];
        URLHandler.getQueryParameters().forEach((pair) => {
            const line = pair["selected_line"];
            if (line !== undefined)
                lines.push(line);
        });
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
                stationsSelectionContainer.append(datalistForm, inputForm);
                stationsData[line]?.forEach((stationObj) => {
                    const option = document.createElement("option");
                    option.setAttribute("value", stationObj.name);
                    option.textContent = stationObj.name;
                    datalistForm.appendChild(option);
                    console.log(stationObj);
                });
            }
        }
        catch (err) {
            console.warn(err);
        }
    }
}
//# sourceMappingURL=z_stations_selection_page.js.map