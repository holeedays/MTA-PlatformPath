import { DataFetch } from "./data_fetch.ts";
import { URLHandler } from "./url_handler.ts";
import { LinesSelectionPage } from "./z_lines_selection_page.ts";
import { StationsSelectionPage } from "./z_stations_selection_page.ts";
import { PathFinder } from "./path_finder.ts";

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

        const lines: any[] = await DataFetch.fetchLinesNew();
        const stations: any[] = await DataFetch.fetchStationsNew(lines[0].name);

        const targetLine: string = lines[0].name;
        const targetStation: string = stations[1].name;
        // this don't work right now
        const edgesNodes: any = await DataFetch.fetchEdgesNodesNew(targetLine, targetStation);
        console.log(edgesNodes);
    }
}

const app = new App();
app.init();
