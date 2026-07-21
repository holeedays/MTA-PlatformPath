import { DataFetch } from "./data_fetch.ts";
import { slugify } from "./slugs.ts";
import { URLHandler } from "./url_handler.ts";
import { CustomHTMLButton } from "./custom_html_button.ts";

// this class will handle the stations selections route
export class StationsSelectionPage {
    private stationOrderReversed: boolean;

    constructor() {
        this.stationOrderReversed = false;
    }

    // this is the function we'll run on app.ts
    public async init(): Promise<void> {
        console.log("Now we're selecting stations...");
        // init all the elements in our page
        await this.initElements();
    }

    // umbrella function to init all elements in the html page, available or unavailable
    private async initElements(): Promise<void> {
        // retrieve the metadata embedded in our url
        const lineID: number | null = URLHandler.getIDFromURL();
        if (lineID === null) {
            console.warn("Cannot extract the ID from the URL. Aborting initializing this page.");
            return;
        }
        // get our stations data using the corresponding line id from our slug data
        const stations: {
            line_reference: {
                name: string,
                color: string, 
                id: number
            },
            stations: {
                name: string, 
                id: number, 
                station_order: number, 
                lines: string[], 
                diagram_path: string
            }[]
            } | null = await DataFetch.fetchStations(lineID);
        if (stations === null) {
            console.warn("Cannot fetch station data. Aborting initializing this page.");
            return;
        }
        
        // get the main elements we'll be modifying
        const stationsSelectionContainer: HTMLDivElement | null = (
            document.querySelector(".stations__selection-container") as HTMLDivElement);
        const stationsInputContainer: HTMLDivElement | null = (
            document.querySelector(".stations__input-container") as HTMLDivElement);
        // parent container of stationsSelection and Input Container
        const stationsInputSelectionContainer: HTMLDivElement | null = document.querySelector(".stations__input-selection-container");

        if (stationsInputSelectionContainer === null || stationsSelectionContainer === null || stationsInputContainer === null) {
            console.warn(
                "Stations input selection container/stations selection container/stations input container is null",
                `Stations Input Selection Container Status: ${stationsInputSelectionContainer}`,
                `Stations Selection Container Status: ${stationsSelectionContainer}`,
                `Stations Input Container Status: ${stationsInputContainer}`
            );
            return;
        }

        // configure these elements
        this.initStationsInputSelectionContainer(stationsInputSelectionContainer, stations.line_reference.color);
        // init station selection container and return the station list elements
        const stationsListElements: {
            stationsList: HTMLOListElement,
            stationsListChildren: {
                listItemWrapper: HTMLLIElement, 
                orderIdentifier: HTMLSpanElement, 
                customButton: CustomHTMLButton
            }[]
        } | null = (
            this.initStationsSelectionContainer(stationsSelectionContainer, stations.stations));

        if (stationsListElements !== null)
            this.initStationsInputContainer(stationsInputContainer, stationsListElements, stations.line_reference.name);
    }

    // configure our stations input selection container (the parent container of our input/selection container)
    // it's mainly just to add classes to it
    private initStationsInputSelectionContainer(stationsInputSelectionContainer: HTMLDivElement, ...classes: string[]): void {
        classes.forEach((cls: string) => stationsInputSelectionContainer.classList.add(cls));
    }

    // configure the items in our stations selection container (mainly the ordered list within it) and return the contents in the list
    private initStationsSelectionContainer(
        stationsSelectionContainer: HTMLDivElement,
        stations: {
            name: string, 
            id: number, 
            station_order: number, 
            lines: string[], 
            diagram_path: string
        }[]
    ): {
        stationsList: HTMLOListElement,
        stationsListChildren: {
            listItemWrapper: HTMLLIElement, 
            orderIdentifier: HTMLSpanElement, 
            customButton: CustomHTMLButton}[]
        } | null {
        // there are two items in our stations selection container...
        // a list or all available stations
        const stationsList: HTMLOListElement | null = stationsSelectionContainer.querySelector(".stations__list");
        // and a slider that, when toggled, swaps directions of the stations
        const stationsDirectionSliderContainer: HTMLDivElement | null = (
            stationsSelectionContainer.querySelector(".stations__direction-slider-container"));
        if (stationsList === null || stationsDirectionSliderContainer === null) {
            console.warn(
                "Stations list or stations direction slider container doesn't exist in stations selection container",
                `Stations List Status: ${stationsList}; Stations Direction Button Status: ${stationsDirectionSliderContainer}`
            );
            return null;
        }   

        // init our stations list first (or else we cannot init the station direction button)
        const stationsListChildren: {
            listItemWrapper: HTMLLIElement, 
            orderIdentifier: HTMLSpanElement,
            customButton: CustomHTMLButton
        }[] = this.initStationsList(stationsList, stations);
        // then configure the logic for our stations direction button
        this.initStationsDirectionSliderContainer(stationsDirectionSliderContainer, stations, stationsListChildren);

        return {stationsList, stationsListChildren};
    }

    // configure the contents in the stations input container (the logo div and the input form)
    private initStationsInputContainer(
        stationsInputContainer: HTMLDivElement,
        stationsListElements: {
            stationsList: HTMLOListElement, 
            stationsListChildren: {
                listItemWrapper: HTMLLIElement, 
                orderIdentifier: HTMLSpanElement, 
                customButton: CustomHTMLButton
            }[] 
        },
        lineName: string): void {

        const logoButton: HTMLButtonElement | null = (
            stationsInputContainer.querySelector(".stations__line-logo-button") as HTMLButtonElement);
        const inputForm: HTMLInputElement | null = stationsInputContainer.querySelector(".stations__input-form");

        if (logoButton === null || inputForm === null) {
            console.warn(
                "Logo button or input form doesn't exist",
                `Logo Button Status: ${logoButton}; Input Form Status ${inputForm}`
            );
            return;
        }   

        this.initInputForm(inputForm, stationsListElements);
        this.initLogoButton(logoButton, lineName);
    }

    // add the logic handling for our stations directions button
    private initStationsDirectionSliderContainer(
        stationsDirectionSliderContainer: HTMLDivElement, 
        stations: { 
            name: string, 
            id: number, 
            station_order: number, 
            lines: string[], 
            diagram_path: string
        }[],
        stationListItems: {
            listItemWrapper: HTMLLIElement, 
            orderIdentifier: HTMLSpanElement, 
            customButton: CustomHTMLButton}[]
        ): void {

        // get the two items that we will need
        const directionDescription: HTMLSpanElement | null = (
            stationsDirectionSliderContainer.querySelector(".stations__direction-description"));
        const slider: HTMLDivElement | null = stationsDirectionSliderContainer.querySelector(".stations__direction-slider");

        if (directionDescription === null || slider === null) {
            console.warn(
                "The direction description doesn't exist or the slider knob may not exist",
                `Direction Description Status: ${directionDescription}; Slider Knob Status: ${slider}`
            );
            return;
        }

        // set the meta data for our slider and the direction description
        slider.classList.add("stations__direction-slider-unselected");
        directionDescription.innerHTML = "DOWNTOWN TO UPTOWN";
        slider.setAttribute("aria-checked", "false");

        // add our event listener
        slider.addEventListener("click", () => {            
            let index: number = 0;
            let increment: number = 0;

            if (this.stationOrderReversed === false) {
                index = stationListItems.length - 1;
                increment = -1;

                slider.classList.add("stations__direction-slider-selected");
                slider.classList.remove("stations__direction-slider-unselected");
                directionDescription.innerHTML = "UPTOWN TO DOWNTOWN";
                slider.setAttribute("aria-checked", "true");
            }
            else {
                index = 0;
                increment = 1;

                slider.classList.add("stations__direction-slider-unselected");
                slider.classList.remove("stations__direction-slider-selected");
                directionDescription.innerHTML = "DOWNTOWN TO UPTOWN";
                slider.setAttribute("aria-checked", "false");
            }

            for (let i = 0; i < stationListItems.length; i++) {

                const button: CustomHTMLButton | undefined = stationListItems[i]?.customButton;
                const orderIdentifier: HTMLSpanElement | undefined = stationListItems[i]?.orderIdentifier;
                const listItemWrapper: HTMLLIElement | undefined = stationListItems[i]?.listItemWrapper;
                const stationName: string | undefined = stations[index]?.name;
                const stationID: number | undefined = stations[index]?.id;
                const stationOrder: number | undefined = stations[index]?.station_order;

                if (button === undefined || 
                    orderIdentifier === undefined ||
                    listItemWrapper === undefined ||
                    stationName === undefined ||
                    stationID === undefined || 
                    stationOrder === undefined
                ) {
                    console.warn(
                        `There is no button, order identifier span element, or the parent list item wrapper 
                         at ${i} index or station json object at ${index}`,
                        `Button Status: ${button}`,
                        `Order Identifier Span Status: ${orderIdentifier}`,
                        `List Item Wrapper: ${listItemWrapper}`,
                        `Station JSON Object Status: ${stations[index]}`
                    );
                    return;
                }

                // we're essentially doing the same thing as in init stations list but reversing the values depending
                // on if we are flipping the values
                this.initStationButton(button, stationName, stationID);
                this.initOrderIdentifier(orderIdentifier, stationOrder);
                this.initListItemWrapper(listItemWrapper);

                // shift our index so our stations list items are in line with the station json object items
                index += increment;
            };


            this.stationOrderReversed = !this.stationOrderReversed;
        });
    }

    // create the elements in our stations list
    private initStationsList(
        stationsList: HTMLOListElement, 
        stations: {
            name: string, 
            id: number, 
            station_order: number,
            lines: string[],
            diagram_path: string
        }[]): {listItemWrapper: HTMLLIElement, orderIdentifier: HTMLSpanElement, customButton: CustomHTMLButton}[] {

        // create another array to hold all the list & button elements (tuples) we will create and add to to our list
        const stationListElements: {
            listItemWrapper: HTMLLIElement, 
            orderIdentifier: HTMLSpanElement, 
            customButton: CustomHTMLButton}[] = [];

        // create our buttons and add even listeners for each one
        for (const station of stations) {
            // this is a custom class that has custom properties over the vanilla button element
            const customButton: CustomHTMLButton = new CustomHTMLButton();
            // this items will contain the button and will be appended to our list
            const listItemWrapper: HTMLLIElement = document.createElement("li");
            // also add this div to contain the order number (it'll be custom over the original ordered list)
            const orderIdentifier: HTMLSpanElement = document.createElement("span");

            // add the event listener logic for our buttons (redirecting to another part of our url)
            this.initStationButton(customButton, station.name, station.id);
            // we'll use this ordering over the ordered list's default numbering style
            this.initOrderIdentifier(orderIdentifier, station.station_order);
            this.initListItemWrapperPrelim(listItemWrapper);

            // now append all these items to our list item wrapper 
            listItemWrapper.append(orderIdentifier, customButton.self);
            // and to our stations list (to be used later)
            stationsList.appendChild(listItemWrapper);
            stationListElements.push({listItemWrapper, orderIdentifier, customButton});
        }

        // return our list elements (to be used later)
        return stationListElements;
    }

    // configure the event logic of the input form
    private initInputForm(
        inputForm: HTMLInputElement, 
        stationListElements: {
            stationsList: HTMLOListElement, 
            stationsListChildren: {
                listItemWrapper: HTMLLIElement, 
                orderIdentifier: HTMLSpanElement, 
                customButton: CustomHTMLButton
            }[]
        }
    ): void {
        // configure the logic for the input form (matching user input)
        inputForm.addEventListener("input", () => {
            // create a regexp that tests whether any string matches with the current input form value (case insensitive)
            const userInputRegex: RegExp = new RegExp(`${inputForm.value}`, "i");

            let stationButtonsHidden: number = 0;

            // iterate through each button amd check whether the user input value matches with their value
            for (const {listItemWrapper, orderIdentifier, customButton} of stationListElements.stationsListChildren) {
                // if it doesn't have the value, add a class to make it "hidden" from the container (CSS will handle that effect)
                if (!userInputRegex.test(customButton.self.value)) {
                    listItemWrapper.classList.add("item__hidden");
                    stationButtonsHidden++;
                }
                // else remove the "hidden" class
                else {
                    listItemWrapper.classList.remove("item__hidden");
                }
            }

            // logic to deal with adding a custom element if all station buttons are hidden
            let temporaryListItem: HTMLLIElement | null = (
                stationListElements.stationsList.querySelector(".item__temp[data-is-unique='true']"));
            // first check if the count is equivalent to the available number of stations
            // if it doesn't, remove the temporary list item (if it exists)
            if (stationButtonsHidden !== stationListElements.stationsListChildren.length) {
                temporaryListItem?.remove();
                return;
            }

            // if the count is equivalent, check if the list item already exists
            if (temporaryListItem === null) {
                // create an additional list element that tells the user there are no available results with what they searched
                temporaryListItem = document.createElement("li");
                // demarcate the item was a class "temp"
                temporaryListItem.classList.add("item__temp");
                // add this unique attribute
                temporaryListItem.setAttribute("data-is-unique", "true");
                temporaryListItem.innerHTML = "There are no available stations with that name :/";
                // prepend it to our parent stationsList container
                stationListElements.stationsList.prepend(temporaryListItem);
            }
        });
    }

    // configure the logo button (event listener logic and its styling)
    private initLogoButton(logoButton: HTMLButtonElement, lineName: string): void {
        logoButton.innerHTML = lineName;
        logoButton.addEventListener("click", () => URLHandler.redirectTo("/discover/lines/"));
    }

    // configures the logic for a given station button (event listener + misc styling)
    private initStationButton(stationButton: CustomHTMLButton, stationName: string, stationID: number): void {
        stationButton.self.innerHTML = stationName;
        stationButton.self.value = stationName;
        // add this class if it doesn't exist already
        stationButton.self.classList.add("station__btn");
        // configure the URL redirecting for each button 
        stationButton.clearEventListeners();
        const handler = () => {
            const currentURL: string = URLHandler.getFullURLRoute();
            const stationSlug: string = slugify(stationName, stationID);
            URLHandler.redirectTo(currentURL + stationSlug + "/map/");
        };
        stationButton.addEventListener("click", handler);
    }

    // configures each order identifier span element for our station list items
    private initOrderIdentifier(orderIdentifier: HTMLSpanElement, stationOrder: number): void {
        orderIdentifier.innerHTML = `${stationOrder}`;
        orderIdentifier.classList.add("station__order-identifier");
    }

    // configures the item wrapper event listener logic 
    private initListItemWrapperPrelim(listItemWrapper: HTMLLIElement): void {
        listItemWrapper.addEventListener("transitionend", (ev: TransitionEvent) => {
            if (ev.propertyName === "opacity")
                listItemWrapper.classList.remove("item__loading");
        });
    }
    // configures the styling for the list item wrapper
    private initListItemWrapper(listItemWrapper: HTMLLIElement): void {
        // I added this code simply to avoid the event listener from not running at all 
        // (which basically adds item__loading permanently); it soft resets the class list
        if (listItemWrapper.classList.contains("item__loading")) {
            listItemWrapper.classList.remove("item__loading");
            return;
        }
        listItemWrapper.classList.add("item__loading");
    }
}
