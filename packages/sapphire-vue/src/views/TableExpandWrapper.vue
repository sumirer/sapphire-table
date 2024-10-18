<template>
	<div
		class="sapphire-table__expand-wrapper"
		:style="{
			height: props.rowData.expandHeight + 'px',
			width: table.bodyWidth.value + 'px',
			zIndex: 8,
			opacity: props.rowData.expand ? 1 : 0,
		}"
		ref="expandBodyRef"
		@contextmenu="handleWrapperEventStop"
		@mousemove="handleWrapperEventStop"
		@mousedown="handleWrapperEventStop"
		@mouseup="handleWrapperEventStop"
	>
		<div class="sapphire-table__expand-body">
			<slot name="default"></slot>
		</div>
	</div>
</template>

<script lang="ts" setup>
import type { IRowRenderItem } from '@sapphire-table/core';
import { inject, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import { TABLE_PROVIDER_KEY } from '../constant/table';

const props = defineProps<{
	rowData: IRowRenderItem;
	rowIndex: number;
}>();

const table = inject<VirtualTableType>(TABLE_PROVIDER_KEY) as VirtualTableType;

const expandBodyRef = ref<HTMLDivElement>();

const sizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
	if (entries.length) {
		const [target] = entries;
		const element = target.target as HTMLDivElement;
		if (element) {
			if (element.clientHeight === 0) {
				return;
			}
		}
	}
});

const handleWrapperEventStop = (event: Event) => {
	event.stopPropagation();
};

onMounted(() => {
	nextTick().then(() => {
		if (expandBodyRef.value) {
			sizeObserver.observe(expandBodyRef.value);
		}
	});
});

onBeforeUnmount(() => {
	sizeObserver.disconnect();
});
</script>
