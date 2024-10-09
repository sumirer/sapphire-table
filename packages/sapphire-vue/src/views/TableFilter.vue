<template>
	<div
		v-if="filterWidgetData.visible"
		:class="{
			'sapphire-table__filter-wrapper': true,
			dispose: filterWidgetData.animationClose,
		}"
		ref="filterBodyRef"
		:style="{
			left: filterWidgetData.left,
			top: filterWidgetData.top,
			transform: `translateX(calc(-50% - 20px + ${filterWidgetData.fixOffset}))`,
			'--filter-offset': filterWidgetData.fixOffset,
		}"
		v-click-outside="handleHiddenFilter"
	>
		<div
			class="filter-inner-body"
			:style="{
				maxHeight: table.tableHeight.value - table.scrollBarWidth.value + 'px',
			}"
		>
			<slot
				v-if="filterWidgetData.field"
				:name="filterWidgetData.slotName"
				v-bind="filterWidgetData"
				:instance="table.filterInstance"
			></slot>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { inject, nextTick, reactive, ref } from 'vue';
import type { IFilterData, ITableColumn } from '@sapphire-table/core';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import { TABLE_PROVIDER_KEY } from '../constant/table';
import type { IOpenFilterParams, ITableFilterInstance } from '../types/types';
import { ClickOutside as vClickOutside } from '../directives/ClickOutside';

const table = inject<VirtualTableType>(TABLE_PROVIDER_KEY) as VirtualTableType;

const emits = defineEmits(['filter']);

const filterBodyRef = ref<HTMLDivElement>();

const filterWidgetData = reactive<IFilterData>({
	animationClose: false,
	visible: false,
	offset: 0,
	left: 'unset',
	fixOffset: '0px',
	top: '0px',
	field: '',
	value: null,
	colWidth: 0,
	bodyWidth: 200,
	column: {} as ITableColumn,
	type: '',
	filterInnerParams: {},
	slotName: '',
});

const handleHiddenFilter = () => {
	if (!filterWidgetData.visible || filterWidgetData.animationClose) {
		return;
	}
	filterWidgetData.animationClose = true;
	setTimeout(() => {
		filterWidgetData.visible = false;
		filterWidgetData.offset = 0;
		filterWidgetData.field = '';
		filterWidgetData.value = '';
		filterWidgetData.colWidth = 0;
		filterWidgetData.animationClose = false;
		filterWidgetData.bodyWidth = 200;
		filterWidgetData.fixOffset = '0px';
		filterWidgetData.filterInnerParams = {};
		filterWidgetData.type = '';
		filterWidgetData.slotName = '';
	}, 190);
};

/**
 * Function to handle the display of filter dialog for a specific column.
 *
 * @param {IOpenFilterParams} params - Object containing parameters for opening the filter dialog.
 * @param {string} params.filterField - The field name of the column to apply the filter.
 * @param {number} params.offset - The horizontal offset position of the filter dialog relative to the column.
 * @param {IFilterParams} params.filterParams - Object containing filter parameters.
 * @param {number} params.colWidth - The width of the column.
 * @param {ITableColumn} params.column - The column object.
 * @param {string} params.slotName - The name of the slot to render the filter component.
 */
const handleShowFilter = async ({
	filterField,
	offset,
	filterParams,
	colWidth,
	column,
	slotName,
}: IOpenFilterParams) => {
	if (filterWidgetData.visible) {
		// Check if the target filter is already open
		let isOpenTarget = filterField === filterWidgetData.field && offset === filterWidgetData.offset;
		handleHiddenFilter();
		await new Promise((resolve) => {
			setTimeout(() => {
				resolve(true);
			}, 200);
		});
		// If the target filter is already open, return early
		if (isOpenTarget) {
			return;
		}
	}
	filterWidgetData.visible = true;
	filterWidgetData.offset = offset;
	filterWidgetData.field = filterField;
	filterWidgetData.value = filterParams.value as string;
	filterWidgetData.colWidth = colWidth;
	filterWidgetData.column = column;
	filterWidgetData.top = table.offset.value.y + 7 + 'px';
	filterWidgetData.filterInnerParams = filterParams.customData;
	filterWidgetData.type = filterParams.type;
	filterWidgetData.slotName = slotName;

	// Calculate the left position of the filter dialog
	const leftDistance =
		offset +
		(column.fixed ? table.offset.value.x : table.leftFixedWidth.value) +
		filterWidgetData.colWidth;

	filterWidgetData.left = leftDistance + 'px';
	await nextTick();
	const viewportRect =
		filterBodyRef.value?.parentElement?.parentElement?.parentElement?.getClientRects()?.[0];
	if (!viewportRect) {
		return;
	}
	await nextTick();
	const rects = filterBodyRef.value?.getClientRects();
	if (rects && rects.length > 0) {
		const filterRect = rects[0];
		filterWidgetData.bodyWidth = filterRect.width;
		let offset = 0;
		// Check if the filter dialog overflows the viewport and adjust the position accordingly
		if (viewportRect.x > filterRect.x) {
			offset += viewportRect.x - filterRect.x + 20;
			if (!column.fixed) {
				offset += table.leftFixedWidth.value;
			}
		} else if (viewportRect.x + viewportRect.width < filterRect.x + filterRect.width) {
			offset -= filterRect.x + filterRect.width - viewportRect.x - viewportRect.width;
			if (!column.fixed) {
				offset -= table.rightFixedWidth.value;
			}
		}
		// Update the fixed offset of the filter dialog
		filterWidgetData.fixOffset = offset + 'px';
	}
};

table.filterInstance.closeFilterDialog = handleHiddenFilter;
table.filterInstance.confirmFilter = () => {
	emits('filter', table.getAllFilterParams());
};

defineExpose<ITableFilterInstance>({
	openFilter: handleShowFilter,
	hiddenFilter: handleHiddenFilter,
});
</script>
