// gets the current transform of an element (returns a transform matrix)
export function getCurrentTransformMatrix(element: HTMLElement | SVGElement): DOMMatrix {
    const currentStyle: CSSStyleDeclaration = window.getComputedStyle(element);
    const matrix: DOMMatrix = new DOMMatrix(currentStyle.transform);
    return matrix;
}

// gets the offset/translation between the centers of two elements
export function getCentersOffset(
        elementOne: HTMLElement | SVGElement,
        elementTwo: HTMLElement | SVGElement
): {deltaX: number, deltaY: number} {
    const elementOneBoundingRect: DOMRect = elementOne.getBoundingClientRect();
    const elementOneCenterX: number = elementOneBoundingRect.left + elementOneBoundingRect.width/2;
    const elementOneCenterY: number = elementOneBoundingRect.top + elementOneBoundingRect.height/2;

    const elementTwoBoundingRect: DOMRect = elementTwo.getBoundingClientRect();
    const elementTwoCenterX: number = elementTwoBoundingRect.left + elementTwoBoundingRect.width/2;
    const elementTwoCenterY: number = elementTwoBoundingRect.top + elementTwoBoundingRect.height/2;

    const deltaX: number = elementOneCenterX - elementTwoCenterX;
    const deltaY: number = elementOneCenterY - elementTwoCenterY;

    return {deltaX, deltaY};
}