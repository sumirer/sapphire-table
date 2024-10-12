import { useEffect, useRef, useState } from 'react';

/**
 * A custom React hook that provides a mechanism to trigger updates in a component.
 *
 * @returns An object containing an `update` function and an `updateKey` state variable.
 *
 * @example
 * ```typescript
 * import React from 'react';
 * import { useUpdate } from './useUpdate';
 *
 * const MyComponent = () => {
 *   const { update, updateKey } = useUpdate();
 *
 *   return (
 *     <div>
 *       <p>Update Key: {updateKey}</p>
 *       <button onClick={update}>Trigger Update</button>
 *     </div>
 *   );
 * };
 * ```
 */
export const useUpdate = () => {
	const [updateKey, updateView] = useState('_key');

	const updateCallback = useRef<VoidFunction | undefined>(undefined);

	useEffect(() => {
		updateCallback.current?.();
		updateCallback.current = undefined;
	}, [updateKey]);

	return {
		/**
		 * Triggers an update by changing the `updateKey` state variable to a new random value.
		 */
		update: (callback?: VoidFunction) => {
			updateCallback.current = callback;
			updateView(`_key_${Math.random()}`);
		},

		/**
		 * The current value of the `updateKey` state variable.
		 * This value is used to trigger updates in the component.
		 */
		updateKey,
	};
};
