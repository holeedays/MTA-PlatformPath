import {clamp} from "./utils.ts";

// just make a class to hold 2D information (would've been struct if I could define function bodies inside interfaces)
// this is actually pretty memory efficient so no performance overhead issues here
export class Vector2 {
    public x: number; 
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    // NOTE: m_ prefix signifies that the operation mutates the vector
    // below are basic functions pertaining to vector math

    public multiply(vectorOrScalar: Vector2 | number): Vector2 {
        let x: number = this.x;
        let y: number = this.y;

        if (vectorOrScalar instanceof Vector2) {
            x *= vectorOrScalar.x;
            y *= vectorOrScalar.y;
        }
        else {
            x *= vectorOrScalar;
            y *= vectorOrScalar;
        }

        return new Vector2(x, y);
    }

    public m_multiply(vectorOrScalar: Vector2 | number): Vector2 {
        const resultantVector: Vector2 = this.multiply(vectorOrScalar);
        this.x = resultantVector.x;
        this.y = resultantVector.y;

        return resultantVector;
    }

    public divide(vectorOrScalar: Vector2 | number): Vector2 {
        let x: number = this.x;
        let y: number = this.y;

        if (vectorOrScalar instanceof Vector2) {
            x /= vectorOrScalar.x;
            y /= vectorOrScalar.y;
        }
        else {
            x /= vectorOrScalar;
            y /= vectorOrScalar;
        }

        return new Vector2(x, y);
    }

    public m_divide(vectorOrScalar: Vector2 | number): Vector2 {
        const resultantVector: Vector2 = this.divide(vectorOrScalar);
        this.x = resultantVector.x;
        this.y = resultantVector.y;

        return resultantVector;
    }

    public add(vector: Vector2): Vector2 {
        let x: number = this.x;
        let y: number = this.y;

        x += vector.x;
        y += vector.y;
        
        return new Vector2(x, y);
    }

    public m_add(vector: Vector2): Vector2 {
        const resultantVector: Vector2 = this.add(vector);
        this.x = resultantVector.x;
        this.y = resultantVector.y;

        return resultantVector;
    }

    public subtract(vector: Vector2): Vector2 {
        let x: number = this.x;
        let y: number = this.y;

        x -= vector.x;
        y -= vector.y;
        
        return new Vector2(x, y);
    }

    public m_subtract(vector: Vector2): Vector2 {
        const resultantVector: Vector2 = this.subtract(vector);
        this.x = resultantVector.x;
        this.y = resultantVector.y;

        return resultantVector;
    }

    // (NON MUTATING) linearly interpolates this vector to a given point or vector by a given ratio
    // the ratio is normalized between epsilon and 1
    public lerp(vectorOrPoint: Vector2, lerpRatio: number): Vector2 {
        const ratioNormalized: number = clamp(lerpRatio, Number.EPSILON, 1);

        const x: number = this.x;
        const y: number = this.y;

        const currentVector: Vector2 = new Vector2(x, y);

        return (
            vectorOrPoint
            .subtract(currentVector)
            .multiply(ratioNormalized)
            .add(currentVector)
        );
    }

    // the mutating version of the lerping
    public m_lerp(vectorOrPoint: Vector2, lerpRatio: number): Vector2 {
        const resultantVector: Vector2 = this.lerp(vectorOrPoint, lerpRatio);
        this.x = resultantVector.x;
        this.y = resultantVector.y;

        return resultantVector;
    }

    // get the distance of this vector from another vector/point (both represent the same thing)
    public getDist(vectorOrPoint: Vector2): number {
        return Math.sqrt(
            (this.y - vectorOrPoint.y) ** 2 + 
            (this.x - vectorOrPoint.x) ** 2
        );
    }
}

// gets the current transform of an element (returns a transform matrix)
export function getCurrentTransformMatrix(element: HTMLElement | SVGGraphicsElement): DOMMatrix {
    const currentStyle: CSSStyleDeclaration = window.getComputedStyle(element);
    const matrix: DOMMatrix = new DOMMatrix(currentStyle.transform);
    return matrix;
}

// gets the offset/translation between the centers of two elements
export function getElementCentersOffset(
    elementOne: HTMLElement | SVGGraphicsElement,
    elementTwo: HTMLElement | SVGGraphicsElement
): Vector2 {
    const elementOneCenter: Vector2 = getCenterOfElement(elementOne);
    const elementTwoCenter: Vector2 = getCenterOfElement(elementTwo);

    const x: number = elementOneCenter.x - elementTwoCenter.x;
    const y: number = elementOneCenter.y - elementTwoCenter.y;

    return new Vector2(x, y);
}

// get the center of an element
export function getCenterOfElement(element: HTMLElement | SVGGraphicsElement): Vector2 {
    const elementBoundingRect: DOMRect = element.getBoundingClientRect();
    const x: number = elementBoundingRect.left + elementBoundingRect.width/2;
    const y: number = elementBoundingRect.top + elementBoundingRect.height/2;

    return new Vector2(x, y);
}

// tells if two element's bounding client rect are intersecting
export function boundingRectsAreIntersecting(
    elementOne: HTMLElement | SVGGraphicsElement,
    elementTwo: HTMLElement | SVGGraphicsElement
): boolean {
    const elementOneBoundingRect: DOMRect = elementOne.getBoundingClientRect();
    const elementTwoBoundingRect: DOMRect = elementTwo.getBoundingClientRect();

    return (
        elementOneBoundingRect.left < elementTwoBoundingRect.right &&
        elementOneBoundingRect.right > elementTwoBoundingRect.left &&
        elementOneBoundingRect.top < elementTwoBoundingRect.bottom &&
        elementOneBoundingRect.bottom > elementTwoBoundingRect.top
    );
}
