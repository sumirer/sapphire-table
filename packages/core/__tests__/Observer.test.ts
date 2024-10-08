import { observer } from '../src/observer/Observer';

describe('Observer', () => {
	test('correctly remove a listener when removeListener is called', () => {
		const listener1 = jest.fn();
		const listener2 = jest.fn();

		const observerInstance = observer(10);

		observerInstance.addListener(listener1);
		observerInstance.addListener(listener2);

		observerInstance.replace(20);

		expect(listener1).toHaveBeenCalledTimes(1);
		expect(listener1).toHaveBeenCalledWith(20);
		expect(listener2).toHaveBeenCalledTimes(1);
		expect(listener2).toHaveBeenCalledWith(20);
	});

	test('Should correctly remove a listener when removeListener is called', () => {
		const initialValue = 10;
		const observerInstance = observer(initialValue);
		const listener = jest.fn();
		observerInstance.addListener(listener);
		observerInstance.removeListener(listener);
		observerInstance.replace(20);
		expect(listener).not.toBeCalled();
	});

	test('should not notify removed listeners after they are removed', () => {
		const listener1 = jest.fn();
		const listener2 = jest.fn();

		const observerInstance = observer(10);

		const removeListener1 = observerInstance.addListener(listener1);
		observerInstance.addListener(listener2);

		observerInstance.replace(20);

		expect(listener1).toHaveBeenCalledTimes(1);
		expect(listener1).toHaveBeenCalledWith(20);
		expect(listener2).toHaveBeenCalledTimes(1);
		expect(listener2).toHaveBeenCalledWith(20);

		removeListener1();
		observerInstance.replace(30);

		expect(listener1).toHaveBeenCalledTimes(1); // Listener1 should not be called again
		expect(listener2).toHaveBeenCalledTimes(2);
		expect(listener2).toHaveBeenCalledWith(30);
	});

	test('should notify all listeners when replace is called', () => {
		const listener1 = jest.fn();
		const listener2 = jest.fn();

		const observerInstance = observer(10);

		observerInstance.addListener(listener1);
		observerInstance.addListener(listener2);

		observerInstance.replace(20);

		expect(listener1).toHaveBeenCalledTimes(1);
		expect(listener1).toHaveBeenCalledWith(20);
		expect(listener2).toHaveBeenCalledTimes(1);
		expect(listener2).toHaveBeenCalledWith(20);
	});

	test('should handle replacing the observed value with a new object', () => {
		const listener = jest.fn();
		const initialObject = { id: 1, name: 'John' };
		const newObject = { id: 2, name: 'Jane' };

		const observerInstance = observer(initialObject);

		observerInstance.addListener(listener);

		observerInstance.replace(newObject);

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith(newObject);
	});

	test('handles replacing the observed value with a new array', () => {
		const listener = jest.fn();
		const observerInstance = observer([1, 2, 3]);

		observerInstance.addListener(listener);

		observerInstance.replace([4, 5, 6]);

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith([4, 5, 6]);
	});

	test('handles replacing the observed value with a new null value', () => {
		const listener = jest.fn();

		const observerInstance = observer<number | null>(10);

		observerInstance.addListener(listener);

		observerInstance.replace(null);

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith(null);
	});
});
