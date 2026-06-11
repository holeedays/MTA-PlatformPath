import { DataFetch } from "./data_fetch.ts";
import { PathFinder } from "./path_finder.ts";

const df: DataFetch = new DataFetch();
const lines: string[] = ["D"];
const stations: string[] = ["Bay 50 St"];

const linesFetchApiURL = "platformpathAPI/fetchLines";
const stationsFetchApiURL = "platformpathAPI/fetchStations";
const edgeNodesFetchApiURL = "platformPathAPI/fetchEdgesNodes";

const linesFetchResult: any = await df.fetchLines(linesFetchApiURL);
const stationsFetchResult: any = await df.fetchStations(lines, stationsFetchApiURL);
const edgeNodesFetchResult: any = await df.fetchEdgesNodes(stations, edgeNodesFetchApiURL);

// setting it up like this because console logging text inline with the json objects 
// does not allow an expandable view of the object (it just returns object[object])
console.log("These are all available MTA lines currently:");
console.log(linesFetchResult);
console.log("These are all available stations for the D:");
console.log(stationsFetchResult);
console.log("These are edges and nodes pulled for Bay 50 St:");
console.log(edgeNodesFetchResult);

enum URLS {
    LINES_FETCH_API = "platformpathAPI/fetchLines",
    STATIONS_FETCH_API = "platformpathAPI/fetchStations",
    EDGES_NODES_FETCH_API = "platformPathAPI/fetchEdgesNodes"
}

class App {
    public stationCache: any;
    public dataFetcher: DataFetch;

    constructor() {
        this.stationCache = {};
        this.dataFetcher = new DataFetch();
    }

    public init(): void {
        switch(this.getCurrentWorkingURLRoute()) {
            case "lines_selection":
                console.log("We're currently selecting a line...");
                this.initLineButtons();
                break;
            case "stations_selection":
                break;
        }
    }

    // create the DOM line buttons for the start page
    private async initLineButtons(): Promise<void> {
        // get our div that will contain our buttons
        const lineButtonsContainer: HTMLElement | null = document.getElementById("line_buttons_container");
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
            lines.forEach((line: Record<string,string>) => {
                const lineButton: HTMLElement = document.createElement("button");
                lineButton.textContent = line.name ?? "";
                lineButton.addEventListener("click", this.directToStationSelection);
                lineButtonsContainer.appendChild(lineButton);
            });
        }
    }

    // direct to station selection
    private directToStationSelection() {
        window.location.href = "/test/stations_selection";
    }

    // get the current working URL path; e.g. https//:thisWebsite/thisPage1/thisPage2 <-- returns thisPage2
    private getCurrentWorkingURLRoute(): string | null {
        const fullURL: string = document.URL;
        const URLSubstrings: string[] = fullURL.split("/");
        const currentURLRoute: string | undefined = URLSubstrings[URLSubstrings.length - 1];
        
        return currentURLRoute === undefined ? null : currentURLRoute;
    }
}

const app = new App();
app.init();
