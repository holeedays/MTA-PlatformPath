import { DataFetch } from "./data_fetch.js";
import { PathFinder } from "./path_finder.js";
const df = new DataFetch();
const lines = ["D"];
const stations = ["Bay 50 St"];
const linesFetchApiURL = "platformpathAPI/fetchLines";
const stationsFetchApiURL = "platformpathAPI/fetchStations";
const edgeNodesFetchApiURL = "platformPathAPI/fetchEdgesNodes";
const linesFetchResult = await df.fetchLines(linesFetchApiURL);
const stationsFetchResult = await df.fetchStations(lines, stationsFetchApiURL);
const edgeNodesFetchResult = await df.fetchEdgesNodes(stations, edgeNodesFetchApiURL);
// setting it up like this because console logging text inline with the json objects 
// does not allow an expandable view of the object (it just returns object[object])
console.log("These are all available MTA lines currently:");
console.log(linesFetchResult);
console.log("These are all available stations for the D:");
console.log(stationsFetchResult);
console.log("These are edges and nodes pulled for Bay 50 St:");
console.log(edgeNodesFetchResult);
var URLS;
(function (URLS) {
    URLS["LINES_FETCH_API"] = "platformpathAPI/fetchLines";
    URLS["STATIONS_FETCH_API"] = "platformpathAPI/fetchStations";
    URLS["EDGES_NODES_FETCH_API"] = "platformPathAPI/fetchEdgesNodes";
})(URLS || (URLS = {}));
class App {
    stationCache;
    dataFetcher;
    constructor() {
        this.stationCache = {};
        this.dataFetcher = new DataFetch();
    }
    init() {
        switch (this.getCurrentWorkingURLRoute()) {
            case "lines_selection":
                console.log("We're currently selecting a line...");
                this.initLineButtons();
                break;
            case "stations_selection":
                break;
        }
    }
    // create the DOM line buttons for the start page
    async initLineButtons() {
        // get our div that will contain our buttons
        const lineButtonsContainer = document.getElementById("line_buttons_container");
        if (lineButtonsContainer === null) {
            console.warn("There is no container to hold the subway line buttons");
            return;
        }
        // then fetch our lines
        const lines = await this.dataFetcher.fetchLines(URLS.LINES_FETCH_API);
        if (lines === null) {
            return;
        }
        else {
            lines.forEach((line) => {
                const lineButton = document.createElement("button");
                lineButton.textContent = line.name ?? "";
                lineButton.addEventListener("click", this.directToStationSelection);
                lineButtonsContainer.appendChild(lineButton);
            });
        }
    }
    // direct to station selection
    directToStationSelection() {
        window.location.href = "/test/stations_selection";
    }
    // get the current working URL path; e.g. https//:thisWebsite/thisPage1/thisPage2 <-- returns thisPage2
    getCurrentWorkingURLRoute() {
        const fullURL = document.URL;
        const URLSubstrings = fullURL.split("/");
        const currentURLRoute = URLSubstrings[URLSubstrings.length - 1];
        return currentURLRoute === undefined ? null : currentURLRoute;
    }
}
const app = new App();
app.init();
//# sourceMappingURL=app_new.js.map