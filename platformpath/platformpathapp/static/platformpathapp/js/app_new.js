import { DataFetch } from "./data_fetch.js";
import { URLHandler } from "./url_handler.js";
import { LinesSelectionPage } from "./z_lines_selection_page.js";
import { PathFinder } from "./path_finder.js";
// const df: DataFetch = new DataFetch();
// const lines: string[] = ["D"];
// const stations: string[] = ["Bay 50 St"];
// const tempPrefix: string = "/test/";
// const linesFetchApiURL = tempPrefix + "platformpathAPI/fetchLines";
// const stationsFetchApiURL = tempPrefix + "platformpathAPI/fetchStations";
// const edgeNodesFetchApiURL = tempPrefix +"platformPathAPI/fetchEdgesNodes";
// const linesFetchResult: any = await df.fetchLines(linesFetchApiURL);
// const stationsFetchResult: any = await df.fetchStations(lines, stationsFetchApiURL);
// const edgeNodesFetchResult: any = await df.fetchEdgesNodes(stations, edgeNodesFetchApiURL);
// setting it up like this because console logging text inline with the json objects 
// does not allow an expandable view of the object (it just returns object[object])
// console.log("These are all available MTA lines currently:");
// console.log(linesFetchResult);
// console.log("These are all available stations for the D:");
// console.log(stationsFetchResult);
// console.log("These are edges and nodes pulled for Bay 50 St:");
// console.log(edgeNodesFetchResult); 
var URLS;
(function (URLS) {
    URLS["LINES_FETCH_API"] = "platformpathAPI/fetchLines";
    URLS["STATIONS_FETCH_API"] = "platformpathAPI/fetchStations";
    URLS["EDGES_NODES_FETCH_API"] = "platformPathAPI/fetchEdgesNodes";
})(URLS || (URLS = {}));
class App {
    stationCache;
    linesSelectionPage;
    constructor() {
        this.stationCache = {};
        this.linesSelectionPage = new LinesSelectionPage();
    }
    async init() {
        switch (URLHandler.getCurrentWorkingURLRoute()) {
            case "lines_selection":
                this.linesSelectionPage.init();
                break;
            case "stations_selection":
                const url = new URL(document.URL);
                url.searchParams.forEach((v, k, p) => console.log(k, v));
                break;
        }
    }
}
const app = new App();
app.init();
//# sourceMappingURL=app_new.js.map