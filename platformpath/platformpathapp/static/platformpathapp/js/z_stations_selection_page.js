import { DataFetch } from "./data_fetch.js";
import { URLHandler } from "./url_handler.js";
import { URLS } from "./statics.js";
// this class will handle the stations selections route
class StationsSelectionPage {
    constructor() {
    }
    // this is the function we'll run on app.ts
    async init() {
        await this.initSelectionElements();
    }
    // add our selection elements corresponding to each subway line selected
    async initSelectionElements() {
        // DataFetch.fetchStations();
    }
}
//# sourceMappingURL=z_stations_selection_page.js.map