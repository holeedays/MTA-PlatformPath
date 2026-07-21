import { DataFetch } from "./data_fetch.ts";
import { LinesSelectionPage } from "./lines_selection_page.ts";
import { StationsSelectionPage } from "./stations_selection_page.ts";
import { StationMapPage } from "./station_map_page.ts";
import { URLHandler } from "./url_handler.ts";

class App {
    public stationCache: any;
    public linesSelectionPage: LinesSelectionPage | null;
    public stationsSelectionPage: StationsSelectionPage | null;
    public stationMapPage: StationMapPage | null;

    constructor() {
        this.stationCache = {};
        this.linesSelectionPage = null;
        this.stationsSelectionPage = null;
        this.stationMapPage = null;
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
                this.stationMapPage = new StationMapPage();
                this.stationMapPage.init();
                break;
        }

        // const lines: any[] = await DataFetch.fetchLines();
        // const stations: any[] = await DataFetch.fetchStations(lines[0].id);

        // const targetStationID: number = stations[1].id;
        // const edgesNodes: any = await DataFetch.fetchEdgesNodes(targetStationID);
        // console.log(edgesNodes);

        // const someString: string = "YOMOMMA SO FAT* LOL XD XD FART ON YOU";
        // const someOtherString: string = "WACHANG GULI%20GULI%20 WACHANG GU WACHANG GU!";

        // const slugifier = new Slugifier();
        // let res: string = slugifier.slugify(someString, someOtherString);
        // console.log(res);
        // let terms: string[] = slugifier.deslugify(res);
        // console.log(terms);
    }
}

const app = new App();
app.init();
