import { StationMapPage } from './station_map_page.ts';
import { type StationMapInteractionHandler, NodeDropdownButton } from './station_custom_elements.ts';

export class StationMapPageMobile extends StationMapPage {
    // only one element can be moved at the same time (prevents some weird desyncing problems)
    private currentMovingElement: HTMLElement | null = null;

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
        this.initMobile();
    }

    // umbrella container for mobile only functions
    public initMobile(): void {
        // init horizontal dragging/touch behavior for the layer options panel
        this.initLayerOptionsPanel();
        // init horizontal dragging/touch behavior for the filter checklist
        this.initFilterChecklist();
        // init vertical dragging/touch behavior of the pull up container
        this.initPullUpContainer();
    }

    // inits the touch/interaction handling of the layer options panel (horizontal scrolling)
    private initLayerOptionsPanel(): void {
        const layerOptionsWrapper: HTMLDivElement | null = document.querySelector(".layer-options__wrapper");
        const layerOptions: HTMLDivElement | null | undefined = layerOptionsWrapper?.querySelector("#layer-options");

        // user touches layer options container, let's say it's overflowing off the screen
        // on touch the user's xy position is marked
        // it is dragged across (measuring displacement)
        // container transforms that distance left and right :)
        // same goes for a non overflowing layer options container. HOWEVER, if the container's left or right limit is in view
        // of the browser and the user continually swipes that way, move the container back on touch release

        if (layerOptionsWrapper === null || layerOptions === null || layerOptions === undefined) {
            console.warn(
                "Layer options wrapper and/or the layer options container doesn't exist",
                `Layer Options Wrapper Status: ${layerOptionsWrapper}`,
                `Layer Options Status ${layerOptions}`
            );
            return;
        }

        // init the scroll logic for the layer options panel
        this.initHorizontalScrollItems(layerOptions, layerOptionsWrapper);
    }

    // inits the touch/interaction handling of the filter checklist (horizontal scrolling)
    private initFilterChecklist(): void {
        const filterChecklist: HTMLDivElement | null = document.querySelector(".filter-checklist");
        const filterChecklistCheckboxesContainer: HTMLDivElement | null | undefined = (
            filterChecklist?.querySelector(".filter-checklist__checkboxes-container")
        );

        if (
            filterChecklist === null || 
            filterChecklistCheckboxesContainer === null || 
            filterChecklistCheckboxesContainer === undefined
        ) {
            console.warn(
                "Filter checklist and/or the child filter checkboxes container doesn't exist",
                `Filter Checklist Status: ${filterChecklist}`,
                `Filter Checklist Checkboxes Container Status: ${filterChecklistCheckboxesContainer}`
            );
            return;
        }

        // same as the layer options panel, init the same scroll logic for the filter checklist 
        this.initHorizontalScrollItems(filterChecklistCheckboxesContainer, filterChecklist);
    }

    // init horizontally scrolling items
    private initHorizontalScrollItems(movingElement: HTMLElement, scrollElement: HTMLElement): void {
        // removes css determination for swiping behavior, now pointer move behaves like touchmove
        // btw, we add the event listeners to the scroll element (usually a wrapper element or really any container element
        // that is static and occupies about 100% of the width) so that the user can interact with the layer options panel
        // for the entire width of their mobile screen 
        scrollElement.style.touchAction = "none"; 
        // init variables for our touch like movement
        let startPosX: number = 0;
        let currentPosX: number = 0;
        let displacementX: number = 0;
        // this holds all the displacements from a single pointer down event (e.g. when user holds down on the screen)
        const displacementXArray: number[] = [];
        const arraySizeLimit: number = 500;
        // these values hold the min and max translation the movingElement can move
        let minClampPosX: number = -movingElement.offsetWidth/2 + scrollElement.offsetWidth/2;
        let maxClampPosX: number = movingElement.offsetWidth/2 - scrollElement.offsetWidth/2;

        // set the moving element to its start position if the moving element is still wider than the scroll element
        // (which, assuming the scroll element is 100% width, means the browser viewport can't see the entire length of the
        // moving element)
        if (movingElement.offsetWidth > scrollElement.offsetWidth) {
            currentPosX = maxClampPosX;
            movingElement.style.setProperty("--total-displacement", `${currentPosX}px`);
        }

        // set event listeners for pointerdown, pointerup, pointermove (basically a hybrid event listener for pc and touch devices)
        scrollElement.addEventListener("pointerdown", (ev: PointerEvent) => {
            if (movingElement.classList.contains("lerping")) {
                // provide a pause from lerping or any animations if screen is held down
                const matrix: DOMMatrix = this.getCurrentTransformMatrix(movingElement);
                // m41 returns the current x transform from the transform matrix (m42 returns y, m43 z)
                currentPosX = matrix.m41;
                movingElement.style.setProperty("--total-displacement", `${currentPosX}px`);
                movingElement.style.setProperty("--transition-time", "1s");
                movingElement.classList.remove("lerping");
            }
            // NOTE: this is important, this makes sure that focus is kept on the item
            // turns out you don't need it and it causes more issues... for one, children with pointerup/click event listeners 
            // will  literally get intercepted so those functions will never run and two, touch devices usually already
            // have an implicit pointer capture; moral of the story... don't set/release pointer capture if not necessary
            // IF YOU MUST, set pointer capture later and first determine whether the touch was a "tap" vs "dragging"
            // once you discern that, then set pointer capture (see "pointermove" for how it should be handled)
            // scrollElement.setPointerCapture(ev.pointerId);

            // set start pos x
            startPosX = ev.x;

            if (this.currentMovingElement === null)
                this.currentMovingElement = scrollElement;
        });
        scrollElement.addEventListener("pointerup", (ev: PointerEvent) => {
            if (this.currentMovingElement !== scrollElement)
                return;

            // set the highest value and lowest value of layer options... we have to adjust it dynamically to account
            // for browser viewport shift (IDEALLY, the scroll element should be 100% of the viewport height in this case)
            if (movingElement.offsetWidth > scrollElement.offsetWidth) {
                minClampPosX = -movingElement.offsetWidth/2 + scrollElement.offsetWidth/2;
                maxClampPosX = movingElement.offsetWidth/2 - scrollElement.offsetWidth/2;
            }
            else {
                minClampPosX = -movingElement.offsetWidth/4;
                maxClampPosX = movingElement.offsetWidth/4;
            }
                        
            // update our current pos
            currentPosX += displacementX;

            // determine whether we're dealing with swipe gesture logic or just plain drag logic (no swiping)

            // generally the last moments of a swipe gesture matter the most hence a smaller frame interval would be
            // might be better
            const framesInterval: number = 5;
            // this is in pixels per frame (frame speed is dependent on the refresh rate of the browser (avg maybe 60fps))
            const velocityThreshold: number = 11;                        
            if(this.swipeGestureDetected(displacementXArray, framesInterval, velocityThreshold)) {
                const averageVelocityDuringFrameDuration: number = this.getAverageVelocity(displacementXArray, framesInterval);
                const offset: number = 15;
                const additionalDisplacementX: number = averageVelocityDuringFrameDuration*offset;
                currentPosX += additionalDisplacementX;
                // speed up the lerping animation if the total displacement is going to go over one of the clamp values
                if (currentPosX > maxClampPosX || currentPosX < minClampPosX)
                    movingElement.style.setProperty("--transition-time", "0.3s");
            }
            else {
                // check if the currentPosX is over our clamp values
                if (currentPosX > maxClampPosX) 
                    currentPosX = maxClampPosX;
                else if (currentPosX < minClampPosX)
                    currentPosX = minClampPosX;
            }

            // update our moving element with the appropriate styling and translation position
            movingElement.style.setProperty("--total-displacement", `${currentPosX}px`);
            movingElement.classList.add("lerping");

            // release focus on our elements here
            scrollElement.releasePointerCapture(ev.pointerId);

            // reset our variables here

            // clear our array of displacements
            displacementXArray.splice(0);
            // reset displacementX
            displacementX = 0;
            // remove the current moving element reference (so that other elements can be scrolled thru)
            this.currentMovingElement = null;
        });
        scrollElement.addEventListener("pointermove", (ev: PointerEvent) => {
            if (this.currentMovingElement !== scrollElement) 
                return;

            // these scroll elements usually have buttons within them and so we want to prevent overriding the children's
            // event listeners with setPointerCapture() unless we deem that the person is actually dragging the container
            // versus tapping a button... this takes to account for this logic
            const displacemenetJitter: number = 15;
            if (Math.abs(displacementX) > displacemenetJitter) 
                scrollElement.setPointerCapture(ev.pointerId);

            // calculate the change in x-axis from the startPosX (which is set on touchdown)
            displacementX = ev.x - startPosX;

            // push it to our displacement array (for swipe gestures)
            // we're capping the size of the array to avoid possible memory leaks
            if (displacementXArray.length === arraySizeLimit) 
                displacementXArray.shift();
            displacementXArray.push(displacementX);
            // find the total displacement
            const totalDisplacementX: number = currentPosX + displacementX;
            // translate by that value
            movingElement.style.setProperty("--total-displacement", `${totalDisplacementX}px`);
        });

        // this removes the lerpingMax/Min/lerping class after the item reaches back the clamp value and 
        // resets the total displacement property back to the clamped value
        scrollElement.addEventListener("transitionend", (ev: TransitionEvent) => {
            if (ev.propertyName === "transform") {
                // for the case of a swipe gesture that goes over the clamp values...
                // shift the total displacement back to clamp value (sort of like a rebound effect: overshoot -> clamp back)
                if (currentPosX > maxClampPosX) {
                    currentPosX = maxClampPosX;
                    movingElement.style.setProperty("--total-displacement", `${currentPosX}px`);
                    return;
                }
                else if (currentPosX < minClampPosX) {
                    currentPosX = minClampPosX;
                    movingElement.style.setProperty("--total-displacement", `${currentPosX}px`);
                    return;
                }

                movingElement.classList.remove("lerping");
                movingElement.style.setProperty("--transition-time", "1s");
            }
        });
    }

    // init the event and interaction logic for the pull up container
    private initPullUpContainer(): void {
        const pullUpContainer: HTMLDivElement | null = document.querySelector(".pull-up-container");
        // the following elements are used to calculate vertical increments with which the pull up container will lock onto
        // if close enough
        const pullUpContainerTab: HTMLDivElement | null | undefined = pullUpContainer?.querySelector(".pull-up-container__tab");
        const levelStackRouteFormFilterChecklistOverrideTogglesContainer: HTMLDivElement | null | undefined = (
            pullUpContainer?.querySelector(".pull-up-container__level-stack-route-form-filter-checklist-override-toggles-container")
        );
        const levelStack: HTMLDivElement | null | undefined = pullUpContainer?.querySelector(".level-stack");
        const routeFormFilterChecklistOverrideTogglesContainer: HTMLDivElement | null | undefined = (
            pullUpContainer?.querySelector(".route-form-filter-checklist-override-toggles__container")
        );
        // used to prevent scrolling behavior when these dropdowns are open
        const startNodeDropdown: HTMLDivElement | null | undefined = pullUpContainer?.querySelector("#start-node-dropdown");
        const endNodeDropdown: HTMLDivElement | null | undefined = pullUpContainer?.querySelector("#end-node-dropdown");

        if (
            pullUpContainer === null ||
            pullUpContainerTab === null ||
            pullUpContainerTab === undefined ||
            levelStackRouteFormFilterChecklistOverrideTogglesContainer === null ||
            levelStackRouteFormFilterChecklistOverrideTogglesContainer === undefined ||
            levelStack === null ||
            levelStack === undefined ||
            routeFormFilterChecklistOverrideTogglesContainer === null ||
            routeFormFilterChecklistOverrideTogglesContainer === undefined ||
            startNodeDropdown === null ||
            startNodeDropdown === undefined ||
            endNodeDropdown === null ||
            endNodeDropdown === undefined
        ) {
            console.warn(
                "Pull up container, children pull up tab, level stack route form filter overrides container, level stack container,",
                ", route form filter checklist override toggles container, and/or start/end node dropdowns does not exist",
                `Pull Up Container Status: ${pullUpContainer}`,
                `Pull Up Container Tab Status: ${pullUpContainerTab}`,
                `Level Stack Route Form Filter Overrides Container Status: ${levelStackRouteFormFilterChecklistOverrideTogglesContainer}`,
                `Level Statck Status: ${levelStack}`,
                `Route Form Filter Checklist Override Toggles Container Status: ${routeFormFilterChecklistOverrideTogglesContainer}`,
                `Start Node Dropdown Status: ${startNodeDropdown}`,
                `End Node Dropdown Status: ${endNodeDropdown}`
            );
            return;
        }

        // like layer options, turn off any touch actions and gesture overrides from the css
        pullUpContainer.style.touchAction = "none";
        // also set up some initial variables (mainly for orienting the pull up container during page loads)
        pullUpContainer.style.setProperty("--initial-vertical-offset", "100%");

        // init variables for our touch like movement
        let startPosY: number = 0;
        let currentPosY: number = 0;
        let displacementY: number = 0;
        // this holds all the displacements from a single pointer down event (e.g. when user holds down on the screen)
        const displacementYArray: number[] = [];
        const arraySizeLimit: number = 500;

        // get our increments (for which the pull up container will increment to when pulled up)
        const increments: { 
            pullUpTabIncrement: number,
            levelStackIncrement: number,
            routeFormFilterChecklistOverrideTogglesContainerIncrement: number
        } = this.getPullUpContainerItemIncrements(
            pullUpContainerTab,
            levelStackRouteFormFilterChecklistOverrideTogglesContainer,
            levelStack,
            routeFormFilterChecklistOverrideTogglesContainer
        );

        currentPosY = increments.pullUpTabIncrement;
        pullUpContainer.style.setProperty("--total-displacement", `${currentPosY}px`);

        pullUpContainer.addEventListener("pointerdown", (ev: PointerEvent) => {
            if (pullUpContainer.classList.contains("lerping")) {
                const matrix: DOMMatrix = this.getCurrentTransformMatrix(pullUpContainer);
                currentPosY = matrix.m42 - pullUpContainer.offsetHeight;
                pullUpContainer.style.setProperty("--total--displacement", `${currentPosY}px`)
                pullUpContainer.classList.remove("lerping");
            }

            // set the reference start pos
            startPosY = ev.y;

            if (this.currentMovingElement === null)
                this.currentMovingElement = pullUpContainer;
        });

        pullUpContainer.addEventListener("pointerup", (ev: PointerEvent) => {
            if (
                this.currentMovingElement !== pullUpContainer ||
                (startNodeDropdown.matches(":popover-open") || endNodeDropdown.matches(":popover-open"))
            )
                return;

            // increment our currentPosY by the total displacement during this touch down interval
            currentPosY += displacementY;

            // deal with swiping gestures here
            const framesInterval: number = 5;
            const velocityThreshold: number = 5;
            if(this.swipeGestureDetected(displacementYArray, framesInterval, velocityThreshold)) {
                const averageVelocityDuringFrameDuration: number = this.getAverageVelocity(displacementYArray, framesInterval);
                const offset: number = 20;
                const additionalDisplacementX: number = averageVelocityDuringFrameDuration*offset;
                currentPosY += additionalDisplacementX;
            }
            // get the closest increment to the current pos y
            currentPosY = this.getClosestPos(currentPosY, Object.values(increments));
            pullUpContainer.classList.add("lerping");
            pullUpContainer.style.setProperty("--total-displacement", `${currentPosY}px`);


            // reset our state variables 
            displacementY = 0;
            displacementYArray.splice(0);
            this.currentMovingElement = null;
        });

        pullUpContainer.addEventListener("pointermove", (ev: PointerEvent) => {
            // only apply move events "IF" the currently pressed element is the pull up container and none of the 
            // popovers are open
            if (
                this.currentMovingElement !== pullUpContainer ||
                (startNodeDropdown.matches(":popover-open") || endNodeDropdown.matches(":popover-open"))
            )
                return;

            // clamp displacementY such that displacementY + currentPosY is < -pullUpContainterHeight 
            // (it's negative since going vertically up means a decrease in the y value)
            displacementY = (
                currentPosY + ev.y - startPosY > -pullUpContainer.offsetHeight ? ev.y - startPosY: displacementY
            );
            if (displacementYArray.length === arraySizeLimit) 
                displacementYArray.shift();
            displacementYArray.push(displacementY);

            // sometimes touch gestures are not smooth (e.g. slightly positional jitter); this causes the pull up container 
            // to move so we need to filter out these noise values and update the position only if we don't deem it as 
            // just random jitter

            // jitter here is in pixels
            const displacementJitter: number = 20;
            if (displacementJitter < Math.abs(displacementY)) {
                const totalDisplacement: number = currentPosY + displacementY;
                pullUpContainer.style.setProperty("--total-displacement", `${totalDisplacement}px`);
            }
        });

        pullUpContainer.addEventListener("transitionend", (ev: TransitionEvent) => {
            if (ev.propertyName === "transform")
                pullUpContainer.classList.remove("lerping");
        });
    }

    // get increments based on the vertical heights of the children in the pull up container
    // to be used for initPullUpContainer
    private getPullUpContainerItemIncrements(
        pullUpContainerTab: HTMLDivElement, 
        levelStackRouteFormFilterChecklistOverrideTogglesContainer: HTMLDivElement,
        levelStack: HTMLDivElement, 
        routeFormFilterChecklistOverrideTogglesContainer: HTMLDivElement
    ): 
    {
        pullUpTabIncrement: number,
        levelStackIncrement: number,
        routeFormFilterChecklistOverrideTogglesContainerIncrement: number
    } {
        const levelStackRouteFormFilterChecklistOverrideTogglesContainerStyle: CSSStyleDeclaration = (
            window.getComputedStyle(levelStackRouteFormFilterChecklistOverrideTogglesContainer)
        );
        const pullUpTabStyle: CSSStyleDeclaration = window.getComputedStyle(pullUpContainerTab);
        const routeFormFilterChecklistOverrideTogglesContainerStyle: CSSStyleDeclaration = (
            window.getComputedStyle(routeFormFilterChecklistOverrideTogglesContainer)
        );
        const levelStackStyle: CSSStyleDeclaration = window.getComputedStyle(levelStack);

        // get our vertical increments
        const pullUpTabIncrement: number = -(parseFloat(pullUpTabStyle.marginTop) + parseFloat(pullUpTabStyle.marginBottom));
        const levelStackIncrement: number = (
            pullUpTabIncrement - parseFloat(levelStackRouteFormFilterChecklistOverrideTogglesContainerStyle.gap) 
            - parseFloat(levelStackStyle.marginTop) - parseFloat(levelStackStyle.marginBottom) 
            - levelStack.offsetHeight
        );
        const routeFormFilterChecklistOverrideTogglesContainerIncrement: number = (
            levelStackIncrement - parseFloat(levelStackRouteFormFilterChecklistOverrideTogglesContainerStyle.gap) 
            - parseFloat(routeFormFilterChecklistOverrideTogglesContainerStyle.marginTop) 
            - parseFloat(routeFormFilterChecklistOverrideTogglesContainerStyle.marginBottom)
            - routeFormFilterChecklistOverrideTogglesContainer.offsetHeight
        );

        return { pullUpTabIncrement, levelStackIncrement, routeFormFilterChecklistOverrideTogglesContainerIncrement };
    }

    // get the closest pos based on a given pos
    private getClosestPos(basePos: number, comparisonPos: number[]): number {
        // get the closest pos based on an array of different pos
        let closestPos: number = 0;
        for (let i = 0; i < comparisonPos.length; i++) {
            const pos: number | undefined = comparisonPos[i];
            // this should never occur but typescript compiler is strict
            if (pos === undefined)
                return 0;
            if (i === 0) 
                closestPos = pos;
            // check which total distance is shorter currently
            if (Math.abs(pos - basePos) < Math.abs(closestPos - basePos))
                closestPos = pos;
        }

        return closestPos;
    }

    // gets the current transform of an element (returns a transform matrix)
    private getCurrentTransformMatrix(element: HTMLElement): DOMMatrix {
        const currentStyle: CSSStyleDeclaration = window.getComputedStyle(element);
        const matrix: DOMMatrix = new DOMMatrix(currentStyle.transform);
        return matrix;
    }

    // bool to determine if an item is a swipe gesture
    // NOTE: velocityThreshold is in pixelsPerFrame
    private swipeGestureDetected(posArray: number[], framesInterval: number,  velocityThreshold: number): boolean {
        const averageVelocityDuringFrameDuration: number = this.getAverageVelocity(posArray, framesInterval);
        if (Math.abs(averageVelocityDuringFrameDuration) >= velocityThreshold)
            return true;
        else
            return false;
    }

    // gets the average velocity during a given frame duration (in pixels per frame)
    private getAverageVelocity(posArray: number[], framesInterval: number): number {
         // cap our frames interval depending on how many items are in the pos array
        framesInterval = framesInterval <= posArray.length? framesInterval: posArray.length;
        // total velocity over any given duration is just startPos-endPos
        const endFramePos: number | undefined = posArray[posArray.length - 1];
        const referenceFramePos: number | undefined = posArray[posArray.length - framesInterval];
        // this shouldn't happen, but will return 0 if this ever occurs
        if (endFramePos === undefined || referenceFramePos === undefined)
            return 0;

        const totalVelocity: number = endFramePos - referenceFramePos;
        return totalVelocity/framesInterval;
    }

    // inits additional event handling logic for the node dropdowns specifically meant for the mobile port
    public override initNodeDropdownButtons(): void {
        const dropdownHost: HTMLDivElement | null = document.querySelector(".route-form__dropdown-host");

        if (dropdownHost === null || this.nodeDropdownButtons.length === 0) {
            console.warn(
                "Route form's drop down host container doesn't exist or there are no node dropdown button instances",
                `Dropdown Host Status: ${dropdownHost}`,
                `Dropdown Buttons Instances Status: ${this.nodeDropdownButtons}`
            );
            return;
        }

        this.nodeDropdownButtons.forEach((nodeDropDownButton: NodeDropdownButton) => {
            const routeFormParent: HTMLDivElement | null = nodeDropDownButton.Self.parentElement as HTMLDivElement | null;
            if (routeFormParent === null) {
                console.warn(`Route form parent for ${nodeDropDownButton.Self} doesn't exist`)
                return;
            }

            // essentially do the exact same thing as the vanilla version of initNodeDropdownButtons, but now change
            // the parent container it is in
            const marginOfError: number = 15;
            nodeDropDownButton.Self.addEventListener("pointerup", (ev: PointerEvent) => {
                if (!this.withinBoundaries(nodeDropDownButton.Self, ev.x, ev.y, marginOfError))
                    return;

                if (!nodeDropDownButton.IsToggled) 
                    dropdownHost.append(nodeDropDownButton.LinkedDropdown);
                else
                    routeFormParent.append(nodeDropDownButton.LinkedDropdown);

                nodeDropDownButton.IsToggled = !nodeDropDownButton.IsToggled;
            });
        })
    }

    // overrides the interaction handler function logic from the base ts file
    public override initInteractionHandlers(): void {
        this.stationMapInteractionHandlers.forEach((stationMapInteractionHandler: StationMapInteractionHandler) => {
            const element: HTMLElement = stationMapInteractionHandler.element;
            const handler: () => void = stationMapInteractionHandler.handler;

            // allow a small margin of error here as well for some leeway for the fingers
            const marginOfError: number = 5;
            // we're essentially emulating a "click" event except exclusively for touch
            element.addEventListener("pointerup", (ev: PointerEvent) => {
                if (this.withinBoundaries(element, ev.x, ev.y, marginOfError))
                    handler();
            });
        });
    }

    // get whether a position is within the bounds of a given element (plus some marginOfError if wanted)
    private withinBoundaries(element: HTMLElement, xPos: number, yPos: number, marginOfError: number = 0): boolean {
        const elementPos: DOMRect = element.getBoundingClientRect();

        if (
            xPos >= elementPos.left - marginOfError &&
            xPos <= elementPos.right + marginOfError &&
            yPos >= elementPos.top - marginOfError &&
            yPos <= elementPos.bottom + marginOfError
        )
            return true;
        
        return false;
    }
}