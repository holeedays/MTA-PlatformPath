import { StationMapPage } from './station_map_page.ts';
import { URLHandler } from './url_handler.ts';

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
        // init dragging/touch behavior of the layer options panel
        this.initLayerOptionsPanel();
        this.initPullUpContainer();
    }

    // this is a mobile specific layer options
    private initLayerOptionsPanel(): void {
        const layerOptionsWrapper: HTMLDivElement | null = document.querySelector(".layer-options__wrapper");
        const layerOptions: HTMLDivElement | null = document.querySelector("#layer-options");

        // user touches layer options container, let's say it's overflowing off the screen
        // on touch the user's xy position is marked
        // it is dragged across (measuring displacement)
        // container transforms that distance left and right :)
        // same goes for a non overflowing layer options container. HOWEVER, if the container's left or right limit is in view
        // of the browser and the user continually swipes that way, move the container back on touch release

        if (layerOptionsWrapper === null || layerOptions === null) {
            console.warn(
                "Layer options wrapper and/or the layer options container doesn't exist",
                `Layer Options Wrapper Status: ${layerOptionsWrapper}`,
                `Layer Options Status ${layerOptions}`
            );
            return;
        }

        // removes css determination for swiping behavior, now pointer move behaves like touchmove
        // btw, we add the event listeners to the wrapper so that the user can interact with the layer options panel
        // for the entire width of their mobile screen 
        layerOptionsWrapper.style.touchAction = "none"; 
        // init variables for our touch like movement
        let startPosX: number = 0;
        let currentPosX: number = 0;
        let displacementX: number = 0;
        // this holds all the displacements from a single pointer down event (e.g. when user holds down on the screen)
        const displacementXArray: number[] = [];
        const arraySizeLimit: number = 500;
        // these values hold the min and max translation the layer options slider can move
        let minClampPosX: number = 0;
        let maxClampPosX: number = 0;
        
        // set event listeners for pointerdown, pointerup, pointermove (basically a hybrid event listener for pc and touch devices)
        layerOptionsWrapper.addEventListener("pointerdown", (ev: PointerEvent) => {
            // provide a pause from lerping or any animations if screen is held down
            const currentStyle: CSSStyleDeclaration = window.getComputedStyle(layerOptions);
            const matrix: DOMMatrix = new DOMMatrix(currentStyle.transform);
            // m41 returns the current x transform from the transform matrix (m42 returns y)
            currentPosX = matrix.m41;
            layerOptions.style.setProperty("--total-displacement", `${currentPosX}px`);
            layerOptions.style.setProperty("--transition-time", "1s");
            layerOptions.classList.remove("lerping");
            // NOTE: this is important, this makes sure that focus is kept on the item
            layerOptionsWrapper.setPointerCapture(ev.pointerId);
            // set start pos x
            startPosX = ev.x;

            if (this.currentMovingElement === null)
                this.currentMovingElement = layerOptionsWrapper;
        });
        layerOptionsWrapper.addEventListener("pointerup", (ev: PointerEvent) => {
            if (this.currentMovingElement !== layerOptionsWrapper)
                return;

            // set the highest value and lowest value of layer options... we have to adjust it dynamically to account
            // for browser viewport shift (e.g. layeOptionsWrapper occupies 100% of browser viewport width)
            if (layerOptions.offsetWidth > layerOptionsWrapper.offsetWidth) {
                minClampPosX = -layerOptions.offsetWidth/2 + layerOptionsWrapper.offsetWidth/2;
                maxClampPosX = layerOptions.offsetWidth/2 - layerOptionsWrapper.offsetWidth/2;
            }
            else {
                minClampPosX = -layerOptions.offsetWidth/3;
                maxClampPosX = layerOptions.offsetWidth/3;
            }
            // update our current pos
            currentPosX += displacementX;
            // check if the currentPosX is over our clamp values
            if (currentPosX > maxClampPosX) {
                currentPosX = maxClampPosX;
                layerOptions.classList.add("lerping");
                layerOptions.style.setProperty("--total-displacement", `${currentPosX}px`);
                return;
            }
            else if (currentPosX < minClampPosX) {
                currentPosX = minClampPosX;
                layerOptions.classList.add("lerping");
                layerOptions.style.setProperty("--total-displacement", `${currentPosX}px`);
                return;
            }

            // for swipe gestures....
                        
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
                layerOptions.style.setProperty("--total-displacement", `${currentPosX}px`);
                layerOptions.classList.add("lerping");
                // speed up the lerping animation if the total displacement is going to go over one of the clamp values
                if (currentPosX > maxClampPosX || currentPosX < minClampPosX)
                    layerOptions.style.setProperty("--transition-time", "0.3s");
            }
            // clear our array of displacements
            displacementXArray.splice(0);
            // reset displacementX
            displacementX = 0;

            this.currentMovingElement = null;
        });
        layerOptionsWrapper.addEventListener("pointermove", (ev: PointerEvent) => {
            if (this.currentMovingElement !== layerOptionsWrapper)
                return;

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
            layerOptions.style.setProperty("--total-displacement", `${totalDisplacementX}px`);
        });

        // this removes the lerpingMax/Min/lerping class after the item reaches back the clamp value and 
        // resets the total displacement property back to the clamped value
        layerOptionsWrapper.addEventListener("transitionend", (ev: TransitionEvent) => {
            if (ev.propertyName === "transform") {
                // for the case of a swipe gesture that goes over the clamp values...
                // shift the total displacement back to clamp value (sort of like a rebound effect: overshoot -> clamp back)
                if (currentPosX > maxClampPosX) {
                    currentPosX = maxClampPosX;
                    layerOptions.style.setProperty("--total-displacement", `${currentPosX}px`);
                    return;
                }
                else if (currentPosX < minClampPosX) {
                    currentPosX = minClampPosX;
                    layerOptions.style.setProperty("--total-displacement", `${currentPosX}px`);
                    return;
                }

                // layerOptions.style.setProperty("--total-displacement", `${currentPosX}px`);
                layerOptions.classList.remove("lerping");
                layerOptions.style.setProperty("--transition-time", "1s");
            }
        });
    }

    private initPullUpContainer(): void {
        const pullUpContainer: HTMLDivElement | null = document.querySelector(".pull-up-container");
        const pullUpContainerTab: HTMLDivElement | null | undefined = pullUpContainer?.querySelector(".pull-up-container__tab");
        const levelStackRouteFormFilterChecklistOverrideTogglesContainer: HTMLDivElement | null | undefined = (
            pullUpContainer?.querySelector(".pull-up-container__level-stack-route-form-filter-checklist-override-toggles-container")
        );
        const levelStack: HTMLDivElement | null | undefined = pullUpContainer?.querySelector(".level-stack");
        const routeFormFilterChecklistOverrideTogglesContainer: HTMLDivElement | null | undefined = (
            pullUpContainer?.querySelector(".route-form-filter-checklist-override-toggles__container")
        );

        if (
            pullUpContainer === null ||
            pullUpContainerTab === null ||
            pullUpContainerTab === undefined ||
            levelStackRouteFormFilterChecklistOverrideTogglesContainer === null ||
            levelStackRouteFormFilterChecklistOverrideTogglesContainer === undefined ||
            levelStack === null ||
            levelStack === undefined ||
            routeFormFilterChecklistOverrideTogglesContainer === null ||
            routeFormFilterChecklistOverrideTogglesContainer === undefined
        ) {
            console.warn(
                "Pull up container, children pull up tab, level stack route form filter overrides container, level stack container,",
                "and/or route form filter checklist override toggles container does not exist",
                `Pull Up Container Status: ${pullUpContainer}`,
                `Pull Up Container Tab Status: ${pullUpContainerTab}`,
                `Level Stack Route Form Filter Overrides Container Status: ${levelStackRouteFormFilterChecklistOverrideTogglesContainer}`,
                `Level Statck Status: ${levelStack}`,
                `Route Form Filter Checklist Override Toggles Container Status: ${routeFormFilterChecklistOverrideTogglesContainer}`
            );
            return;
        }

        // like layer options, turn off any touch actions and gesture overrides from the css
        pullUpContainer.style.touchAction = "none";
        // also set up some initial variables (mainly for orienting the pull up container during page loads)
        pullUpContainer.style.setProperty("--initial-vertical-offset", "100%");;

        // init variables for our touch like movement
        let startPosY: number = 0;
        let currentPosY: number = 0;
        let displacementY: number = 0;
        // this holds all the displacements from a single pointer down event (e.g. when user holds down on the screen)
        const displacementYArray: number[] = [];
        const arraySizeLimit: number = 500;
        // these values hold the min and max translation the layer options slider can move
        let minClampPosY: number = 0;
        let maxClampPosY: number = 0;

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
        console.log(increments);

        currentPosY = increments.pullUpTabIncrement;
        pullUpContainer.style.setProperty("--total-displacement", `${currentPosY}px`);

        pullUpContainer.addEventListener("pointerdown", (ev: PointerEvent) => {
            // don't set pointer capture because it basically prevents any children on pull up container from being interacted
            // with at all
            // pullUpContainer.setPointerCapture(ev.pointerId); 
            startPosY = ev.y;

            if (this.currentMovingElement === null)
                this.currentMovingElement = pullUpContainer;
        });

        pullUpContainer.addEventListener("pointerup", (ev: PointerEvent) => {
            if (this.currentMovingElement !== pullUpContainer)
                return;

            currentPosY += displacementY;
            // get the closest increment to our currentposy
            let closestPos: number = 0;
            const incrementsArray: number[] = Object.values(increments);
            for (let i = 0; i < incrementsArray.length; i++) {
                const pos: number | undefined = incrementsArray[i];
                // this should never occur but typescript compiler is strict
                if (pos === undefined)
                    return;
                if (i === 0) 
                    closestPos = pos;
                // there's gotta be a better way than using math.abs() ...
                if (Math.abs(pos - currentPosY) < Math.abs(closestPos - currentPosY))
                    closestPos = pos;
            }
            currentPosY = closestPos;
            pullUpContainer.style.setProperty("--total-displacement", `${currentPosY}px`);

            displacementY = 0;
            displacementYArray.splice(0);

            this.currentMovingElement = null;
        });

        pullUpContainer.addEventListener("pointermove", (ev: PointerEvent) => {
            if (this.currentMovingElement !== pullUpContainer)
                return;

            displacementY = ev.y - startPosY;
            if (displacementYArray.length === arraySizeLimit) 
                displacementYArray.shift();
            displacementYArray.push(displacementY);

            const totalDisplacement: number = currentPosY + displacementY;
            pullUpContainer.style.setProperty("--total-displacement", `${totalDisplacement}px`);
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
}