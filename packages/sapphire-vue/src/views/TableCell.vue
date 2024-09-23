<template>
	<div
		v-if="colData.type === 'expand'"
		class="sapphire-table__table-cell tools"
		@click="handleOpenRowExpand"
		:style="{
			width: props.columnInfo.renderWidth + 'px',
			transform: `translateX(${props.columnInfo.renderOffset}px)`,
		}"
	>
		<slot name="sapphireExpandIcon" :expand="rowInfo.expand">
			<svg
				:class="{
					'sapphire-table__table-expand': true,
					'expand-active': rowInfo.expand,
				}"
				viewBox="0 0 1024 1024"
				version="1.1"
				xmlns="http://www.w3.org/2000/svg"
				width="200"
				height="200"
			>
				<path
					d="M295.7 897.96c-18.8-18.8-18.8-49.1 0-67.9l318-318-318-318c-18.8-18.8-18.8-49.2 0-67.9 18.8-18.8 49.1-18.8 67.9 0l352 352c18.8 18.8 18.8 49.2 0 67.9l-352 352c-9.4 9.4-21.7 14-34 14C317.4 911.96 305.1 907.36 295.7 897.96z"
				></path>
			</svg>
		</slot>
	</div>
	<div
		v-else-if="colData.type === 'selection' || colData.type === 'radio'"
		class="sapphire-table__table-cell tools"
		:style="{
			width: props.columnInfo.renderWidth + 'px',
			transform: `translateX(${props.columnInfo.renderOffset}px)`,
		}"
	>
		<CheckBox :checked="props.rowInfo.selection" @change="handleSelectRowStatusChange" />
	</div>
	<div
		v-else
		class="sapphire-table__table-cell"
		:style="{
			width: props.columnInfo.renderWidth + 'px',
			transform: `translateX(${props.columnInfo.renderOffset}px)`,
		}"
		:class="{ [`align-${props.columnInfo.column.align || 'left'}`]: true }"
	>
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
					expand: false,
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

<script lang="ts" setup>
import type {
	IColumnRenderItem,
	IRowRenderItem,
	ITableColumn,
	ITableFormats,
} from '@sapphire-table/core';
import { inject, toRaw } from 'vue';
import { FORMAT_DATA_KEY, TABLE_PROVIDER_KEY } from '../constant/table';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import CheckBox from '../components/CheckBox.vue';

interface ITableCellProps {
	enableFormatCache?: boolean;
	formats: ITableFormats;
	rowInfo: IRowRenderItem;
	columnInfo: IColumnRenderItem;
	rowIndex: number;
	columnIndex: number;
}

const props = defineProps<ITableCellProps>();

const table = inject<VirtualTableType>(TABLE_PROVIDER_KEY) as VirtualTableType;

/**
 * 单元格数据格式化
 * @param value
 * @param col
 */
const getValueByFormat = (value: IRowRenderItem, col: ITableColumn) => {
	let formatter = col.formatter;
	let formatterValue = value.rowData[col.colKey];
	const targetValue = toRaw(value);
	const formatCache = value.formatCache;
	if (props.enableFormatCache && formatCache && col.colKey in formatCache) {
		return formatCache[col.colKey];
	}
	if (formatter) {
		if (!Array.isArray(formatter)) {
			formatter = [formatter];
		}
		const [fnName, ...params] = formatter;
		const formatFn = props.formats[fnName];
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
		if (props.enableFormatCache) {
			if (formatCache) {
				formatCache[col.colKey] = formatterValue;
			} else {
				/**
				 * 根据Column定义的格式化方法对数据进行预先格式化，因为区域内滚动会再格式化会设计大量的无用运算
				 * 所以在渲染前定义不可枚举熟悉进行格式化数据定义
				 */
				Object.defineProperty(targetValue, FORMAT_DATA_KEY, {
					value: { [col.colKey]: formatterValue },
					enumerable: false,
				});
			}
		}
	}
	return formatterValue;
};

const colInfo = props.columnInfo;
const colData = colInfo.column;

const slotsName = colData.slots?.default;

const cellFormatValue = getValueByFormat(props.rowInfo, colData);

const handleOpenRowExpand = () => {
	table.handleExpandRow(props.rowIndex);
};

const handleSelectRowStatusChange = (checked: boolean) => {
	table.handleRowSelect(props.rowIndex, checked);
};
</script>
