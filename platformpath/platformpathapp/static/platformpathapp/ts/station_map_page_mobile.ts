import { StationMapPage } from './station_map_page.ts';
import { URLHandler } from './url_handler.ts';

export class StationMapPageMobile extends StationMapPage {
    constructor() {
        super();
    }

    // normally, ts, c++, c# etc... lets you modify the return type (e.g. as long as the types are similar (like promise<void> and
    // promise<string> in this case, the compiler won't throw a fit) BUT our compiler settings ("module":"nodenext") is enforcing
    // strict type returns since it's making the methods be treated as properties rather than methods)
    // For instance: though StationMapPage's init(): Promise<void> is a method, it is being treated as init: () => Promise<void>
    // in the d.ts file (which is the transpiled version of our ts code)
    public override async init(): Promise<void> {
        await super.initBase();
    }
}