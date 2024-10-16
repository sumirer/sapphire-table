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
		:ref="props.position === 'left' ? cellSelection.leftRef : cellSelection.rightRef"
	>
		<slot name="default"></slot>
	</div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import { TABLE_PROVIDER_KEY, TABLE_PROVIDER_SELECTION_KEY } from '../constant/table';
import type { GridSelectionType } from '../hooks/useGridSelection';

const props = defineProps<{
	position: 'left' | 'right';
	width: string;
	height: string;
	rangeSelection?: boolean;
}>();

const table = inject<VirtualTableType>(TABLE_PROVIDER_KEY) as VirtualTableType;

const cellSelection = inject<GridSelectionType>(TABLE_PROVIDER_SELECTION_KEY) as GridSelectionType;

const showFixedAction = computed(() => {
	if (props.position === 'left') {
		return table.pingLeft.value;
	}
	return table.pingRight.value;
});
</script>
