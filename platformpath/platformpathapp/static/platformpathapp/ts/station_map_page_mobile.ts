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
        await super.init();
    }

    // this method is called in init, we can override the method so this version of the method is ran instead of the parent's
    // this will do the opposite of station map page: it triggers the desktop view once the threshold is met
    public override listenForWindowDimensionsChange(): void {
        // this is our threshold number (in pixels)
        const horizontalResizeThreshold: number = 1270;
        // add our event listener here
        const mediaQuery: MediaQueryList = window.matchMedia(`(max-width: ${horizontalResizeThreshold}px)`);
        mediaQuery.addEventListener("change", (ev: MediaQueryListEvent) => {
            // since this is the max-width media query, we want to find the opposite (e.g. the max-width property doesn't match)
            // since we want to go back to desktop view
            if (!ev.matches)
                URLHandler.refreshCurrentURL();
        })
    }
}