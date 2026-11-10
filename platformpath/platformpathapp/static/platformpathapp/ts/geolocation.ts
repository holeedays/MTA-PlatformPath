import { Vector2 } from "./transformations.ts";
import { normalizeAngle, AngleType } from "./numeric_utils.ts";
import { getTotalTransformationMatrix, transformPoint } from "./transformations.ts";
// import panzoom from "panzoom";

// extents is just like DOMRect but for coordinate systems and lacking the methods
export interface Extents {
    west: number,
    south: number
    east: number,
    north: number
}

// types of geo converter callbacks here
export type GeoConverterCallBack = "positionupdate";

export class GeoConverter {
    private referenceElement: HTMLElement | SVGSVGElement;
    private extents: Extents;
    private latLongDisplay: {
        element: HTMLDivElement,
        fn: (ev: MouseEvent) => void
    } | null = null;
    private watchPositonID: number | null = null;

    private onPositionUpdateCallbacks: ((
            coords: {absolute: Vector2, relative: Vector2, base: Vector2},
            heading: {absolute: number, relative: number, base: number} | null
    ) => void)[] = [];

    constructor(referenceElement: HTMLElement | SVGSVGElement, extents: Extents) {
        this.referenceElement = referenceElement;
        this.extents = extents;
    }

    // start the geolocating logic
    public init(): void {
        console.log("Attempting to geolocate...");

        // just doing this to make it easier for syntax wise
        const geolocationObj: Geolocation = navigator.geolocation;
        if (!geolocationObj) {
            console.log("User has denied permission to utilize their location");
            return;
        }

        // this is fired whenever the users position's changes
        // also get the id, so it could be used later to remove any event listeners that were added for watchPosition()
        this.watchPositonID = geolocationObj.watchPosition((pos: GeolocationPosition) => {
            // get the coords object from the geolocation position
            const geoCoords: GeolocationCoordinates = pos.coords;
            console.log(geoCoords.latitude, geoCoords.longitude, geoCoords.heading);

            // get the lat and long in a vector2 format
            const baseCoords: Vector2 = new Vector2(geoCoords.longitude, geoCoords.latitude);
            // cycle through all the onPositionUpdateCallbacks and trigger them, passing the updated positions 
            this.onPositionUpdateCallbacks.forEach(
                (callback: (
                    coords: {absolute: Vector2, relative: Vector2, base: Vector2},
                    heading: {absolute: number, relative: number, base: number} | null
                ) => void) => {
                    // create a coords and heading objs
                    const coords: {absolute: Vector2, relative: Vector2, base: Vector2} = {
                        // both absolute and relative coords are calculated differently depending on whether the reference
                        // element is an SVG element or a HTML element
                        absolute: (        
                            this.referenceElement instanceof HTMLElement ? 
                            this.getAbsoluteMappedCoords(baseCoords) :
                            this.getAbsoluteMappedCoordsSVG(baseCoords)
                        ), 
                        relative: (  
                            this.referenceElement instanceof HTMLElement ? 
                            this.getRelativeMappedCoords(baseCoords) :
                            this.getRelativeMappedCoordsSVG(baseCoords)
                        ), 
                        base: baseCoords
                    };
                    const heading: {absolute: number, relative: number, base: number} | null = (
                        geoCoords.heading === null ?
                        null :
                        {
                            // as for heading, absolute heading is also dependent on whether the reference element is a SVG
                            // element or a HTML element
                            absolute: (
                                this.referenceElement instanceof HTMLElement ? 
                                this.getAbsoluteHeading(geoCoords.heading) :
                                this.getAbsoluteHeadingSVG(geoCoords.heading)
                            ), 
                            relative: this.getRelativeHeading(geoCoords.heading), 
                            base: geoCoords.heading ?? 0
                        }
                    );

                    // pass it to the callback
                    callback(coords, heading);
                }
            );
        });
    }

    // disables any geolocation event listeners
    public disable(): void {
        // check if geolocation is allowed by the user
        const geolocationObj: Geolocation = navigator.geolocation;
        if (!geolocationObj) {
            console.log("User has denied permission to utilize their location");
            return;
        }
        // check if an event listener has been set
        if (this.watchPositonID === null) {
            console.warn("There are no event listeners set");
            return;
        }
        // if there are, clear the event listener
        geolocationObj.clearWatch(this.watchPositonID);
    }

    // get what the coordinates of the point in latitude and longitude would be in browser space
    private getAbsoluteMappedCoords(baseCoords: Vector2): Vector2 {
        if (this.referenceElement instanceof SVGSVGElement) {
            console.warn("Cannot use this method for an SVG element");
            return new Vector2();
        }

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

    // the SVG variation of getAbsoluteMappedCoords()
    private getAbsoluteMappedCoordsSVG(baseCoords: Vector2): Vector2 {
        if (this.referenceElement instanceof HTMLElement) {
            console.warn("Cannot use this method for an HTML element");
            return new Vector2();
        }

        // get the relative mapped coords
        const relativeMappedCoords: Vector2 = this.getRelativeMappedCoordsSVG(baseCoords);
        // get the transform matrix that converts SVG local space to global space
        const transformMatrix: DOMMatrix | null = this.referenceElement.getScreenCTM();
        if (transformMatrix === null) {
            console.warn("Could not retrieve transform matrix from SVG element: ", this.referenceElement);
            return new Vector2();
        }

        // get the coords after the total transformation matrix has been applied to it
        const transformedCoords: Vector2 = transformPoint(
            // transform this point
            relativeMappedCoords, 
            // apply the SVG matrix
            transformMatrix
        );

        return transformedCoords;
    }

    // get the mapped coords of a lat and long coordinate in the relative space of the reference element (we do not apply any transformations
    // here)
    private getRelativeMappedCoords(baseCoords: Vector2): Vector2 {
        if (this.referenceElement instanceof SVGSVGElement) {
            console.warn("Cannot use this method for an SVG element");
            return new Vector2();
        }

        // get the extents
        // this is in standard cartesian plane axes by the way, where y up is positive
        const {north, west, south, east} = this.extents; 
        // get the lat and long coords relative to the extents
        const xRatio: number = (baseCoords.x - west) / (east - west);
        const yRatio: number = (north - baseCoords.y) / (north - south);
        // get the offset dimensions (untransformed dimensions) of the ref element
        const offsetDimensions: Vector2 = new Vector2(this.referenceElement.offsetWidth, this.referenceElement.offsetHeight);

        return new Vector2(
            // these width and height dimensions represent the untransformed widths and height of an element
            xRatio*offsetDimensions.x, 
            yRatio*offsetDimensions.y
        );
    }

    // the SVG variation of getRelativeMappedCoords()
    private getRelativeMappedCoordsSVG(baseCoords: Vector2): Vector2 {
        if (this.referenceElement instanceof HTMLElement) {
            console.warn("Cannot use this method for an HTML element");
            return new Vector2();
        }

        // get the extents
        // this is in standard cartesian plane axes by the way, where y up is positive
        const {north, west, south, east} = this.extents; 
        // get the lat and long coords relative to the extents
        const xRatio: number = (baseCoords.x - west) / (east - west);
        const yRatio: number = (north - baseCoords.y) / (north - south);
        // get the viewbox of the SVG (the dimensions can be found in the attributes of the root of the SVG [the one with xmlns])
        // also bbox is drastically different from viewBox so use viewBox for more consistent layouts
        const viewBox: DOMRect = this.referenceElement.viewBox.baseVal;

        return new Vector2(
            // these width and height dimensions represent the local space of the SVG, unaffected by transforms
            xRatio*viewBox.width, 
            yRatio*viewBox.height
        );
    }
    
    // convert a pos on the browser to lat and long
    // this is mainly for debugging purposes
    private getScreenPosToCoords(screenPos: Vector2): Vector2 {
        if (this.referenceElement instanceof SVGSVGElement) {
            console.warn("Cannot use this method for an SVG element");
            return new Vector2();
        }

        // pos * inverse matrix --> normalized pos
        // mapTopLeft * inverse matrix, mapBottomRight * inverseMatrix --> normalized topLeft & bottomRight
        // calculate normalized pos relative to normalized topLeft and bottomRight

        // the ideology is much the same as getAbsoluteCoords()

        // get the total transform matrix of the ref element
        const totalTransformMatrix: DOMMatrix = getTotalTransformationMatrix(this.referenceElement);
        // get the transformed pos of the screenPos with all transformations reversed (global to local)
        const transformedPos: Vector2 = transformPoint(
            screenPos,
            totalTransformMatrix.inverse()
        );
        // get the offset dimensions of the element
        const {offsetWidth, offsetHeight} = this.referenceElement;
        // since the pos is now in the ref element's local space, we treat the top left as (0,0) and calculate the ratio from there
        const xRatio: number = transformedPos.x / offsetWidth;
        const yRatio: number = transformedPos.y / offsetHeight;

        // get the extents
        const {north, west, south, east} = this.extents; 
        
        // get the coords (remember, it's (longitude, latitude) right now)
        const coords: Vector2 = new Vector2(
            west + xRatio * (east - west),
            north - yRatio * (north - south)
        );

        return coords;
    }

    // the SVG variation of getScreenPosToCoords()
    private getScreenPosToCoordsSVG(screenPos: Vector2): Vector2 {
        if (this.referenceElement instanceof HTMLElement) {
            console.warn("Cannot use this method for an HTML element");
            return new Vector2();
        }

        // get the transform matrix that converts SVG local space to global space
        const transformMatrix: DOMMatrix | null = this.referenceElement.getScreenCTM();
        if (transformMatrix === null) {
            console.warn("Could not retrieve transform matrix from SVG element: ", this.referenceElement);
            return new Vector2();
        }

        // apply the inverse of the transform matrix to convert global space to SVG local space
        const transformedPos: Vector2 = transformPoint(screenPos, transformMatrix.inverse());
        // get the viewBox for the local, untransformed dimensions of the element
        const viewBox: DOMRect = this.referenceElement.viewBox.baseVal;

        // since the pos is now in the ref element's local space, we treat the top left viewBox.x & viewBox.y and calculate the 
        // ratio from there
        const xRatio: number = (transformedPos.x - viewBox.x) / viewBox.width;
        const yRatio: number = (transformedPos.y - viewBox.y) / viewBox.height;

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
            const mousePos: Vector2 = new Vector2(ev.clientX, ev.clientY);
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

    // get the heading given (in degrees) to a positive angle in global space (this is equivalent to 
    // reference element's rot in world space + heading)
    private getAbsoluteHeading(headingDeg: number): number {
        // for improper function calls, just return 0
        if (this.referenceElement instanceof SVGSVGElement) {
            console.warn("Cannot use this method for an SVG element");
            return 0;
        }

        // atan2(b, a) gives the angle of the transformed X axis, but doesn't capture
        // how other directions change under nonuniform scaling or skew.
        // For example, [a=2, b=0, c=0, d=1, e=0, f=0] scales X by 2:
        // atan2(b, a) = 0 rad (rot over x axis) yet vector (1, 1), when multiplied by the matrix, becomes (2, 1), 
        // changing its angle from PI/4 to atan2(1, 2) ~ 0.464 rad
        // therefore, we transform the actual heading vector and calculate its resulting angle, excluding translation because 
        // directions have no position.
        // the method below does just that

        // get the heading in radians and refer to relative to the x axis (heading is relative to y axis (true North) by default)
        const headingRad: number = headingDeg * Math.PI / 180 - Math.PI / 2;
        // get a directional vector that represents the angle
        const directionalVector: Vector2 = new Vector2(
            Math.cos(headingRad),  // adj
            Math.sin(headingRad)   // opposite
        );
        // get the scalar and skew (the rotation componenets) components from the total transform matrix that converts child 
        // space to world space 
        const {a, b, c, d} = getTotalTransformationMatrix(this.referenceElement);
        // transform our directional vector by the total transform matrix
        const newDirectionalVector: Vector2 = transformPoint(directionalVector, new DOMMatrix([a, b, c, d, 0, 0]));
        // get our rotation in degrees, change the rotation back being relative to the y axis
        const totalRotDeg: number = Math.atan2(newDirectionalVector.y, newDirectionalVector.x) * 180 / Math.PI + 90;

        // normalize the angle
        return normalizeAngle(totalRotDeg, AngleType.DEGREES);
    }

    // the SVG variation of getAbsoluteHeading()
    private getAbsoluteHeadingSVG(headingDeg: number): number {
        if (this.referenceElement instanceof HTMLElement) {
            console.warn("Cannot use this method for an HTML element");
            return 0;
        }

        // get the heading in radians and refer to relative to the x axis (heading is relative to y axis (true North) by default)
        const headingRad: number = headingDeg * Math.PI / 180 - Math.PI / 2;
        // get a directional vector that represents the angle
        const directionalVector: Vector2 = new Vector2(
            Math.cos(headingRad),  // adj
            Math.sin(headingRad)   // opposite
        );
        // get the scalar and skew (the rotation componenets) components from the total transform matrix that converts child 
        // space to world space 

        // get the transform matrix that converts SVG local space to global space
        const transformMatrix: DOMMatrix | null = this.referenceElement.getScreenCTM();
        if (transformMatrix === null) {
            console.warn("Could not retrieve transform matrix from SVG element: ", this.referenceElement);
            return 0;
        }
        // get the non translation components from the matrix
        const {a, b, c, d} = transformMatrix;
        // transform our directional vector by the total transform matrix
        const newDirectionalVector: Vector2 = transformPoint(directionalVector, new DOMMatrix([a, b, c, d, 0, 0]));
        // get our rotation in degrees, change the rotation back being relative to the y axis
        const totalRotDeg: number = Math.atan2(newDirectionalVector.y, newDirectionalVector.x) * 180 / Math.PI + 90;

        // normalize the angle
        return normalizeAngle(totalRotDeg, AngleType.DEGREES);
    }

    // normalizes the heading given (in degrees) to a positive angle in local space of the reference element
    private getRelativeHeading(headingDeg: number): number {
        // heading rotation is read clockwise from true north (e.g. 30 degrees = 30 degrees clockwise), this aligns with browser rot
        // which has the y axis flipped over the x axis, no need for degree change here
        return normalizeAngle(headingDeg, AngleType.DEGREES);
    }

    // adds an event listener to the geoconverter
    public addEventListener(
        geoConverterCallback: GeoConverterCallBack, 
        callback: (
            coords: {absolute: Vector2, relative: Vector2, base: Vector2},
            heading: {absolute: number, relative: number, base: number} | null
        ) => void
    ): void {
        if (geoConverterCallback === "positionupdate")
            this.onPositionUpdateCallbacks.push(callback);
    }
}

export class GeoConverterTestPage {
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
        // canvas.style.transform = "rotate(0deg) translateX(400px) scale(1.5)";
        // creating a panzoom to test this
        // @ts-ignore
        panzoom(canvas, {minZoom: 0.1, maxZoom: 2000, smoothScroll: false});

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
                coords: {absolute: Vector2, relative: Vector2, base: Vector2},
                heading: {absolute: number, relative: number, base: number} | null
            ) => {

                ///////////////// testing absolute coords here
                const dummyPoint: HTMLDivElement = document.createElement("div");
                // add style
                dummyPoint.classList.add("dummy-point");
                // set the position
                dummyPoint.style.setProperty("--pos-x", `${coords.absolute.x}px`);
                dummyPoint.style.setProperty("--pos-y", `${coords.absolute.y}px`);
                // add the element to the document
                document.body.append(dummyPoint);


                //////////////// testing relative coords here
                // draw our circle to indicate where the person is in the picture
                ctx.beginPath();
                // ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle)
                ctx.ellipse(coords.relative.x, coords.relative.y, 10, 10, 0, 0, 2 * Math.PI);
                // set fill
                ctx.fillStyle = "#0000ff";
                ctx.fill();
                // and a small stroke
                ctx.lineWidth = 3;
                ctx.strokeStyle = "#000000";
                ctx.stroke();
            }
        );
    }
}