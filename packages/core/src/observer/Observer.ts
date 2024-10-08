export type IListener<T> = (newVal: T) => void;

export interface IObserver<T> {
	addListener(callback: IListener<T>): VoidFunction;
	removeListener(callback: IListener<T>): void;
	replace(newVal: T): void;
	target: { value: T };
}

/**
 * Creates an observer for a given target value.
 * The observer provides methods to add and remove listeners, as well as to update the observed value.
 *
 * @template T - The type of the observed value.
 * @param target - The initial value to be observed.
 * @returns An object implementing the IObserver interface.
 */
export function observer<T>(target: T): IObserver<T> {
	const listener: Array<IListener<T>> = [];

	const observerTarget = { value: target };

	/**
	 * Registers an update listener. When the observed value changes, the listener will be triggered.
	 *
	 * @param callback - The function to be called when the observed value changes.
	 * @returns A function that can be called to remove the listener.
	 */
	const addListener = (callback: IListener<T>) => {
		listener.push(callback);
		return () => removeListener(callback);
	};

	/**
	 * Removes a previously registered listener.
	 *
	 * @param callback - The function to be removed from the list of listeners.
	 */
	const removeListener = (callback: IListener<T>) => {
		listener.splice(listener.indexOf(callback), 1);
	};

	/**
	 * Notifies all registered listeners about a value update.
	 *
	 * @param newVal - The new value of the observed target.
	 */
	const notifyListener = (newVal: T) => {
		listener.forEach((callback) => {
			callback(newVal);
		});
	};

	/**
	 * Updates the observed value and notifies all registered listeners.
	 *
	 * @param newVal - The new value of the observed target.
	 */
	const replace = (newVal: T) => {
		observerTarget.value = newVal;
		notifyListener(newVal);
	};

	return {
		addListener,
		removeListener,
		replace,
		target: observerTarget,
	};
}
