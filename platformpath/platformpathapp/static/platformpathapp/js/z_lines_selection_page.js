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
        // clear all query paramaters (in case of page refreshes)
        URLHandler.clearAllQueryParameters();
        // initiate the subway line buttons
        await this.initLineButtons();
        // initiate the submit button after everything is done
        this.initSubmitButton();
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
            ////////////////////////////////// just testing with a psuedo line
            // const lineButton: HTMLElement = document.createElement("button");
            // lineButton.textContent = "N";
            // lineButton.setAttribute("aria_label", "not_clicked");
            // lineButton.addEventListener("click", () => {
            //     const ariaLabelValue: string | null = lineButton.getAttribute("aria_label");
            //     // if button hasn't been clicked
            //     if (ariaLabelValue !== null && ariaLabelValue === "not_clicked") {
            //         URLHandler.addQueryParameter("selected_line", lineButton.textContent);
            //         lineButton.classList.add("selected");
            //         lineButton.setAttribute("aria_label", "clicked");
            //     }
            //     // if button has been clicked
            //     else {
            //         URLHandler.removeQueryParameter("selected_line", lineButton.textContent);
            //         lineButton.classList.remove("selected");
            //         lineButton.setAttribute("aria_label", "not_clicked");
            //     }
            // });
            // lineButtonsContainer.appendChild(lineButton);
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