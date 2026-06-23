import { DataFetch } from "./data_fetch.ts";
import { Slugifier } from "./slugifier.ts";
import { URLHandler } from "./url_handler.ts";

// this class will handle the stations selections route
export class StationsSelectionPage {
    private slugifier: Slugifier;

    constructor() {
        this.slugifier = new Slugifier();
    }

    // this is the function we'll run on app.ts
    public async init(): Promise<void> {
        console.log("Now we're selecting stations...");

        // clear query params with the key "selected_station" (if page refresh)
        URLHandler.removeQueryParameter("selected_station");
        await this.initElements();
        // initiate the submit button after everything is created
        this.initSubmitButton();
    }

    private async initElements(): Promise<void> {
        // the url currently is: discover/lines/some_line_slug/stations/
        const currentURL: string = URLHandler.getFullURLRoute();
        const urlSplit: string[] = currentURL.split("/");

        const lineSlug: string | undefined = urlSplit[urlSplit.length - 3];
    }

    private initStationsDropdown(): void {
        
    }



    // create the DOM button that actuall triggers redirection to the next page
    private initSubmitButton(): void {
        const submitButton: HTMLElement | null = document.getElementById("submission_button");

        if (submitButton !== null) {
            submitButton.addEventListener("click", () => {
                URLHandler.redirectTo("/full_path", `${URLHandler.getQueryParametersURL()}`);
            });
        }
    }
}