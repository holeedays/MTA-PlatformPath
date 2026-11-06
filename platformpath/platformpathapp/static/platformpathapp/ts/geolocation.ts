import { Vector2 } from "./transformations.ts";
import { getTotalTransformationMatrix, transformPoint, getPivot } from "./transformations.ts";

// extents is just like DOMRect but for coordinate systems and lacking the methods
interface Extents {
    west: number,
    south: number
    east: number,
    north: number
}

// types of geo converter callbacks here
type GeoConverterCallBack = "positionupdate";

class GeoConverter {
    private referenceElement: HTMLElement;
    private extents: Extents;
    private latLongDisplay: {
        element: HTMLDivElement,
        fn: (ev: MouseEvent) => void
    } | null = null;

    private onPositionUpdateCallbacks: (
        (absoluteMappedCoords: Vector2, relativeMappedCoords: Vector2, baseCoords: Vector2) => void
    )[] = [];

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
            // cycle through all the onPositionUpdateCallbacks and trigger them, passing the updated positions 
            this.onPositionUpdateCallbacks.forEach(
                (callback: (absoluteMappedCoords: Vector2, relativeMappedCoords: Vector2, baseCoords: Vector2) => void) => {
                    callback(
                        this.getAbsoluteMappedCoords(baseCoords), this.getRelativeMappedCoords(baseCoords), baseCoords
                    );
                }
            );
        });
    }

    // get what the coordinates of the point in latitude and longitude would be in browser space
    private getAbsoluteMappedCoords(baseCoords: Vector2): Vector2 {
        // get the mapped coords in the reference element's local space
        const relativeMappedCoords: Vector2 = this.getRelativeMappedCoords(baseCoords);
        // get the coords after the total transformation matrix has been applied to it
        const transformedCoords: Vector2 = transformPoint(
            // transform this point
            relativeMappedCoords, 
            // we're getting the full sequence of transformations from parent --> our reference element
            // this includes pivots at each hiearchy of the transformation so no need to explicitly state a pivot
            getTotalTransformationMatrix(this.referenceElement)
        );

        return transformedCoords;
    }

    // get the mapped coords of a lat and long coordinate in the relative space of the reference element (we do not apply any transformations
    // here)
    private getRelativeMappedCoords(baseCoords: Vector2): Vector2 {
        // get the extents
        // this is in standard cartesian plane axes by the way, where y up is positive
        const {north, west, south, east} = this.extents; 
        // get the lat and long coords relative to the extents
        const xRatio: number = (baseCoords.x - west) / (east - west);
        const yRatio: number = (north - baseCoords.y) / (north - south);

        return new Vector2(
            // offset width and height do not get changed by transforms so we'll use this 
            xRatio*this.referenceElement.offsetWidth, 
            yRatio*this.referenceElement.offsetHeight
        );
    }
    
    // convert a pos on the browser to lat and long
    // this is mainly for debugging purposes
    private getScreenPosToCoords(screenPos: Vector2): Vector2 {
        // pos * inverse matrix --> normalized pos
        // mapTopLeft * inverse matrix, mapBottomRight * inverseMatrix --> normalized topLeft & bottomRight
        // calculate normalized pos relative to normalized topLeft and bottomRight

        // the ideology is much the same as getAbsoluteCoords()

        // get the total transform matrix of the ref element
        const totalTransformMatrix: DOMMatrix = getTotalTransformationMatrix(this.referenceElement);
        // get the transformed pos of the screenPos with all transformations reversed
        const transformedPos: Vector2 = transformPoint(
            screenPos,
            totalTransformMatrix.inverse()
        );
        // since the pos is now normalized, we can use it with the normalized dimensions of the reference element
        const xRatio: number = (transformedPos.x - this.referenceElement.offsetLeft) / this.referenceElement.offsetWidth;
        const yRatio: number = (transformedPos.y - this.referenceElement.offsetTop) / this.referenceElement.offsetHeight;

        // get the extents
        const {north, west, south, east} = this.extents; 
        
        // get the coords (remember, it's (longitude, latitude) right now)
        const coords: Vector2 = new Vector2(
            west + xRatio * (east - west),
            north - yRatio * (north - south)
        );

        return coords;
    }

    // displays the coordinates of the mouse in coordinates of the given extents
    public enableMousePositionalLog(): void {
        if (this.latLongDisplay !== null)
            return;

        // create the display element
        const latLongDisplay: HTMLDivElement = document.createElement("div");
        // add styling
        latLongDisplay.classList.add("lat-long-display");
        // add the element to the body
        document.body.append(latLongDisplay);
        
        // create a handler for the mouse move event
        const handler : (ev: MouseEvent) => void = (ev: MouseEvent) => {
            const mousePos: Vector2 = new Vector2(ev.pageX, ev.pageY);
            const coords: Vector2 = this.getScreenPosToCoords(mousePos);
            // coords are usually read latitude (y) and then longitude (x)
            // however, the coords we use standardize it to long (x) and lat (y) 
            latLongDisplay.innerHTML = `LAT: ${coords.y} | LONG: ${coords.x}`;
        }; 

        // set the element and handler to the corresponding properties for the latLongDisplay field
        this.latLongDisplay = {element: latLongDisplay, fn: handler};
        // add that as an event listener
        window.addEventListener("mousemove", handler);
    }

    // deactivates the coordinates display of the mouse
    public disableMousePositionalLog(): void {
        if (this.latLongDisplay === null)
            return;

        // remove the event listener
        window.removeEventListener("mousemove", this.latLongDisplay.fn);
        // remove the node from the DOM
        this.latLongDisplay.element.remove();
        // send the element to garbage collection
        this.latLongDisplay = null;
    }

    // adds an event listener to the geoconverter
    public addEventListener(
        geoConverterCallback: GeoConverterCallBack, 
        callback: (absoluteMappedCoords: Vector2, relativeMappedCoords: Vector2, baseCoords: Vector2) => void
    ): void {
        if (geoConverterCallback === "positionupdate")
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
        img.addEventListener("load", () => this.onImageLoad(img, canvas, ctx));
    }

    // handler for after an image is loaded 
    private onImageLoad(img: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        // set our canvas dimensions, I'm just doing very arbitrary values here
        const canvasDimensions: Vector2 = new Vector2(800, 800);
        // NOTE: do not set the width and height through styling, using the explicit width and height attribute
        canvas.width = canvasDimensions.x;
        canvas.height = canvasDimensions.y;

        // this is to test absolute coords, non essential set up
        canvas.style.transform = "rotate(0deg) translateX(400px) scale(1.5)";

        // copy the image onto the canvas
        ctx.drawImage(img, 0, 0, canvasDimensions.x, canvasDimensions.y);
        // our test extents, got it from QGIS 
        const extents: Extents = {
            // EPSG:4326 (LAT LONG) | EPSG:6539 (NY LI (2011)) in US FT 
            west: -74.0045413,        // 982988.204
            south: 40.5659305,        // 145460.925
            east: -73.9787201,        // 990160.640
            north: 40.5856193         // 152633.361 
        }

        // const extents: Extents = {
        //     west: -74.0237248, // 977671.452
        //     south: 40.6988272, // 193878.950
        //     east: -73.9630886, // 994477.930
        //     north: 40.7449535   // 210685.428
        // };
        // instantiate the geoconverter
        const geoConverter: GeoConverter = new GeoConverter(canvas, extents);
        // initialize it
        geoConverter.init();

        // creating a toggle on/off for displaying the latitude and longitude 
        let isPressed: boolean = false;
        window.addEventListener("pointerup", () => {
            if (!isPressed)
                geoConverter.enableMousePositionalLog();
            else
                geoConverter.disableMousePositionalLog();

            isPressed = !isPressed;
        })

        // add event listener to draw on the canvas every position update
        geoConverter.addEventListener(
            "positionupdate", 
            (
                absoluteMappedCoords: Vector2, 
                relativeMappedCoords: Vector2, 
                baseCoords: Vector2
            ) => {

                ///////////////// testing absolute coords here
                const dummyPoint: HTMLDivElement = document.createElement("div");
                // add style
                dummyPoint.classList.add("dummy-point");
                // set the position
                dummyPoint.style.setProperty("--pos-x", `${absoluteMappedCoords.x}px`);
                dummyPoint.style.setProperty("--pos-y", `${absoluteMappedCoords.y}px`);
                // add the element to the document
                document.body.append(dummyPoint);


                //////////////// testing relative coords here
                // draw our circle to indicate where the person is in the picture
                ctx.beginPath();
                // ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle)
                ctx.ellipse(relativeMappedCoords.x, relativeMappedCoords.y, 10, 10, 0, 0, 2 * Math.PI);
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