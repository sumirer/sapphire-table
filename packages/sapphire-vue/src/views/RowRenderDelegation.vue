<template>
	<TableRow
		v-for="renderRowIndex in renderComputeIndex"
		:key="table.renderUpdateKey.value + '_' + renderRowIndex"
		:columns="props.columns"
		:row-data="table.tableRowData.value[renderRowIndex]"
		:row-index="renderRowIndex"
		:style="{ width: targetGrid.gridContentWidth + 'px' }"
		:position="props.position"
		:with-expand="props.withExpand"
		:cell-render="props.cellRender"
		:stripe="props.stripe"
	>
		<template v-for="(_, name) in slots" :key="name" v-slot:[name]="bindValue">
			<slot :name="name" v-bind="bindValue"></slot>
		</template>
	</TableRow>
</template>

<script lang="ts" setup>
import TableRow from './TableRow.vue';
import type { Ref } from 'vue';
import { computed, inject, useSlots } from 'vue';
import type {
	ICellRenderCallback,
	IColumnRenderItem,
	IGridDescribe,
	IRowRenderItem,
} from '@sapphire-table/core';
import { TABLE_PROVIDER_KEY } from '../constant/table';
import type { VirtualTableType } from '../hooks/useVirtualTable';

interface IRowRenderDelegationProps {
	computedRowStyle?: (row: IRowRenderItem) => string;
	columns: IColumnRenderItem[];
	position: 'left' | 'body' | 'right';
	withExpand?: boolean;
	cellRender?: ICellRenderCallback;
	stripe?: boolean;
}

const props = defineProps<IRowRenderDelegationProps>();

const slots = useSlots();

const table = inject<VirtualTableType>(TABLE_PROVIDER_KEY) as VirtualTableType;

const targetGrid: Ref<IGridDescribe> =
	props.position === 'body'
		? table.bodyGrid
		: props.position === 'left'
			? table.leftGrid
			: table.rightGrid;

const renderComputeIndex = computed(() => {
	const indexList: Array<number> = [];
	// empty
	if (table.tableRowData.value.length === 0) {
		return indexList;
	}
	for (
		let index = table.bodyGrid.value.renderInfo.renderRowStart;
		index <= table.bodyGrid.value.renderInfo.renderRowEnd;
		index++
	) {
		indexList.push(index);
	}
	return indexList;
});
</script>
