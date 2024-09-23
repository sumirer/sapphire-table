export type IListener<T> = (newVal: T) => void;

export interface IObserver<T> {
	addListener(callback: IListener<T>): VoidFunction;
	removeListener(callback: IListener<T>): void;
	replace(newVal: T): void;
	target: { value: T };
}

/**
 * make value observer
 * @param target
 */
export function observer<T>(target: T): IObserver<T> {
	const listener: Array<IListener<T>> = [];

	const observerTarget = { value: target };

	/**
	 * register update listener, if value change, trigger update callback
	 * @param callback
	 */
	const addListener = (callback: IListener<T>) => {
		listener.push(callback);
		return () => removeListener(callback);
	};

	const removeListener = (callback: IListener<T>) => {
		listener.splice(listener.indexOf(callback), 1);
	};

	/**
	 * notify all observer listener value update
	 * @param newVal
	 */
	const notifyListener = (newVal: T) => {
		listener.forEach((callback) => {
			callback(newVal);
		});
	};

	/**
	 * update observer target value
	 * @param newVal
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
