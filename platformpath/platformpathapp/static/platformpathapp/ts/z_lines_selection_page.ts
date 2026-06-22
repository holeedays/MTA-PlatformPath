import { DataFetch } from "./data_fetch.ts";
import { URLHandler } from "./url_handler.ts";
import { URLS } from "./statics.ts";

// this class will handle the line selections route
export class LinesSelectionPage {
    constructor() {
    }

    // this is the function we'll run on app_new.ts
    public async init(): Promise<void> {
        console.log("We're currently selecting subway lines...");

        // // clear query parameters with the key "selected_line" (in case of page refreshes)
        // URLHandler.removeQueryParameter("selected_line");
        // // initiate the subway line buttons
        // await this.initLineButtons();
        // // initiate the submit button after everything is done
        // this.initSubmitButton();        
    }

    // create the DOM line buttons for the start page
    private async initLineButtons(): Promise<void> {
        // get our div that will contain our buttons
        try {
            const lineButtonsContainer: HTMLElement | null = document.getElementById("line_buttons_container");
            if (lineButtonsContainer === null) {
                throw new Error("There is no container to hold the subway line buttons");
            }
            // then fetch our lines
            const lines: Record<string,string>[] = await DataFetch.fetchLines(URLS.LINES_FETCH_API);
            // check if any subway lines exist in our database
            if (lines === null) {
                throw new Error("There are no lines currently in the database");
            }
            else {
                // init the buttons that represent lines that actually exist in our database
                // and return a hashmap (more a set, but get the idea) of it
                const availableLinesHashMap: Set<string> = this.initAvailableLineButtons(lines);
                // using our returned hashmap, init the other buttons that represent lines not within our database
                this.initUnavailableLineButtons(availableLinesHashMap);
            }
        }
        catch (err: any) {
            console.error(`The following error has occurred: ${err}`);
        }
    }

    // configures the buttons for lines that do have data
    private initAvailableLineButtons(lines: Record<string,string>[]): Set<string> {
        // create a hash map for use later in checking if a subway line has accessible data in the database and 
        // can subsequently be used later <-- this is our return value by the way
        const availableLinesHashMap: Set<string> = new Set();
        lines.forEach((line: Record<string,string>) => {
            // add the id to our hashmap
            availableLinesHashMap.add(`${line.name}_button_container`);
            // add some miscellaneous logic to the buttons that exist
            const lineButtonContainer: HTMLElement | null = document.getElementById(`${line.name}_button_container`);
            const lineButton: HTMLButtonElement | null | undefined = lineButtonContainer?.querySelector("button");

            // NOTE: if the element doesn't exist in our template, any additional lines from our db will not be configured
            // even if the button exists b/c of this error
            if (lineButton === null || lineButton === undefined) {
                throw new Error(`This specified line button with the id - ${line.name}_button - does not exist`);
            }

            // aria_label tells us the current state of the button
            lineButton.setAttribute("aria_label", "not_clicked");
            // add an onclick function to our event listener
            lineButton.addEventListener("click", () => {
                const ariaLabelValue: string | null = lineButton.getAttribute("aria_label");

                // clicking logic for the button...

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
        });

        // return our hashmap (used in initUnavailableLineButtons)
        return availableLinesHashMap;
    }

    // configures the buttons for lines that don't have any data: adds additional html tags and items
    private initUnavailableLineButtons(availableLinesHashMap: Set<string>): void {
        // using our hashmap, checks the buttons on our page whether to allow them to be interacted with (visually)
        for (const button of document.getElementsByTagName("button")) {
            const lineButtonContainer: HTMLElement | null = button.parentElement;
            // check if a line button container exists for this button
            if (lineButtonContainer === null)
                throw new Error(`There's no lines button container for the button with value ${button.value}`);

            // check if we've already mentioned this line button container (meaning it is in the database)
            if (!availableLinesHashMap.has(lineButtonContainer.id) && button.id !== "submission_button") {
                // if not mark it the button as not available
                button.classList.add("not_available");
                // and add a text box telling the user this train line is not available
                const textBox: HTMLElement = document.createElement("div");
                textBox.innerHTML = "This line is currently unavailable";
                textBox.classList.add("notification_textbox");
                lineButtonContainer.appendChild(textBox);
            }
        }
    }

    // create the DOM button that actuall triggers redirection to the next page
    private initSubmitButton(): void {
        const submitButton: HTMLElement | null = document.getElementById("submission_button");

        if (submitButton !== null) {
            submitButton.addEventListener("click", () => {
                URLHandler.redirectTo("/test/stations_selection", `${URLHandler.getQueryParametersURL()}`);
            });
        }
    }
}