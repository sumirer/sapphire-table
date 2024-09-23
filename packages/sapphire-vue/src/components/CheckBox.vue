<template>
	<span :class="{ 'sapphire-checkbox': true, active: props.checked }" @click="onClick">
		<svg
			class="inner-checkbox-svg-icon"
			viewBox="0 0 1024 1024"
			version="1.1"
			xmlns="http://www.w3.org/2000/svg"
			width="200"
			height="200"
			v-if="checkBoxSvgPath"
		>
			<path :d="checkBoxSvgPath"></path>
		</svg>
	</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import './CheckBox.scss';

const props = defineProps<{
	half?: boolean;
	checked: boolean;
}>();

const emit = defineEmits(['update:checked', 'change']);

const checkBoxSvgPath = computed(() => {
	if (props.checked) {
		if (props.half) {
			return 'M960 470.857143H64c-5.028571 0-9.142857 4.114286-9.142857 9.142857v64c0 5.028571 4.114286 9.142857 9.142857 9.142857h896c5.028571 0 9.142857-4.114286 9.142857-9.142857v-64c0-5.028571-4.114286-9.142857-9.142857-9.142857z';
		}
		return 'M11.815385 551.384615c-7.876923-7.876923-11.815385-19.692308-11.815385-27.56923s3.938462-19.692308 11.815385-27.569231l55.138461-55.138462c15.753846-15.753846 39.384615-15.753846 55.138462 0l3.938461 3.938462 216.615385 232.369231c7.876923 7.876923 19.692308 7.876923 27.569231 0L897.969231 129.969231h3.938461c15.753846-15.753846 39.384615-15.753846 55.138462 0l55.138461 55.138461c15.753846 15.753846 15.753846 39.384615 0 55.138462l-630.153846 653.784615c-7.876923 7.876923-15.753846 11.815385-27.569231 11.815385-11.815385 0-19.692308-3.938462-27.56923-11.815385L19.692308 563.2 11.815385 551.384615z';
	}
	return '';
});

const onClick = () => {
	let nextAction = !props.checked;
	if (props.checked && props.half) {
		nextAction = true;
	}
	emit('update:checked', nextAction);
	emit('change', nextAction);
};
</script>
