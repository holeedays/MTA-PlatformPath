import { DataFetch } from "./data_fetch.js";
import { URLHandler } from "./url_handler.js";
import { URLS } from "./statics.js";
// this class will handle the line selections route
export class LinesSelectionPage {
    constructor() {
    }
    // this is the function we'll run on app_new.ts
    async init() {
        console.log("We're currently selecting subway lines...");
        // clear query parameters with the key "selected_line" (in case of page refreshes)
        URLHandler.removeQueryParameter("selected_line");
        // initiate the subway line buttons
        await this.initLineButtons();
        // initiate the submit button after everything is done
        this.initSubmitButton();
    }
    // create the DOM line buttons for the start page
    async initLineButtons() {
        // get our div that will contain our buttons
        try {
            const lineButtonsContainer = document.getElementById("line_buttons_container");
            if (lineButtonsContainer === null) {
                throw new Error("There is no container to hold the subway line buttons");
                return;
            }
            // then fetch our lines
            const lines = await DataFetch.fetchLines(URLS.LINES_FETCH_API);
            // check if any subway lines exist in our database
            if (lines === null) {
                throw new Error("There are no lines currently in the database");
            }
            else {
                // create a hash map for use later in checking if a subway line has accessible data in the database and 
                // can subsequently be used later
                const linesIDHashMap = new Set();
                lines.forEach((line) => {
                    // add the id to our hashmap
                    linesIDHashMap.add(`${line.name}_button`);
                    // add some miscellaneous logic to the buttons that exist
                    const lineButton = document.getElementById(`${line.name}_button`);
                    if (lineButton === null) {
                        throw new Error(`This specified line button with the id - ${line.name}_button - does not exist`);
                    }
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
                });
                // using our hashmap, checks the buttons on our page whether to allow them to be interacted with (visually)
                for (const button of document.getElementsByTagName("button")) {
                    if (!(linesIDHashMap.has(button.id)) && button.id !== "submission_button") {
                        button.classList.add("not_available");
                    }
                }
            }
        }
        catch (err) {
            console.error(`The following error has occurred: ${err}`);
        }
    }
    // create the DOM button that actuall triggers redirection to the next page
    initSubmitButton() {
        const submitButton = document.getElementById("submission_button");
        if (submitButton !== null) {
            submitButton.addEventListener("click", () => {
                URLHandler.redirectTo("/test/stations_selection", `${URLHandler.getQueryParametersURL()}`);
            });
        }
    }
}
//# sourceMappingURL=z_lines_selection_page.js.map