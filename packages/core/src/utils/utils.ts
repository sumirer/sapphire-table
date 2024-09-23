export function deepClone<T>(obj: T): T {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}
	if (obj instanceof Date) {
		return new Date(obj.getTime()) as any;
	}
	if (Array.isArray(obj)) {
		return (obj as any[]).map((item) => deepClone(item)) as any;
	}
	const clone = { ...obj } as any;
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			clone[key] = deepClone(obj[key]);
		}
	}
	return clone;
}

/**
 * get number range value
 * @param value
 * @param min
 * @param max
 */
export function clamp(value: number, min: number, max: number): number {
	if (min > max) {
		[min, max] = [max, min];
	}
	if (value < min) {
		return min;
	}
	if (value > max) {
		return max;
	}
	return value;
}
