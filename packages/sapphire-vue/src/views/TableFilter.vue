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
				:name="filterWidgetData.field"
				v-bind="filterWidgetData"
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
	type: 'float',
	filterInnerParams: {},
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
	}, 190);
};

const handleShowFilter = async ({
	filterField,
	offset,
	value,
	colWidth,
	column,
}: IOpenFilterParams) => {
	if (filterWidgetData.visible) {
		let isOpenTarget = filterField === filterWidgetData.field && offset === filterWidgetData.offset;
		handleHiddenFilter();
		// await hidden animation
		await new Promise((resolve) => {
			setTimeout(() => {
				resolve(true);
			}, 200);
		});
		if (isOpenTarget) {
			return;
		}
	}
	filterWidgetData.visible = true;
	filterWidgetData.offset = offset;
	filterWidgetData.field = filterField;
	filterWidgetData.value = value as string;
	filterWidgetData.colWidth = colWidth;
	filterWidgetData.column = column;
	filterWidgetData.type = column.fixed ? 'fixed' : 'float';
	filterWidgetData.top = table.scrollTopPosition.value + 7 + 'px';

	const leftDistance =
		offset +
		(column.fixed ? table.scrollLeftPosition.value : table.leftFixedWidth.value) +
		filterWidgetData.colWidth;

	filterWidgetData.left = leftDistance + 'px';
	await nextTick();
	// got table wrapper container
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
		// 出现溢出，进行位置修复
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
		filterWidgetData.fixOffset = offset + 'px';
	}
};

defineExpose<ITableFilterInstance>({
	openFilter: handleShowFilter,
	hiddenFilter: handleHiddenFilter,
});
</script>
