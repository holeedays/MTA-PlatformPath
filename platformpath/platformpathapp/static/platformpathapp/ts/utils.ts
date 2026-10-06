// this is just a standard clamp function

export function clamp(value: number, min: number, max: number): number {
    if (value > max)
        value = max;
    else if (value < min)
        value = min;

    return value;
}

// normalizes an angle so that it is at the range [0, 360]
export function normalizeAngle(angle: number): number {
    return (
        angle < 0 ? 
        // this normalization method is possible because js modulo actually returns the negative value
        angle % 360 + 360 : 
        angle % 360
    );
}