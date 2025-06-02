export function getTimestamp(): number {
    return Date.now();
}

export function addSeconds(timestamp: number, seconds: number): number {
    return timestamp + seconds * 1000;
}

export function addMinutes(timestamp: number, minutes: number): number {
    return addSeconds(timestamp, minutes * 60);
}

export function addHours(timestamp: number, hours: number): number {
    return addMinutes(timestamp, hours * 60);
}

export function addDays(timestamp: number, days: number): number {
    return addHours(timestamp, days * 24);
}

export function isPast(toCompare: number): boolean {
    return Date.now() > toCompare;
}

export function toSeconds(timestamp: number): number {
    return Math.floor(timestamp / 1000);
}
