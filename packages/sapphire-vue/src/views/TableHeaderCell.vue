<template>
	<div
		class="header-title"
		:style="{
			width: props.column.renderWidth + 'px',
			left: props.column.renderOffset + 'px',
		}"
		:class="{
			'with-action-icon': props.column.column.sort,
		}"
		@click="handleColumnClick($event, props.column.column)"
	>
		<div class="sapphire-table__table-header-container">
			<span
				v-if="props.column.column.slots?.['header']"
				class="header-cell-title"
				:style="{ width: '100%' }"
			>
				<slot :name="props.column.column.slots?.['header']" :column="props.column.column"></slot>
			</span>
			<span
				v-else
				:class="`header-cell-title align-${
					props.column.column.align === 'center' ? 'center' : 'left'
				}`"
			>
				<template v-if="props.column.column.type === 'selection'">
					<div class="vertical-center">
						<CheckBox
							:checked="table.isHalf.value || table.isSelectAll.value"
							:half="table.isHalf.value"
							@click="table.handleSelectAllClick"
						/>
					</div>
				</template>
				<template v-else>
					{{ props.column.column.title }}
				</template>
			</span>
		</div>
		<div
			v-if="props.column.column.sort || props.column.column.filter"
			class="sapphire-table__table-header-tools"
		>
			<div v-if="props.column.column.sort" class="action-sort-icon">
				<div
					class="sort-up-icon"
					:style="{
						'--sort-default-color': `var(${
							table.sortInfo.value.property === props.column.column.colKey &&
							table.sortInfo.value.type === (props.column.column.sortValue || ['asc', 'desc'])[0]
								? '--sapphire-primary-color'
								: '--sapphire-gray-color'
						})`,
					}"
					@click="(event) => handleSortChange(event, props.column.column, 'up')"
				></div>
				<div
					class="sort-down-icon"
					:style="{
						'--sort-default-color': `var(${
							table.sortInfo.value.property === props.column.column.colKey &&
							table.sortInfo.value.type === (props.column.column.sortValue || ['asc', 'desc'])[1]
								? '--sapphire-primary-color'
								: '--sapphire-gray-color'
						})`,
					}"
					@click="(event) => handleSortChange(event, props.column.column, 'down')"
				></div>
			</div>
			<div v-if="props.column.column.filter" class="action-filter-icon" @click="handleOpenFilter">
				<slot name="sapphireTableFilterIcon" :action="false">
					<svg
						class="action-filter-icon"
						viewBox="0 -1 12 12"
						version="1.1"
						xmlns="http://www.w3.org/2000/svg"
						width="200"
						height="200"
					>
						<path
							:style="{
								fill: `var(${
									props.column.filterParams.value !== undefined
										? '--sapphire-primary-color'
										: '--sapphire-gray-color'
								})`,
							}"
							d="M3.40215 8.32031C3.40215 8.52773 3.56855 8.69531 3.7748 8.69531H6.8498C7.05605 8.69531 7.22246 8.52773 7.22246 8.32031V6.02344H3.40215V8.32031ZM9.62597 0.304688H0.998631C0.711521 0.304688 0.532224 0.617578 0.676365 0.867188L3.26972 5.27344H7.35722L9.95058 0.867188C10.0924 0.617578 9.91308 0.304688 9.62597 0.304688Z"
						></path>
					</svg>
				</slot>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import type { IColumnRenderItem, ISortParams, ITableColumn } from '@sapphire-table/core';
import { inject } from 'vue';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import { TABLE_PROVIDER_KEY } from '../constant/table';
import type { IOpenFilterParams } from '../types/types';
import CheckBox from '../components/CheckBox.vue';

const props = defineProps<{
	column: IColumnRenderItem;
}>();

const table = inject<VirtualTableType>(TABLE_PROVIDER_KEY) as VirtualTableType;

const emit = defineEmits<{
	(e: 'filter', params: IOpenFilterParams): void;
	(e: 'sort', params: ISortParams): void;
}>();

const handleSortChange = (event: Event, column: ITableColumn, type: 'up' | 'down') => {
	event.stopPropagation();
	const sortValueIndex = type === 'up' ? 0 : 1;
	const sortValue = column.sortValue || ['asc', 'desc'];
	table.sortInfo.value.type = sortValue[sortValueIndex];
	table.sortInfo.value.property = column.colKey;
};

const handleColumnClick = (event: Event, column: ITableColumn) => {
	if (!column.sort) {
		return;
	}
	const { property, type } = table.sortInfo.value;
	if (property === column.colKey) {
		const [sortUp, sortDown] = column.sortValue || ['asc', 'desc'];
		if (type === sortUp) {
			handleSortChange(event, column, 'down');
		} else if (type === sortDown) {
			table.sortInfo.value = {
				type: '',
				property: '',
			};
		}
	} else {
		handleSortChange(event, column, 'up');
	}
	emit('sort', {
		...table.sortInfo.value,
	});
};

const handleOpenFilter = (event: Event) => {
	event.stopPropagation();
	emit('filter', {
		offset: props.column.renderOffset,
		filterField: props.column.column.colKey,
		filterParams: props.column.filterParams,
		colWidth: props.column.renderWidth,
		column: props.column.column,
		slotName: props.column.column.filter as string,
	});
};
</script>
