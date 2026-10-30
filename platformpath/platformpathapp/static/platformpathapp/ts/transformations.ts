import { AngleType, lerp } from "./numeric_utils.ts";

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

        // NOTE: multiplying here by another vector is based on the Hadamard Product, so it's not like a geometric vector operation
        // (e.g. this isn't dot product, cross product) where the value reflects a sequence of linear transformations
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
    // the ratio is already normalized between epsilon and 1 with the lerp function it uses
    public lerp(vectorOrPoint: Vector2, lerpRatio: number): Vector2 {
        const x: number = this.x;
        const y: number = this.y;

        return new Vector2(
            lerp(x, vectorOrPoint.x, lerpRatio), 
            lerp(y, vectorOrPoint.y, lerpRatio)
        );
    }

    // the mutating version of the lerping
    public m_lerp(vectorOrPoint: Vector2, lerpRatio: number): Vector2 {
        const resultantVector: Vector2 = this.lerp(vectorOrPoint, lerpRatio);
        this.x = resultantVector.x;
        this.y = resultantVector.y;

        return resultantVector;
    }

    // (NON MUTATING) applies a rotation to this vector around the origin and returns it
    public rotate(angle: number, angleType: AngleType): Vector2 {
        let x: number = this.x;
        let y: number = this.y;

        // since sin/cos run in radians, we have to convert the angle to radians by default
        const angleInRad: number = angleType === AngleType.DEGREES ? angle * (Math.PI / 180): angle ; 
        // this is the formula for applying a rotation of an angle to a 2x1 vector around the origin  
        x = x * Math.cos(angleInRad) - y * Math.sin(angleInRad);
        y = x * Math.sin(angleInRad) + y * Math.cos(angleInRad);

        return new Vector2(x, y);
    }

    // the mutating version of rotate 
    public m_rotate(angle: number, angleType: AngleType): Vector2 {
        const resultantVector: Vector2 = this.rotate(angle, angleType);
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
