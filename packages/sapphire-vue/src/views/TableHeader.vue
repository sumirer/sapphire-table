<template>
	<div
		class="sapphire-table__table-header"
		:style="{
			height: '40px',
			width: '100%',
		}"
	>
		<div
			class="sapphire-table__header-fixed left-fixed"
			:style="{ width: table.leftFixedWidth.value + 'px' }"
			:class="{ 'sapphire-table__ping-left': table.pingLeft.value }"
		>
			<TableHeaderCell
				v-for="(col, index) in table.leftColumns.value"
				:key="col.column.colKey + '_' + index"
				:column="col"
				@filter="handleOpenFilter"
			>
				<template v-for="(_, name) in slots" :key="name" v-slot:[name]="bindValue">
					<slot :name="name" v-bind="bindValue"></slot>
				</template>
			</TableHeaderCell>
		</div>
		<div class="sapphire-table__header-wrapper">
			<div
				class="sapphire-table__header-body"
				:style="{
					width: table.virtualTable.bodyGrid.gridContentWidth + 'px',
					willChange: 'transform',
					transform: `translateX(-${table.scrollLeftPosition.value}px)`,
				}"
			>
				<TableHeaderCell
					v-for="colIndex in bodyColumnRenderIndex"
					:key="colIndex"
					:column="table.bodyColumns.value[colIndex]"
					@filter="handleOpenFilter"
				>
					<template v-for="(_, name) in slots" :key="name" v-slot:[name]="bindValue">
						<slot :name="name" v-bind="bindValue"></slot>
					</template>
				</TableHeaderCell>
			</div>
		</div>
		<div
			class="sapphire-table__header-fixed right-fixed"
			:style="{ width: table.rightFixedWidth.value + 'px' }"
			:class="{ 'sapphire-table__ping-right': table.pingRight.value }"
		>
			<TableHeaderCell
				v-for="(col, index) in table.rightColumns.value"
				:key="col.column.colKey + '_' + index"
				:column="col"
				@filter="handleOpenFilter"
			>
				<template v-for="(_, name) in slots" :key="name" v-slot:[name]="bindValue">
					<slot :name="name" v-bind="bindValue"></slot>
				</template>
			</TableHeaderCell>
		</div>
		<div
			class="sapphire-table__header-fixed scroll-fixed"
			:style="{ width: table.scrollBarWidth.value + 'px' }"
		></div>
	</div>
</template>

<script lang="ts" setup>
import { TABLE_PROVIDER_KEY } from '../constant/table';
import { computed, inject, useSlots } from 'vue';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import type { IOpenFilterParams } from '../types/types';
import TableHeaderCell from './TableHeaderCell.vue';

const table = inject<VirtualTableType>(TABLE_PROVIDER_KEY) as VirtualTableType;

const slots = useSlots();

const emit = defineEmits<{
	(e: 'filter', params: IOpenFilterParams): void;
}>();

const bodyColumnRenderIndex = computed(() => {
	const rangeIndex: Array<number> = [];
	if (table.bodyColumns.value.length === 0) {
		return rangeIndex;
	}
	for (
		let index = table.renderInfo.renderColumnStart;
		index <= table.renderInfo.renderColumnEnd;
		index++
	) {
		rangeIndex.push(index);
	}
	return rangeIndex;
});

const handleOpenFilter = (params: IOpenFilterParams) => {
	emit('filter', params);
};
</script>
