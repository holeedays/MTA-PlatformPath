import { DataFetch } from "./data_fetch_new.ts";
import { URLHandler } from "./url_handler.ts";
import { slugify } from "./slugs.ts";

// this class will handle the line selections route
export class LinesSelectionPage {
    constructor() {
    }

    // this is the function we'll run on app_new.ts
    public async init(): Promise<void> {
        console.log("We're currently selecting subway lines...");

        // initiate the subway line buttons
        await this.initElements(); 
    }

    // master function to set up all the elements (primarily buttons) on the line selection page
    private async initElements(): Promise<void> {
      
        const linesHashMap: Record<string, {
            name: string, 
            id: number,
            color: string,
            num_of_available_stations: number
        }> | null = await this.fetchAndProcessLineData();
        if (linesHashMap === null) {
            console.warn("There is no data. Aborting initiating elements on this page");
            return;
        }

        // create arrays to hold the button references for the buttons that references lines that do/don't have stations
        // in the database assocaited with them
        const availableLineButtons: HTMLButtonElement[] = [];
        const unavailableLineButtons: HTMLButtonElement[] = [];
        // create an iterable hash map that maps the color of the line to the html div element
        const subwayColorHashMap: Map<string, HTMLDivElement> = new Map<string, HTMLDivElement>;

        // recursively get the individual line container elements and the buttons in them
        const subwayLinesMasterContainer: HTMLDivElement | null = document.getElementById("subway_lines_master_container") as HTMLDivElement;
        // macro groups is just an arbitary grouping of the subway lines (like a macro group would be the number lines/multi-lines/etc)
        const subwayLineMacroGroups: HTMLCollection = subwayLinesMasterContainer?.children;
        const subwayLineGroupsArray: HTMLDivElement[] = [];

        // init our array since all the items we're looking for are nested pretty deep
        for (const subwayLineMacroGroup of subwayLineMacroGroups) {
            for (const subwayLineGroups of subwayLineMacroGroup.children) {
                const subwayLineGroupAsDiv: HTMLDivElement = subwayLineGroups as HTMLDivElement;
                subwayLineGroupsArray.push(subwayLineGroupAsDiv);
            }
        }

        for (const subwayLineGroup of subwayLineGroupsArray) {
            for (const subwayLineContainer of subwayLineGroup.children) {
                // get the button
                const lineButton: HTMLButtonElement | null = subwayLineContainer.querySelector("button");
                // also retrieve the line corresponding to this container
                const line: {
                    name: string, 
                    id: number, 
                    color: string, 
                    num_of_available_stations: number} | undefined = linesHashMap[subwayLineContainer.id];
                // make sure neither the item in the hashmap or the button does not exist
                if (lineButton === null || line === undefined) {
                    console.warn(
                        `${subwayLineContainer.id} may not have a button or the container id may be spelled in the wrong way`,
                        `Line container status: ${line}; Button status: ${lineButton}`
                    );
                    continue;
                }
                
                // add the color class to the subway line container group (which groups all related-color lines together)
                // this hash map will be fed to the initSubwayLineContainerGroup function to add the class
                subwayColorHashMap.set(line.color, subwayLineGroup as HTMLDivElement);
                // determine which array our line buttons belong to based on how many stations they have in the db
                if (line.num_of_available_stations > 0)
                    availableLineButtons.push(lineButton);
                else 
                    unavailableLineButtons.push(lineButton);
            }
        }

        this.initAvailableButtons(availableLineButtons, linesHashMap);
        this.initUnavailableButtons(unavailableLineButtons);
        this.initSubwayLineGroups(subwayColorHashMap);
    }

    // fetches all subway line data and reorganizes it to usable data for init element
    private async fetchAndProcessLineData(): Promise<Record<string, {
            name: string,
            id: number,
            color: string,
            num_of_available_stations: number
        }> | null> {
        const lines: {
            name: string, 
            id: number, 
            color: string,
            num_of_available_stations: number
        }[] = await DataFetch.fetchLines();

        // check if there is any data pulled, if not return null
        if (lines === null)
            return null;

        // reconfigure the data to a hashmap where the specific id of the container belonging to that specific line is the
        // key.... the key looks like: "D_line_container"
        const linesHashMap: Record<string, {
            name: string,
            id: number,
            color: string,
            num_of_available_stations: number
        }> = {};
        lines.forEach((line: {name: string, id: number, color: string, num_of_available_stations: number}) => {
            linesHashMap[`${line.name}_line_container`] = {
                name: line.name, 
                id: line.id, color: 
                line.color, 
                num_of_available_stations: line.num_of_available_stations};
        });

        return linesHashMap;
    }

    // configure the line groups (mainly for adding classes like the color of the lines it is holding)
    private initSubwayLineGroups(subwayColorHashMap: Map<string, HTMLDivElement>): void {
        for (const [color, subwayLinesGroup] of subwayColorHashMap) {
            subwayLinesGroup.classList.add(color);
        }
    }

    // add event listeners for the array of button elements and fill them with necessary metadata from lines hash map
    private initAvailableButtons(
        availableLineButtons: HTMLButtonElement[], 
        linesHashMap: Record<string, {
            name: string, 
            id: number, 
            color: string, 
            num_of_available_stations: number
        }>): void {
        // loop through all lines of available lines
        for (const lineButton of availableLineButtons) {
            // add our event listener
            lineButton.addEventListener("click", () => {
                const currentURL: string = URLHandler.getFullURLRoute();
                // get the right id to pass through the hash map
                const subwayLineContainer: HTMLDivElement | null = lineButton.parentElement as HTMLDivElement;
                let currentLine: {
                    name: string, 
                    id: number,
                    color: string,
                    num_of_available_stations: number
                } | undefined | null = null;
                if (subwayLineContainer !== null) {
                    currentLine = linesHashMap[subwayLineContainer.id];
                }

                // when the button is clicked, just route the url to the next page and add a slug for the metadata
                // that we need
                if (currentLine !== undefined && currentLine !== null) {
                    const lineSlug: string = slugify(currentLine.color, currentLine.name, currentLine.id);
                    URLHandler.redirectTo(currentURL + lineSlug + "/stations/");
                }
            });
        }
    }

    // apply appropriate classes for the buttons of the lines that don't exist in the database and add any other
    // miscellaneous UI elements
    private initUnavailableButtons(unavailableLineButtons: HTMLButtonElement[]): void {
        // iterate through each line button
        for (const lineButton of unavailableLineButtons) {
            // get our parent so we can add a warning-like logo to it (this will notify users the line isn't available)
            const lineButtonContainer: HTMLDivElement | null = lineButton.parentElement as HTMLDivElement;

            if (lineButtonContainer !== null) {
                // creating our logo tag
                const unavailableLineLogo: HTMLImageElement = document.createElement("img");
                unavailableLineLogo.src = `${this.getStaticFolderPath()}platformpathapp/decals/unavailable_line_logo.svg`;
                // configuring classes for the textbox and our line button container
                unavailableLineLogo.classList.add("unavailable-line__logo");
                lineButtonContainer.classList.add("line__container-unavailable");
                // append the textbox to our button container
                lineButtonContainer.appendChild(unavailableLineLogo);
            }
        }
    }

    private getStaticFolderPath(): string {
        const djangoConfig: HTMLElement | null = document.getElementById("django_config");
        const STATIC_PATH: string | undefined = djangoConfig?.dataset.staticPath;

        if (STATIC_PATH === undefined) {
            console.warn("There is no element with the id django_config or it's missing the static-path attribute.");
            console.warn(`django config status: ${djangoConfig}; attribute status: ${STATIC_PATH}`)
            return "";
        }
        
        return STATIC_PATH;
    }
}