import { DataFetch } from "./data_fetch.ts";
import { URLHandler } from "./url_handler.ts";
import { LinesSelectionPage } from "./z_lines_selection_page.ts";
import { StationsSelectionPage } from "./z_stations_selection_page.ts";
import { PathFinder } from "./path_finder.ts";

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

enum URLS {
    LINES_FETCH_API = "platformpathAPI/fetchLines",
    STATIONS_FETCH_API = "platformpathAPI/fetchStations",
    EDGES_NODES_FETCH_API = "platformPathAPI/fetchEdgesNodes"
}

class App {
    public stationCache: any;
    public linesSelectionPage: LinesSelectionPage;
    public stationsSelectionPage: StationsSelectionPage;

    constructor() {
        this.stationCache = {};
        this.linesSelectionPage = new LinesSelectionPage();
        this.stationsSelectionPage = new StationsSelectionPage();
    }

    public async init(): Promise<void> {
        switch(URLHandler.getCurrentWorkingURLRoute()) {
            case "lines_selection":
                this.linesSelectionPage.init();
                break;
            case "stations_selection":
                // const url: URL = new URL(document.URL);
                // url.searchParams.forEach((v: string, k: string, p: URLSearchParams) => console.log(k, v));
                this.stationsSelectionPage.init();
                break;
        }
    }
}

const app = new App();
app.init();
