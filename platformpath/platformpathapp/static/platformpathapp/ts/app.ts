import { DataFetch } from "./data_fetch.ts";
import { LinesSelectionPage } from "./lines_selection_page.ts";
import { StationsSelectionPage } from "./stations_selection_page.ts";
import { StationMapPage } from "./station_map_page.ts";
import { StationMapPageMobile } from "./station_map_page_mobile.ts";
import { URLHandler } from "./url_handler.ts";

class App {
    public stationCache: any;
    public linesSelectionPage: LinesSelectionPage | null;
    public stationsSelectionPage: StationsSelectionPage | null;
    public stationMapPage: StationMapPage | null;
    public stationMapPageMobile: StationMapPageMobile | null;

    constructor() {
        this.stationCache = {};
        this.linesSelectionPage = null;
        this.stationsSelectionPage = null;
        this.stationMapPage = null;
        this.stationMapPageMobile = null;
    }

    public async init(): Promise<void> {
        switch(URLHandler.getCurrentWorkingURLRoute()) {
            case "lines":
                this.linesSelectionPage = new LinesSelectionPage();
                this.linesSelectionPage.init();
                break;
            case "stations":
                this.stationsSelectionPage = new StationsSelectionPage();
                this.stationsSelectionPage.init();
                break;
            case "map":
                // determine the layout first then initialize the corresponding station map page
                if (this.isMobileLayout()) {
                    console.log("Displaying the mobile version of the station map page");
                    this.stationMapPageMobile = new StationMapPageMobile();
                    this.stationMapPageMobile.init();
                }
                else {
                    console.log("Displaying the desktop version of the station map page");
                    this.stationMapPage = new StationMapPage();
                    this.stationMapPage.init();
                }
                break;
        }
    }

    // NOTE: ONLY FOR THE STATION MAP PAGE & MOBILE PAGE
    // determines if the current template is mobile or not
    private isMobileLayout(): boolean {
        const isMobile: string | null = document.body.getAttribute("data-is-mobile");
        if (isMobile === null) {
            console.warn("The attribute 'data-is-mobile' doesn't exist on the html body");
            return false;
        }
        return isMobile === "true"? true: false;
    }
}

const app = new App();
app.init();
