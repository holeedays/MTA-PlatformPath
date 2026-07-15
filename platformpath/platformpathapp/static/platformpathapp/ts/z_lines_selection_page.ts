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

        // create arrays to hold the button references (and their parents) for the buttons that references lines that do/don't 
        // have stations in the database associated with them
        const availableLineButtons: {button: HTMLButtonElement, container: HTMLDivElement}[] = [];
        const unavailableLineButtons: {button: HTMLButtonElement, container: HTMLDivElement}[] = [];
        // create an iterable hash map that maps the color of the line to the html div element
        const subwayColorHashMap: Map<string, HTMLDivElement> = new Map<string, HTMLDivElement>;

        // get all subway line containers (1, 2, 3... A, C, E etc)
        const subwayLineContainers: NodeListOf<HTMLDivElement> | null = document.querySelectorAll(".line__container"); 
        if (subwayLineContainers === null) {
            console.warn("There are no subway line containers in the page");
            return;
        }

        // iterate through each container
        for (const subwayLineContainer of subwayLineContainers) {
            // get the button inside
            const lineButton: HTMLButtonElement | null = subwayLineContainer.querySelector("button");
            // also retrieve the line corresponding to this container
            // extract meta-data here to know which line we should be referencing in our linesHashMap...
            const currentLine: string | undefined = subwayLineContainer.dataset.line;
            let line: {
                name: string, 
                id: number, 
                color: string, 
                num_of_available_stations: number} | null = null;
            if (currentLine !== undefined && linesHashMap[currentLine] !== undefined)
                line = linesHashMap[currentLine];
            // and retrieve the parent as well
            const subwayLineGroup: HTMLDivElement | null = subwayLineContainer.parentElement as HTMLDivElement;
            // make sure neither the item in the hashmap or the button does not exist
            if (lineButton === null || line === null || subwayLineGroup === null) {
                console.warn(
                    `${subwayLineContainer.id} may not have a button or the container id may be spelled in the wrong way`,
                    `Line container status: ${line}; Button status: ${lineButton}`
                );
                continue;
            }
            
            // add the color class to the subway line container group (which groups all related-color lines together)
            // this hash map will be fed to the initSubwayLineGroups function to add the class
            subwayColorHashMap.set(line.color, subwayLineGroup);
            // determine which array our line buttons belong to based on how many stations they have in the db
            if (line.num_of_available_stations > 0)
                availableLineButtons.push({button: lineButton, container: subwayLineContainer});
            else 
                unavailableLineButtons.push({button: lineButton, container: subwayLineContainer});
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
            linesHashMap[line.name] = {
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
        availableLineButtons: {
            button: HTMLButtonElement,
            container: HTMLDivElement
        }[], 
        linesHashMap: Record<string, {
            name: string, 
            id: number, 
            color: string, 
            num_of_available_stations: number
        }>): void {
        // loop through all our avaialble line button pairs
        for (const lineButton of availableLineButtons) {
            // add our event listener
            lineButton.button.onclick = () => {
                // get the right line data from our hash map
                const currentLine: string | undefined = lineButton.container.dataset.line;
                let lineData: {
                    name: string, 
                    id: number,
                    color: string,
                    num_of_available_stations: number
                } | null = null;
                if (currentLine !== undefined && linesHashMap[currentLine] !== undefined)
                    lineData = linesHashMap[currentLine];

                // when the button is clicked, just route the url to the next page and add a slug for the metadata
                // that we need
                if (lineData === null) {
                    console.warn(
                        `The parent container for line button of line ${lineButton.button.innerHTML} might not exist or lines 
                        hash map might not have that value.`, 
                        `Subway Line Container Status: ${lineButton.container}`,
                        `Lines Hash Map Key Return Value: ${lineData ?? undefined}`
                    );
                    return;
                }

                const lineSlug: string = slugify(lineData.color, lineData.name, lineData.id);
                const currentURL: string = URLHandler.getFullURLRoute();

                URLHandler.redirectTo(currentURL + lineSlug + "/stations/");
            };

            // also add the proper aria state for readibility
            lineButton.button.setAttribute("aria-disabled", "false");
        }
    }

    // apply appropriate classes for the buttons of the lines that don't exist in the database and add any other
    // miscellaneous UI elements
    private initUnavailableButtons(unavailableLineButtons: {button: HTMLButtonElement, container: HTMLDivElement}[]): void {
        // iterate through each line button and its container pair
        for (const lineButton of unavailableLineButtons) {
            // create our logo tag
            const unavailableLineLogo: HTMLImageElement = document.createElement("img");
            unavailableLineLogo.src = `${this.getStaticFolderPath()}platformpathapp/decals/unavailable_line_logo.svg`;
            // configuring classes for the textbox and our line button container
            unavailableLineLogo.classList.add("unavailable-line__logo");
            lineButton.container.classList.add("line__container-unavailable");
            // append the textbox to our button container
            lineButton.container.appendChild(unavailableLineLogo);
            // also add an aria state for readability
            lineButton.button.setAttribute("aria-disabled", "true");
        }
    }

    // get the folder path for static files 
    private getStaticFolderPath(): string {
        const djangoConfig: HTMLElement | null = document.getElementById("django_config");
        const STATIC_PATH: string | undefined = djangoConfig?.dataset.staticPath;

        if (STATIC_PATH === undefined) {
            console.warn(
                "There is no element with the id django_config or it's missing the static-path attribute.",
                `django config status: ${djangoConfig}; attribute status: ${STATIC_PATH}`
            );
            return "";
        }
        
        return STATIC_PATH;
    }
}