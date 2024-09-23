<template>
	<div
		:class="{
			'sapphire-table__table-fixed': true,
			[`sapphire-table__ping-${props.position}`]: showFixedAction,
			[props.position || '']: true,
		}"
		:style="{
			[props.position]: 0,
			width: props.width,
			height: props.height,
		}"
	>
		<slot name="default"></slot>
	</div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import { TABLE_PROVIDER_KEY } from '../constant/table';

const props = defineProps<{
	position: 'left' | 'right';
	width: string;
	height: string;
}>();

const table = inject<VirtualTableType>(TABLE_PROVIDER_KEY) as VirtualTableType;

const showFixedAction = computed(() => {
	if (props.position === 'left') {
		return table.pingLeft.value;
	}
	return table.pingRight.value;
});
</script>
