import { DataFetch } from "./data_fetch.js";
import { URLHandler } from "./url_handler.js";
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
    constructor() {
        this.stationCache = {};
    }
    async init() {
        switch (URLHandler.getCurrentWorkingURLRoute()) {
            case "lines_selection":
                console.log("We're currently selecting a line...");
                URLHandler.clearAllQueryParameters();
                await this.initLineButtons();
                this.initSubmitButton();
                break;
            case "stations_selection":
                const url = new URL(document.URL);
                url.searchParams.forEach((v, k, p) => console.log(k, v));
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
        const lines = await DataFetch.fetchLines(URLS.LINES_FETCH_API);
        if (lines === null) {
            return;
        }
        else {
            lines.forEach((line) => {
                const lineButton = document.createElement("button");
                lineButton.textContent = line.name ?? "";
                // aria_label tells us the current state of the button
                lineButton.setAttribute("aria_label", "not_clicked");
                // add an onclick function to our event listener
                lineButton.addEventListener("click", () => {
                    const ariaLabelValue = lineButton.getAttribute("aria_label");
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
            const lineButton = document.createElement("button");
            lineButton.textContent = "N";
            lineButton.setAttribute("aria_label", "not_clicked");
            lineButton.addEventListener("click", () => {
                const ariaLabelValue = lineButton.getAttribute("aria_label");
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
    initSubmitButton() {
        const submitButton = document.getElementById("submission_button");
        if (submitButton !== null) {
            submitButton.addEventListener("click", () => {
                URLHandler.redirectTo("/test/stations_selection", `${URLHandler.getQueryParameters()}`);
            });
        }
    }
}
const app = new App();
app.init();
//# sourceMappingURL=app_new.js.map