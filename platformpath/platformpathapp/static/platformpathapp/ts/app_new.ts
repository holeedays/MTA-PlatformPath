import { DataFetch } from "./data_fetch.ts";
import { URLHandler } from "./url_handler.ts";
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

    constructor() {
        this.stationCache = {};
    }

    public async init(): Promise<void> {
        switch(URLHandler.getCurrentWorkingURLRoute()) {
            case "lines_selection":
                console.log("We're currently selecting a line...");
                URLHandler.clearAllQueryParameters();
                await this.initLineButtons();
                this.initSubmitButton();
                break;
            case "stations_selection":
                const url: URL = new URL(document.URL);
                url.searchParams.forEach((v: string, k: string, p: URLSearchParams) => console.log(k, v));
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
        const lines = await DataFetch.fetchLines(URLS.LINES_FETCH_API);
        if (lines === null) {
            return;
        }
        else {
            lines.forEach((line: Record<string,string>) => {
                const lineButton: HTMLElement = document.createElement("button");
                lineButton.textContent = line.name ?? "";

                // aria_label tells us the current state of the button
                lineButton.setAttribute("aria_label", "not_clicked");
                // add an onclick function to our event listener
                lineButton.addEventListener("click", () => {
                    const ariaLabelValue: string | null = lineButton.getAttribute("aria_label");

                    // if button hasn't been clicked
                    if (ariaLabelValue !== null && ariaLabelValue === "not_clicked") {
                        URLHandler.addQueryParameter("selected_line", lineButton.textContent);
                        lineButton.classList.add("selected");
                        lineButton.setAttribute("aria_label", "clicked");
                    }
                    // if button has been clicked
                    else {
                        URLHandler.removeQueryParameter("selected_line", lineButton.textContent);
                        lineButton.classList.remove("selected");
                        lineButton.setAttribute("aria_label", "not_clicked");
                    }
                });
                lineButtonsContainer.appendChild(lineButton);
            });

            ////////////////////////////////// just testing with a psuedo station
            const lineButton: HTMLElement = document.createElement("button");
            lineButton.textContent = "N";
            lineButton.setAttribute("aria_label", "not_clicked");
            lineButton.addEventListener("click", () => {
                const ariaLabelValue: string | null = lineButton.getAttribute("aria_label");

                // if button hasn't been clicked
                if (ariaLabelValue !== null && ariaLabelValue === "not_clicked") {
                    URLHandler.addQueryParameter("selected_line", lineButton.textContent);
                    lineButton.classList.add("selected");
                    lineButton.setAttribute("aria_label", "clicked");
                }
                // if button has been clicked
                else {
                    URLHandler.removeQueryParameter("selected_line", lineButton.textContent);
                    lineButton.classList.remove("selected");
                    lineButton.setAttribute("aria_label", "not_clicked");
                }
            });
            lineButtonsContainer.appendChild(lineButton);
        }
    }

    // create the DOM button that actuall triggers redirection to the next page
    private initSubmitButton(): void {
        const submitButton: HTMLElement | null = document.getElementById("submission_button");

        if (submitButton !== null) {
            submitButton.addEventListener("click", () => {
                URLHandler.redirectTo("/test/stations_selection", `${URLHandler.getQueryParameters()}`);
            });
        }
    }
}

const app = new App();
app.init();
