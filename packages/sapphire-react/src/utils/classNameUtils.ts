/**
 * A utility function to compose CSS class names from various input types.
 *
 * @param classNames - The input class names. It can be a string, an array of strings, or an object with boolean values.
 *
 * @returns A string of composed class names.
 *
 * @remarks
 * If the input is a string, it is returned as is.
 * If the input is an array, it is filtered to remove falsy values and joined into a single string with spaces.
 * If the input is an object, it is reduced to an array of keys with truthy values and joined into a single string with spaces.
 * If the input is neither a string, an array, nor an object, it is returned as is.
 */
export function composeClassName(
	classNames: string | Array<string> | Record<string, boolean | undefined | null | number>
): string {
	if (typeof classNames === 'string') {
		return classNames;
	}
	if (typeof classNames === 'object') {
		if (Array.isArray(classNames)) {
			return classNames.filter(Boolean).join(' ');
		}
		return Object.entries(classNames)
			.reduce((prev, [name, action]) => {
				if (action) {
					prev.push(name);
				}
				return prev;
			}, [] as string[])
			.join(' ');
	}
	return classNames;
}
