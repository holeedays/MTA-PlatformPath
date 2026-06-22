import { DataFetch } from "./data_fetch.js";
import { URLHandler } from "./url_handler.js";
import { LinesSelectionPage } from "./z_lines_selection_page.js";
import { StationsSelectionPage } from "./z_stations_selection_page.js";
import { PathFinder } from "./path_finder.js";
class App {
    stationCache;
    linesSelectionPage;
    stationsSelectionPage;
    constructor() {
        this.stationCache = {};
        this.linesSelectionPage = new LinesSelectionPage();
        this.stationsSelectionPage = new StationsSelectionPage();
    }
    async init() {
        // switch(URLHandler.getCurrentWorkingURLRoute()) {
        //     case "lines_selection":
        //         this.linesSelectionPage.init();
        //         break;
        //     case "stations_selection":
        //         // const url: URL = new URL(document.URL);
        //         // url.searchParams.forEach((v: string, k: string, p: URLSearchParams) => console.log(k, v));
        //         this.stationsSelectionPage.init();
        //         break;
        // }
        const lines = await DataFetch.fetchLinesNew();
        const stations = await DataFetch.fetchStationsNew(lines[0].name);
        const targetLine = lines[0].name;
        const targetStation = stations[1].name;
        // this don't work right now
        const edgesNodes = await DataFetch.fetchEdgesNodesNew(targetLine, targetStation);
        console.log(edgesNodes);
    }
}
const app = new App();
app.init();
//# sourceMappingURL=app_new.js.map