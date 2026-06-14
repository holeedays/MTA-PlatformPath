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
        // DataFetch.fetchStations();
    }

}