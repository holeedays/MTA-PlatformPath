// this is just a standard clamp function

export function clamp(value: number, min: number | null = null, max: number | null = null): number {
if (min === null && max === null) 
    throw new Error("Cannot clamp value without providing at least a min or max parameter.");

    let res: number = value;
    if (min !== null) 
        res = Math.max(res, min);
    if (max !== null) 
        res = Math.min(res, max);

    return res;
}

// normalizes an angle so that it is at the range [0, 360]
export function normalizeAngle(angle: number): number {
    return (
        // we need both conditions because we want any angle to be capped at 359 degrees (a full 360 degrees rot defaults to 0 degrees)
        angle < 0 && angle % 360 !== 0? 
        // this normalization method is possible because js modulo actually returns the negative value
        angle % 360 + 360 : 
        angle % 360
    );
}

// a boolean that determines if a given value is between 2 different values
export function isBetween(value: number, comparisonValueOne: number, comparisonValueTwo: number): boolean {
    return (
        (value > comparisonValueOne && comparisonValueTwo > value) || 
        (value < comparisonValueOne && comparisonValueTwo < value)
    );
}

// a standard lerp function that clamps the lerp ratio
export function lerp(value: number, target: number, lerpRatio: number) {
    const lerpRatioClamped: number = clamp(lerpRatio, Number.EPSILON, 1);
    return value + (target - value) * lerpRatioClamped;
}