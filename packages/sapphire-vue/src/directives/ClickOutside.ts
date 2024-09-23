import type { ObjectDirective } from 'vue';
import {
	registerOutsideClick,
	unRegisterOutsideClick,
} from '@sapphire-table/core/lib/utils/ClickOutside';

export const ClickOutside: ObjectDirective = {
	beforeMount(el, binding) {
		registerOutsideClick(el, () => {
			binding.value?.();
		});
	},
	updated(el, binding) {
		registerOutsideClick(el, () => {
			binding.value?.();
		});
	},
	unmounted(el) {
		unRegisterOutsideClick(el);
	},
};
