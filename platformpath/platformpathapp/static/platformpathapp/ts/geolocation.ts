import { Vector2 } from "./transformations.ts";
import { AngleType } from "./numeric_utils.ts";

// extents is just like DOMRect but for coordinate systems and lacking the methods
interface Extents {
    west: number,
    north: number,
    east: number,
    south: number,
}

// types of geo converter callbacks here
type GeoConverterCallBack = "onPositionUpdate";

class GeoConverter {
    private referenceElement: HTMLElement;
    private extents: Extents;

    private onPositionUpdateCallbacks: ((mappedCoords: Vector2, baseCoords: Vector2) => void)[] = [];

    constructor(referenceElement: HTMLElement, extents: Extents) {
        this.referenceElement = referenceElement;
        this.extents = extents;
    }

    // start the geolocating logic
    public init(): void {
        console.log("Attempting to geolocate...");

        // just doing this to make it easier for syntax wise
        const geolocationObj: Geolocation =  navigator.geolocation;
        if (!geolocationObj) {
            console.log("User has denied permission to utilize their location");
            return;
        }

        // this is fired whenever the users position's changes
        geolocationObj.watchPosition((pos: GeolocationPosition) => {
            const coords: GeolocationCoordinates  = pos.coords;
            console.log(coords.latitude, coords.longitude);

            // get the lat and long in a vector2 format
            const baseCoords: Vector2 = new Vector2(coords.longitude, coords.latitude);
            // cycle through all the onPositionUpdateCallbacks and trigger them
            this.onPositionUpdateCallbacks.forEach(
                (callback: (mappedCoords: Vector2, baseCoords: Vector2) => void) => {
                    callback(
                        this.getMappedCoords(baseCoords), baseCoords
                    );
                }
            );
        });
    }

    // get what the coordinates of the point in latitude and longitude would be in the reference element's space
    private getMappedCoords(baseCoords: Vector2): Vector2 {
        // get the extents as top-left and bottom-right vector 2
        const extentsTopLeft: Vector2 = new Vector2(this.extents.west, this.extents.north);
        const extentsBottomRight: Vector2 = new Vector2(this.extents.east, this.extents.south);
        // get the ratio of the base coord in respect to the width and height of the extents
        const xRatio: number = Math.abs(extentsTopLeft.x - baseCoords.x) / Math.abs(extentsTopLeft.x - extentsBottomRight.x);
        const yRatio: number = Math.abs(extentsTopLeft.y - baseCoords.y) / Math.abs(extentsTopLeft.y - extentsBottomRight.y);
        // this is the coordinate of the reference element's top left UNTRANSFORMED (before any scaling/rotation/scaling)
        const refElementTopLeftNormalized: Vector2 = new Vector2(this.referenceElement.offsetLeft, this.referenceElement.offsetTop);
        // get the translation of the element in UNTRANSFORMED (before any scaling/rotation/scaling) space
        const mappedDisplacement: Vector2 = new Vector2(
            this.referenceElement.offsetWidth * xRatio,
            this.referenceElement.offsetHeight * yRatio
        );

        // get the transform matrix of the reference element
        // matrix = [a, b, c, d, e, f ]
        // = [horizontal scale, vertical skew, horizontal skew, vertical scale, horizontal translation, vertical translation]
        const style: CSSStyleDeclaration = window.getComputedStyle(this.referenceElement);
        const elementRefTransformations: DOMMatrix = new DOMMatrix(style.transform);

        // get the total rotation the element has rotated from the matrix
        const refElementRotInRad: number = Math.atan2(elementRefTransformations.b, elementRefTransformations.a);
        // get the total translation the element has made from the matrix
        const refElementTranslation: Vector2 = new Vector2(elementRefTransformations.e, elementRefTransformations.f);
        // get the scale factor of the reference element from the matrix
        const refElementScale: Vector2 = new Vector2(elementRefTransformations.a, elementRefTransformations.d);

        return (
            // get the UNTRANSFORMED (before any scaling/rotation/translation) top left of our reference element
            refElementTopLeftNormalized
            // shift to the position where the coords would sit on the element's space UNTRANSFORMED
            .add(mappedDisplacement)
            // now scale the transformed point by the current scale of the current element
            // NOTE: general rule of thumb is apply the scale first then the rotation since it is matrix math after all, which is sequential
            .multiply(refElementScale)
            // now apply the reference element's rotation to this element
            // do the standard move to origin, rotate the point, and then move the point back
            .subtract(refElementTranslation)
            .rotate(refElementRotInRad, AngleType.RADIANS)
            .add(refElementTranslation)

        );
    }

    // adds an event listener to the geoconverter
    public addEventListener(
        geoConverterCallback: GeoConverterCallBack, 
        callback: (mappedCoords: Vector2, baseCoords: Vector2) => void
    ): void {
        if (geoConverterCallback === "onPositionUpdate")
            this.onPositionUpdateCallbacks.push(callback);
    }
}

class GeoConverterTest {
    constructor() {
    }

    // initializes the geoconverter test
    public init(): void {
        const canvas: HTMLCanvasElement | null = document.querySelector("canvas");
        const djangoConfig: HTMLDivElement | null = document.querySelector("#django_config");

        if (canvas === null || djangoConfig === null || djangoConfig.dataset.staticPath === undefined) {
            console.warn(
                "Canvas, django config elements, and/or data-static=path attribute (on the django config element) doesn't exist",
                `Canvas Status: ${canvas}`,
                `Django Config Status: ${canvas}`,
                `Django Config Static Path Attribute Status: ${djangoConfig?.dataset.staticPath}`
            );
            return;
        }

        // get the 2D context from the canvas since we're drawing stuff on it
        const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");

        if (ctx === null) {
            console.warn("Either the context is incorrectly put in or another context has been initialized for the current canvas");
            return;
        }

        // create a new image object 
        const img: HTMLImageElement = new Image();
        // set its source to our test image, which we have coordinates for
        img.src = djangoConfig.dataset.staticPath + "platformpathapp/test_assets/geolocation_test.png"
        // create a callback after the image has been successfully loaded into the DOM
        img.addEventListener("load", () => this.handleImageLoad(img, canvas, ctx));
    }

    // handler for after an image is loaded 
    private handleImageLoad(img: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        // set our canvas dimensions, I'm just doing very arbitrary values here
        const canvasDimensions: Vector2 = new Vector2(800,800);
        // NOTE: do not set the width and height through styling, using the explicit width and height attribute
        canvas.width = canvasDimensions.x;
        canvas.height = canvasDimensions.y;

        // copy the image onto the canvas
        ctx.drawImage(img, 0, 0, canvasDimensions.x, canvasDimensions.y);
        // our test extents, got it from QGIS 
        const extents: Extents = {
            // EPSG:4326 (LAT LONG) | EPSG:6539 (NY LI (2011)) in US FT 
            west: -74.0045413,        // 982988.204
            north: 40.5856193,        // 152633.361 
            east: -73.9787201,        // 990160.640
            south: 40.5659305         // 145460.925
        }
        // instantiate the geoconverter
        const geoConverter: GeoConverter = new GeoConverter(canvas, extents);
        // initialize it
        geoConverter.init();
        // add event listener to draw on the canvas every position update
        geoConverter.addEventListener("onPositionUpdate", (mappedCoords: Vector2, baseCoords: Vector2) => {
            // get bounding rect to get translation from top left of parent container
            // mappedCoords is the translation of the point from the top left to on the element (the canvas in this case) in 
            // browser viewport space (not within the canvas hence we need to get the translation) 
            const canvasBoundingRect: DOMRect = canvas.getBoundingClientRect();
            const canvasCoords: Vector2 = new Vector2(
                mappedCoords.x - canvasBoundingRect.left, 
                mappedCoords.y - canvasBoundingRect.top
            );

            // draw our circle to indicate where the person is in the picture
            ctx.beginPath();
            // ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle)
            ctx.ellipse(canvasCoords.x, canvasCoords.y, 10, 10, 0, 0, 2 * Math.PI);
            // set fill
            ctx.fillStyle = "#0000ff";
            ctx.fill();
            // and a small stroke
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#000000";
            ctx.stroke();
        });
    }
}

const geoConverterTest: GeoConverterTest = new GeoConverterTest();
geoConverterTest.init();