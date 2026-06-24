import { DataFetch } from "./data_fetch_new.ts";
import { URLHandler } from "./url_handler.ts";
import { Slugifier } from "./slugifier.ts";

// this class will handle the line selections route
export class LinesSelectionPage {
    private slugifier: Slugifier;
    constructor() {
        this.slugifier = new Slugifier();
    }

    // this is the function we'll run on app_new.ts
    public async init(): Promise<void> {
        console.log("We're currently selecting subway lines...");

        // clear query parameters with the key "selected_line" (in case of page refreshes)
        URLHandler.removeQueryParameter("selected_line");
        // initiate the subway line buttons
        await this.initLineButtons(); 
    }

    // master funcion to set up all the buttons in the lines selection page template
    private async initLineButtons(): Promise<void> {
        const lines: {name: string, id: number}[] = await DataFetch.fetchLines();
        if (lines === null) {
            console.warn("There are no subway lines in the database");
        }   

        // reorder the data into a lines hash map with the key being denoted by the button container element
        const linesHashMap: Record<string, {name: string, id: number}> = {};
        for (const line of lines) {
            linesHashMap[`${line.name}_button_container`] = {name: line.name, id: line.id};
        }

        // create arrays to hold the button references for the buttons that references lines that exist/don't exist within
        // the database
        const availableLineButtons: HTMLButtonElement[] = [];
        const unavailableLineButtons: HTMLButtonElement[] = [];

        // recursively get the button container elements from the html template and the buttons within it
        const linesButtonContainer: HTMLDivElement | null = document.getElementById("line_buttons_container") as HTMLDivElement;
        const subwayLinesColorGroups: HTMLCollection = linesButtonContainer?.children;
        for (const colorGroup of subwayLinesColorGroups) {
            for (const lineButtonContainer of colorGroup.children) {
                // get the button
                const lineButton: HTMLButtonElement | null = lineButtonContainer.querySelector("button");

                if (lineButton === null) {
                    console.warn(`${lineButtonContainer.id} doesn't have a button`);
                    continue;
                }
                // check whether the button corresponds to a line that exists and organize it appropriately
                if (lineButtonContainer.id in linesHashMap) {
                    availableLineButtons.push(lineButton);
                }
                else {
                    unavailableLineButtons.push(lineButton);
                }
            }
        }

        this.initAvailableButtons(availableLineButtons, linesHashMap);
        this.initUnavailableButtons(unavailableLineButtons);
    }

    // add event listeners for the array of button elements and fill them with necessary metadata from lines hash map
    private initAvailableButtons(
        availableLineButtons: HTMLButtonElement[], 
        linesHashMap: Record<string, {name: string, id: number}>): void {
        // loop through all lines of available lines
        for (const lineButton of availableLineButtons) {
            // add our event listener
            lineButton.addEventListener("click", () => {
                const currentURL: string = URLHandler.getFullURLRoute();
                // get the right id to pass through the hash map
                const lineButtonContainer: HTMLDivElement | null = lineButton.parentElement as HTMLDivElement;
                let currentLine: {name: string, id: number} | undefined | null = null;
                if (lineButtonContainer !== null) {
                    currentLine = linesHashMap[lineButtonContainer.id];
                }

                // when the button is clicked, just route the url to the next page and add a slug for the metadata
                // that we need
                if (currentLine !== undefined && currentLine !== null) {
                    const slugifiedString: string = this.slugifier.slugify(currentLine.name, currentLine.id);
                    URLHandler.redirectTo(currentURL + slugifiedString + "/stations/");
                }
            });
        }
    }

    // apply appropriate classes for the buttons of the lines that don't exist in the database and add any other
    // miscellaneous UI elements
    private initUnavailableButtons(unavailableLineButtons: HTMLButtonElement[]): void {
        // iterate through each line button
        for (const lineButton of unavailableLineButtons) {
            // get our parent so we can add a textbox to it (this will notify users the line isn't available)
            const lineButtonContainer: HTMLDivElement | null = lineButton.parentElement as HTMLDivElement;

            if (lineButtonContainer !== null) {
                // creating out text box
                const notificationTextBox: HTMLDivElement = document.createElement("div");
                notificationTextBox.innerHTML = "This line is currently unavailable";
                // configuring classes for the textbox and our line button
                notificationTextBox.classList.add("notification_textbox");
                lineButton.classList.add("not_available");
                // append the textbox to our button container
                lineButtonContainer.appendChild(notificationTextBox);
            }
        }
    }
}