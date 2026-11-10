import { AngleType, lerp } from "./numeric_utils.ts";

// just make a class to hold 2D information (would've been struct if I could define function bodies inside interfaces)
// this is actually pretty memory efficient so no performance overhead issues here
export class Vector2 {
    public x: number; 
    public y: number;

    constructor(x: number = 0, y: number = 0) {
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
        // since sin/cos run in radians, we have to convert the angle to radians by default
        const angleInRad: number = angleType === AngleType.DEGREES ? angle * (Math.PI / 180): angle ; 
        // this is the formula for applying a rotation of an angle to a 2x1 vector around the origin  
        const x = this.x * Math.cos(angleInRad) - this.y * Math.sin(angleInRad);
        const y = this.x * Math.sin(angleInRad) + this.y * Math.cos(angleInRad);

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

// gets all the complete transformation matrix of an element (e.g. the product matrix of all transformation matrices of its parents 
// (and itself) multiplied together in sequence) including any padding and margin offsets
// this converts a point in local space of the element to world space
// NOTE: this only works for HTMLElements not SVGElements due to them not having dedicated offsets properties
export function getTotalTransformationMatrix(element: HTMLElement): DOMMatrix {
    let targetElement: HTMLElement | SVGElement | null = element;
    // this will be our full matrix
    let totalTransformMatrix: DOMMatrix = new DOMMatrix();
    
    while (targetElement !== document.body && targetElement !== null) {
        // get the transform matrix of the current eleemnt
        const style: CSSStyleDeclaration = window.getComputedStyle(targetElement);
        const transformMatrix: DOMMatrix = new DOMMatrix(style.transform);
        // get the pivot/transform origin of the targetElement in its local space (e.g. pivot is its origin (which is always top left));
        // this is where the transform matrix does its transformations relative to
        const pivot: Vector2 = getPivot(targetElement);
        // get the offset from parent
        // NOTE: the offset properties reference the offsetParent... the offsetParent is any ancestor with a transform or position 
        // property (that's not the default "static"). also offset properties are not affected by transforms (like scale, skew, rot, translate)
        // think of offset properties as the original layout of the child in the parent
        // for this to work properly, probably add a transform identity matrix in the css to any ancestor of the current element 
        const offsetFromParent: Vector2 = new Vector2(element.offsetLeft, element.offsetTop);

        // add the matrix to our total transform matrix
        // operatrions are read like standard matrices where the rightmost operation (bottom here) is read first and in ascending order
        totalTransformMatrix = (
            new DOMMatrix()
            // fifth, move back by the untransformed offset (we set it at the end so that the transformation matrix doesn't accidentally
            // modify this offset)
            .translate(offsetFromParent.x, offsetFromParent.y)
            // fourth, translate back by the pivot
            .translate(pivot.x, pivot.y)
            // third, apply the target element's transforms
            .multiply(transformMatrix)
            // second, translate by the -pivot
            .translate(-pivot.x, -pivot.y)
            // first shift the element to the target element's local space
            .multiply(totalTransformMatrix)
        );
        // move onto the next element up in the hiearchy
        targetElement = targetElement.parentElement;
    }

    return totalTransformMatrix;
} 

// transforms a point by a given matrix at the given pivot/transform origin (it's optional, you can bake the pivot into the matrix
// or set the pivot if the matrix doesn't include these shifts)
export function transformPoint(point: Vector2, matrix: DOMMatrix, pivot: Vector2 = new Vector2()): Vector2 {
    // destructure the matrix to make it easier to access the matrix props
    // a = horiz scale, b = vert scale, c = horiz skew, d = vert skew, e =  horiz translation, f = vert translation
    const {a, b, c, d, e, f} = matrix;
    // get the displacement between the point and the pivot we want it to apply its transformations against 
    const displacement: Vector2 = point.subtract(pivot);
    // apply the trasnformations to our displacement and then shift it back into place
    const transformedCoords: Vector2 = (
        // applys the matrix to the displacement
        new Vector2(
            a * displacement.x + c * displacement.y + e,
            b * displacement.x + d * displacement.y + f
        )
        // shift it back to its original point
        .add(pivot)
    );

    // essentially what we did was this (multiplying a 3x3 by a 3x1 matrix [multiplying a transform matrix by a point])
    // the dummy coords (homogenous coords) there are to allow for translation and rotation:
    // |a, c, e|   |x|    |a*x + c*y + e|
    // |b, d, f| x |y| =  |b*x + d*y + f|
    // |0, 0, 1|   |1|    |      1      |

    // we could've also just use matrix.transformPoint(new DOMPoint(displacement.x, displacement.y)) and then add back the center
    // it does the same thing

    return transformedCoords;
}

// get the pivot (transform origin) of the element
export function getPivot(element: HTMLElement | SVGElement): Vector2 {
    const style: CSSStyleDeclaration = window.getComputedStyle(element);
    const [originX, originY] = style.transformOrigin.split(" ");
    const pivot: Vector2 = new Vector2(
        parseFloat(originX || ""),
        parseFloat(originY || "")
    );

    return pivot;
}