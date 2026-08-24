import { StationMapPage } from './station_map_page.ts';
import { URLHandler } from './url_handler.ts';

export class StationMapPageMobile extends StationMapPage {
    constructor() {
        super();
    }

    // normally, ts, c++, c# etc... lets you modify the return type (e.g. as long as the types are similar (like promise<void> and
    // promise<string> in this case, the compiler won't throw a fit) BUT our compiler settings ("module":"nodenext") is enforcing
    // strict type returns since it's making the methods be treated as properties rather than methods)
    // For instance: though StationMapPage's init(): Promise<void> is a method, it is being treated as init: () => Promise<void>
    // in the d.ts file (which is the transpiled version of our ts code)
    public override async init(): Promise<void> {
        this.initMobile();
        await super.initBase();
    }

    // umbrella container for mobile only functions
    public initMobile(): void {
        // init dragging/touch behavior of the layer options panel
        this.initLayerOptionsPanel();
    }

    // this is a mobile specific layer options
    private initLayerOptionsPanel(): void {
        const layerOptions: HTMLDivElement | null = document.querySelector("#layer-options");

        // user touches layer options container, let's say it's overflowing off the screen
        // on touch the user's xy position is marked
        // it is dragged across (measuring displacement)
        // container transforms that distance left and right :)
        // same goes for a non overflowing layer options container. HOWEVER, if the container's left or right limit is in view
        // of the browser and the user continually swipes that way, move the container back on touch release

        if (layerOptions === null) {
            console.warn("Layer options container doesn't exist");
            return;
        }

        // layerOptions.addEventListener("touchmove", (e: TouchEvent) => {
        //     const touch = e.touches[0];
        //     console.log(touch?.pageX, touch?.pageY);
        // });

        // removes css determination for swiping behavior, now pointer move behaves like touchmove
        layerOptions.style.touchAction = "none"; 
        // init variables for our touch like movement
        let startPosX: number = 0;
        let currentPosX: number = 0;
        let displacementX: number = 0;

        // set the highest value and lowest value of layer options
        const minClampValue: number = -layerOptions.offsetWidth/2;
        const maxClampValue: number = layerOptions.offsetWidth/2;
        // set these values to css properties in the layer options class
        // --max-displacement is used in .lerpingPos & --min-displacement is used in .lerpingNeg
        layerOptions.style.setProperty("--max-displacement", `${maxClampValue}px`);
        layerOptions.style.setProperty("--min-displacement", `${minClampValue}px`);

        // set event listeners for pointerdown, pointerup, pointermove (basically a hybrid event listener for pc and touch devices)
        layerOptions.addEventListener("pointerdown", (ev: PointerEvent) => {
            // NOTE: this is very important, this keeps focus on the item
            layerOptions.setPointerCapture(ev.pointerId);
            // set start pos x
            startPosX = ev.x;
        });
        layerOptions.addEventListener("pointerup", (ev: PointerEvent) => {
            currentPosX += displacementX;
            // clamp currentPosX if it reaches these certain values and add a class if it does
            if (currentPosX > maxClampValue) {
                currentPosX = maxClampValue;
                layerOptions.classList.add("lerpingPos");
            }
            else if (currentPosX < minClampValue) {
                currentPosX = minClampValue;
                layerOptions.classList.add("lerpingNeg");
            }
            // reset displacementX
            displacementX = 0;
        });
        layerOptions.addEventListener("pointermove", (ev: PointerEvent) => {
            // calculate the change in x-axis from the startPosX (which is set on touchdown)
            displacementX = ev.x - startPosX;
            // find the total displacement
            const totalDisplacementX: number = currentPosX + displacementX;
            // translate by that value
            layerOptions.style.setProperty("--total-displacement", `${totalDisplacementX}px`);
        });

        // this removes the lerpingPos/Neg class after the item reaches back the clamp value and resets total displacement
        // back to the clamped value
        layerOptions.addEventListener("transitionend", (ev: TransitionEvent) => {
            if (ev.propertyName === "transform") {
                layerOptions.classList.remove("lerpingPos", "lerpingNeg");
                layerOptions.style.setProperty("--total-displacement", `${currentPosX}px`);
            }
        });
    }
}