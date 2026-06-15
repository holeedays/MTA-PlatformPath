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

        await this.initSelectionElements();
    }

    // add our selection elements corresponding to each subway line selected
    private async initSelectionElements(): Promise<void> {
        const lines: string[] = [];
        URLHandler.getQueryParameters().forEach((pair: Record<string,string>) => {
            const line: string | undefined = pair["selected_line"];
            if (line !== undefined)
                lines.push(line);
        });

        // might store this in app later...
        // fetching data for each line
        const stationsData: {[key: string]: any[]} = await DataFetch.fetchStations(lines, URLS.STATIONS_FETCH_API);

        try {
             const stationsSelectionContainer: HTMLElement | null = document.getElementById("stations_selection_container");

            if (stationsSelectionContainer === null)
                throw Error("The station selection container div doesn't exist");

            // iterating through each line
            for (const line in stationsData) { 
                // this create a select dropdown form while allowing user typing as well     
                const datalistForm: HTMLElement = document.createElement("datalist");
                datalistForm.setAttribute("id", `dropdown_for_${line}`);
                const inputForm: HTMLElement = document.createElement("input");
                inputForm.setAttribute("list", `dropdown_for_${line}`);

                stationsSelectionContainer.append(datalistForm, inputForm);

                stationsData[line]?.forEach((stationObj: any) => {
                    const option: HTMLElement = document.createElement("option");
                    option.setAttribute("value", stationObj.name);
                    option.textContent = stationObj.name;
                    datalistForm.appendChild(option);

                    console.log(stationObj);
                });
            }
        }
        catch (err: any) {
            console.warn(err);
        }
    }

}