<template>
	<TableRow
		v-for="renderRow in renderComputeIndex"
		:key="table.renderUpdateKey.value + '_' + renderRow.key"
		:columns="props.columns"
		:row-data="renderRow.data"
		:row-index="renderRow.key"
		:style="{ width: targetGrid.gridContentWidth.target.value + 'px' }"
		:position="props.position"
		:with-expand="props.withExpand"
	>
		<template v-for="(_, name) in slots" :key="name" v-slot:[name]="bindValue">
			<slot :name="name" v-bind="bindValue"></slot>
		</template>
	</TableRow>
</template>

<script lang="ts" setup>
import TableRow from './TableRow.vue';
import { computed, inject, useSlots } from 'vue';
import type { IColumnRenderItem, IRowRenderItem } from '@sapphire-table/core';
import { TABLE_PROVIDER_KEY } from '../constant/table';
import type { VirtualTableType } from '../hooks/useVirtualTable';

interface IRowRenderDelegationProps {
	computedRowStyle?: (row: IRowRenderItem) => string;
	columns: IColumnRenderItem[];
	position: 'left' | 'body' | 'right';
	withExpand?: boolean;
}

const props = defineProps<IRowRenderDelegationProps>();

const slots = useSlots();

const table = inject<VirtualTableType>(TABLE_PROVIDER_KEY) as VirtualTableType;

const targetGrid =
	props.position === 'body'
		? table.virtualTable.bodyGrid
		: props.position === 'left'
			? table.virtualTable.leftFixedGrid
			: table.virtualTable.rightFixedGrid;

const renderComputeIndex = computed(() => {
	const indexList: Array<{
		key: number;
		data: IRowRenderItem;
	}> = [];
	// empty
	if (table.tableRowData.value.length === 0) {
		return indexList;
	}
	for (
		let index = table.renderInfo.renderRowStart;
		index <= table.renderInfo.renderRowEnd;
		index++
	) {
		indexList.push({
			data: table.tableRowData.value[index],
			key: index,
		});
	}
	return indexList;
});
</script>
