let startClick: MouseEvent | undefined;

type HTMLHandler = (event: MouseEvent, clickEvent: MouseEvent) => void;

const nodeList = new Map<HTMLElement, HTMLHandler>();

document.addEventListener('mousedown', (e: MouseEvent) => (startClick = e));
document.addEventListener('mouseup', (e: MouseEvent) => {
	if (startClick) {
		for (const handler of nodeList.values()) {
			handler(e as MouseEvent, startClick);
		}
		startClick = undefined;
	}
});

export const registerOutsideClick = (
	target: HTMLElement,
	callback: (event: MouseEvent) => void
) => {
	const handler: HTMLHandler = (event, clickEvent) => {
		const mouseUpTarget = clickEvent.target as HTMLElement;
		const mouseDownTarget = event.target as HTMLElement;
		if (
			mouseUpTarget &&
			target.contains(mouseUpTarget) &&
			mouseDownTarget &&
			target.contains(mouseDownTarget)
		) {
			return;
		}
		callback(clickEvent);
	};
	nodeList.set(target, handler);
	return () => nodeList.delete(target);
};

export const unRegisterOutsideClick = (el: HTMLElement) => {
	if (nodeList.has(el)) {
		nodeList.delete(el);
	}
};
