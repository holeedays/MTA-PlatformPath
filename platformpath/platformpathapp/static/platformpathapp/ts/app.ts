import { LinesSelectionPage } from "./lines_selection_page.ts";
import { StationsSelectionPage } from "./stations_selection_page.ts";
import { StationMapPage } from "./station_map_page.ts";
import { StationMapPageMobile } from "./station_map_page_mobile.ts";
import { URLHandler } from "./url_handler.ts";
import { GeoConverterTestPage } from "./geolocation.ts";

// this is the script that actually runs the other pages
class App {
    // discover routes pages
    public linesSelectionPage: LinesSelectionPage | null = null;
    public stationsSelectionPage: StationsSelectionPage | null = null;
    public stationMapPage: StationMapPage | null = null;
    public stationMapPageMobile: StationMapPageMobile | null = null;

    // test routes pages
    public geoConverterTestPage: GeoConverterTestPage | null = null;

    constructor() {
    }

    // checks which page should be initialized and initializes it
    public init(): void {
        switch (URLHandler.getDirectiveURLRoute()) {
            // choose discover routes here
            case "discover":
                this.initDiscoverRoutes();
                break;
            // choose test routes here
            case "test":
                this.initTestRoutes();
                break;
        }
    }

    // determines which page on the discover route we'll be setting up and initializes it
    public initDiscoverRoutes(): void {
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

    // determines which page on the discover route we'll be setting up and initializes it
    public initTestRoutes(): void {
        switch(URLHandler.getCurrentWorkingURLRoute()) {
            case "geolocation":
                this.geoConverterTestPage = new GeoConverterTestPage();
                this.geoConverterTestPage.init();
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
