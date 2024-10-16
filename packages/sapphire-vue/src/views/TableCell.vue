<template>
	<div
		class="sapphire-table__table-cell"
		@click="colData.type === 'expand' ? handleOpenRowExpand() : undefined"
		:style="renderCellStyle"
		:role="colData.type ? colData.type : 'cell'"
		:rowspan="cellSpan.rowSpan"
		:colspan="cellSpan.colSpan"
		:data-row="props.rowIndex"
		:data-col="props.columnIndex"
		:class="selectionClassNames"
		tabindex="-1"
	>
		<template v-if="colData.type === 'expand'">
			<slot name="sapphireExpandIcon" :expand="rowInfo.expand">
				<svg
					:class="{
						'sapphire-table__table-expand': true,
						'expand-active': rowInfo.expand,
					}"
					viewBox="0 0 1024 1024"
					xmlns="http://www.w3.org/2000/svg"
					width="200"
					height="200"
				>
					<path
						d="M295.7 897.96c-18.8-18.8-18.8-49.1 0-67.9l318-318-318-318c-18.8-18.8-18.8-49.2 0-67.9 18.8-18.8 49.1-18.8 67.9 0l352 352c18.8 18.8 18.8 49.2 0 67.9l-352 352c-9.4 9.4-21.7 14-34 14C317.4 911.96 305.1 907.36 295.7 897.96z"
					></path>
				</svg>
			</slot>
		</template>
		<template v-else-if="colData.type === 'selection' || colData.type === 'radio'">
			<CheckBox :checked="props.rowInfo.selection" @change="handleSelectRowStatusChange" />
		</template>
		<template v-else>
			<div class="sapphire-table__table-cell-inner">
				<template v-if="slotsName">
					<slot
						:name="slotsName"
						v-bind="{
							row: rowInfo.rowData,
							column: {
								...colData,
								field: colData.colKey,
								property: colData.colKey,
								params: colData.filterParams,
							},
							colIndex: props.rowIndex,
							rowIndex: props.rowIndex,
							key: colData.colKey,
							formatValue: cellFormatValue,
						}"
					></slot>
				</template>
				<template v-else>
					{{ cellFormatValue }}
				</template>
			</div>
		</template>
	</div>
</template>

<script lang="ts" setup>
import type {
	ICellRenderCallback,
	IColumnRenderItem,
	IGridCellSpan,
	IGridDescribe,
	IRowRenderItem,
	ITableColumn,
	ITableFormats,
} from '@sapphire-table/core';
import type { CSSProperties } from 'vue';
import { computed, inject, type Ref } from 'vue';
import { TABLE_PROVIDER_KEY } from '../constant/table';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import CheckBox from '../components/CheckBox.vue';

interface ITableCellProps {
	enableFormatCache?: boolean;
	formats: ITableFormats;
	rowInfo: IRowRenderItem;
	columnInfo: IColumnRenderItem;
	rowIndex: number;
	columnIndex: number;
	cellRender?: ICellRenderCallback;
	position: 'left' | 'body' | 'right';
	stripe?: boolean;
}

const props = defineProps<ITableCellProps>();

const table = inject<VirtualTableType>(TABLE_PROVIDER_KEY) as VirtualTableType;

const targetGrid: Ref<IGridDescribe> =
	props.position === 'body'
		? table.bodyGrid
		: props.position === 'left'
			? table.leftGrid
			: table.rightGrid;

/**
 * Formats the cell value based on the column's formatter function.
 * If the enableFormatCache flag is true and the value is already cached, it returns the cached value.
 * Otherwise, it applies the formatter function to the cell value and caches the result if enabled.
 *
 * @param value - The row data object containing the cell value.
 * @param col - The column object defining the cell's properties and formatting rules.
 *
 * @returns The formatted cell value. If the column type is defined, it returns undefined.
 */
const getValueByFormat = (value: IRowRenderItem, col: ITableColumn) => {
	if (col.type) {
		return undefined;
	}
	let formatter = col.formatter;
	let formatterValue = value.rowData[col.colKey];
	const formatCache = value.formatCache;

	// Check if the value is already cached and return it if enabled
	if (props.enableFormatCache && formatCache && col.colKey in formatCache) {
		return formatCache[col.colKey];
	}

	if (formatter) {
		if (!Array.isArray(formatter)) {
			formatter = [formatter];
		}
		const [fnName, ...params] = formatter;
		const formatFn = props.formats[fnName];

		// Apply the formatter function to the cell value
		if (typeof formatFn === 'function') {
			formatterValue = formatFn(
				{
					cellValue: formatterValue,
					rowData: value.rowData,
					column: col,
					columnIndex: 0,
					rowIndex: props.rowIndex,
					rowRenderItem: value,
					columnRenderItem: props.columnInfo,
				},
				...params
			);
		}

		// Cache the formatted value if enabled
		if (props.enableFormatCache) {
			if (formatCache) {
				formatCache[col.colKey] = formatterValue;
			} else {
				value.formatCache = { [col.colKey]: formatterValue };
			}
		}
	}

	return formatterValue;
};

const cellSpan = computed<IGridCellSpan>(() => {
	return (
		targetGrid.value.cellSpans[props.rowIndex]?.[props.columnIndex] || { colSpan: 1, rowSpan: 1 }
	);
});

const colInfo = props.columnInfo;

const colData = colInfo.column;

const slotsName = colData.slots?.default;

const selectionClassNames = computed(() => {
	let cellClassNames: Record<string, boolean> = {
		['tools']: !!colData.type,
	};
	if (targetGrid.value.selectCell[props.rowIndex]?.[props.columnIndex]) {
		cellClassNames['sapphire-table__cell--selection'] = true;
	} else {
		cellClassNames['sapphire-table__cell--unselection'] = true;
	}
	if (!cellClassNames['tools']) {
		cellClassNames[`align-${props.columnInfo.column.align || 'left'}`] = true;
	}
	if (props.stripe) {
		cellClassNames['is-stripe'] = props.rowIndex % 2 === 1;
	}
	return cellClassNames;
});

const renderCellStyle = computed<CSSProperties>(() => {
	let height = props.rowInfo.renderRowHeight;
	let width = props.columnInfo.renderWidth;
	if (cellSpan.value.rowSpan > 1) {
		height = 0;
		for (let index = props.rowIndex; index < props.rowIndex + cellSpan.value.rowSpan; index++) {
			height += table.tableRowData.value[index].renderRowHeight;
		}
	}
	if (cellSpan.value.colSpan > 1) {
		width = 0;
		for (
			let index = props.columnIndex;
			index < props.columnIndex + cellSpan.value.colSpan;
			index++
		) {
			width += targetGrid.value.gridColumns[index].renderWidth;
		}
	}
	const borderStyles: CSSProperties = {
		borderTop: undefined,
		borderLeft: undefined,
		borderRight: undefined,
		borderBottom: undefined,
	};
	const selectionData = targetGrid.value.selectCell[props.rowIndex]?.[props.columnIndex];
	if (selectionData) {
		const { top, left, right, bottom } = selectionData;
		const borderStyle = '1px solid var(--sapphire-selection-border-color)';
		if (top) {
			borderStyles.borderTop = borderStyle;
		}
		if (left) {
			borderStyles.borderLeft = borderStyle;
		}
		if (right) {
			borderStyles.borderRight = borderStyle;
		}
		if (bottom) {
			borderStyles.borderBottom = borderStyle;
		}
	}
	return {
		width: width + 'px',
		transform: `translateX(${props.columnInfo.renderOffset}px)`,
		height: height + 'px',
		zIndex: cellSpan.value.colSpan > 1 && cellSpan.value.rowSpan > 1 ? 1 : undefined,
		visibility: cellSpan.value.rowSpan === 0 || cellSpan.value.rowSpan === 0 ? 'hidden' : undefined,
		...borderStyles,
	};
});

const cellFormatValue = getValueByFormat(props.rowInfo, colData);

const handleOpenRowExpand = () => {
	table.handleExpandRow(props.rowIndex);
};

const handleSelectRowStatusChange = (checked: boolean) => {
	table.handleRowSelect(props.rowIndex, checked);
};
</script>
