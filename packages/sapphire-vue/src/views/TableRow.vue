<template>
	<div
		:class="rowClassNames"
		:data-sapphireId="props.rowIndex"
		:style="{
			height: props.rowData.renderRowHeight + 'px',
			transform: `translateY(${props.rowData.renderOffset + 'px'})`,
			position: 'absolute',
			willChange: 'transform',
		}"
	>
		<div
			ref="columnRef"
			:class="{ 'expand-wrapper-row-hover': isHover }"
			@mouseenter="handleColumnHover"
			@mouseleave="handleColumUnHover"
		>
			<template v-for="colIndex in columnRenderRange" :key="colIndex">
				<TableCell
					:formats="table.globalFormatter.value"
					:row-info="props.rowData"
					:column-info="props.columns[colIndex]"
					:row-index="props.rowIndex"
					:column-index="colIndex"
				>
					<template v-for="(_, name) in usageSlots" :key="name" v-slot:[name]="bindValue">
						<slot :name="name" v-bind="bindValue"></slot>
					</template>
				</TableCell>
			</template>
		</div>
		<TableExpandWrapper
			v-if="props.withExpand && slots.sapphireExpandInner"
			:row-data="props.rowData"
			:row-index="props.rowIndex"
		>
			<slot
				name="sapphireExpandInner"
				v-if="props.rowData.expand"
				:rowInfo="props.rowData"
				:expandData="props.rowData.expandInnerData"
				:rowIndex="props.rowIndex"
				:expandHeight="props.rowData.expandHeight"
				:instance="expandInstance"
				:config="expandConfig"
			></slot>
		</TableExpandWrapper>
	</div>
</template>

<script lang="ts" setup>
import { computed, inject, ref, useSlots } from 'vue';
import type {
	IColumnRenderItem,
	IExpandInstance,
	ILoadDataRequestParams,
	IRowRenderItem,
	ITableConfig,
} from '@sapphire-table/core';
import TableCell from './TableCell.vue';
import { TABLE_PROVIDER_KEY } from '../constant/table';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import TableExpandWrapper from './TableExpandWrapper.vue';

interface ITableRowProps<T = any> {
	rowIndex: number;
	rowData: IRowRenderItem<T>;
	columns: IColumnRenderItem[];
	computedRowStyle?: (row: IRowRenderItem<T>) => string;
	position: 'left' | 'body' | 'right';
	withExpand: boolean;
}

const props = defineProps<ITableRowProps>();

const emits = defineEmits(['hover', 'unHover']);

const table = inject<VirtualTableType>(TABLE_PROVIDER_KEY) as VirtualTableType;

const columnRef = ref<HTMLDivElement>();

const slots = useSlots();

const usageSlots = Object.keys(slots).reduce((previousValue, currentValue) => {
	if (currentValue !== 'sapphireExpandInner') {
		previousValue[currentValue] = slots[currentValue];
	}
	return previousValue;
}, {} as any);

const isHover = computed(() => table.hoverIndex.value === props.rowIndex);

const rowClassNames = computed(() => {
	const classNames: Record<string, boolean> = {
		'sapphire-table__table-row': true,
	};
	const computeClass = props.computedRowStyle?.(props.rowData);
	if (computeClass) {
		classNames[computeClass] = true;
	}
	return classNames;
});

const columnRenderRange = computed(() => {
	const rangeIndex: Array<number> = [];
	if (props.position === 'body') {
		for (
			let index = table.bodyGrid.value.renderInfo.renderColumnStart;
			index <= table.bodyGrid.value.renderInfo.renderColumnEnd;
			index++
		) {
			rangeIndex.push(index);
		}
	} else if (props.position === 'left') {
		for (let index = 0; index < table.leftColumns.value.length; index++) {
			rangeIndex.push(index);
		}
	} else {
		for (let index = 0; index < table.rightColumns.value.length; index++) {
			rangeIndex.push(index);
		}
	}
	return rangeIndex;
});

const handleColumnHover = () => {
	table.hoverIndex.value = props.rowIndex;
	emits('hover', props.rowIndex);
};

const handleColumUnHover = () => {
	table.hoverIndex.value = -1;
	emits('unHover', props.rowIndex);
};

const reloadExpandData = async (params: ILoadDataRequestParams) => {
	await table.loadExpandData(props.rowData, params);
	return props.rowData.expandInnerData.data;
};

const expandConfig: ITableConfig = {
	dataLoadMethod: reloadExpandData,
};

const expandInstance: IExpandInstance = {
	reloadData: () => table.handleReloadRowData(props.rowIndex),
};
</script>
