<template>
	<div ref="viewportRef" class="sapphire-table">
		<slot name="sapphireLoading" :loading="tableLoading">
			<SapphireLoading v-if="tableLoading" />
		</slot>
		<TableHeader @filter="handleOpenFilter">
			<template v-for="(_, name) in usageSlots" :key="name" v-slot:[name]="bindValue">
				<slot :name="name" v-bind="bindValue"></slot>
			</template>
		</TableHeader>
		<TableHeaderResizeController position="body" />
		<TableHeaderResizeController position="left" />
		<TableHeaderResizeController position="right" />
		<div
			ref="bodyWrapperRef"
			@scroll="handleScrollChange"
			class="sapphire-table__table-scroll-body"
		>
			<div
				class="sapphire-table__table-scroll-body-wrapper"
				:style="{
					width:
						table.tableContentWidth.value +
						table.leftFixedWidth.value +
						table.rightFixedWidth.value +
						'px',
				}"
			>
				<TableFilter ref="tableFilterRef">
					<template v-for="(_, name) in usageSlots" :key="name" v-slot:[name]="bindValue">
						<slot :name="name" v-bind="bindValue"></slot>
					</template>
				</TableFilter>
				<TableColumnFixedWrapper
					v-if="table.leftColumns.value.length > 0"
					:width="table.leftFixedWidth.value + 'px'"
					position="left"
					:height="table.tableContentHeight.value + 'px'"
					:style="{
						overflow: 'visible',
						zIndex: 5,
					}"
				>
					<RowRenderDelegation
						:columns="table.leftColumns.value"
						:computed-row-style="props.computedRowStyle"
						position="left"
						with-expand
					>
						<template v-if="slots.sapphireExpandInner" #sapphireExpandInner="bindValue">
							<slot name="sapphireExpandInner" v-bind="bindValue"></slot>
						</template>
						<template v-for="(_, name) in usageSlots" :key="name" v-slot:[name]="bindValue">
							<slot :name="name" v-bind="bindValue"></slot>
						</template>
					</RowRenderDelegation>
				</TableColumnFixedWrapper>
				<div
					class="sapphire-table__table-body"
					:style="{
						width: table.tableContentWidth.value + 'px',
						height: table.tableContentHeight.value + 'px',
					}"
				>
					<RowRenderDelegation
						:columns="table.bodyColumns.value"
						:computed-row-style="props.computedRowStyle"
						position="body"
					>
						<template v-for="(_, name) in usageSlots" :key="name" v-slot:[name]="bindValue">
							<slot :name="name" v-bind="bindValue"></slot>
						</template>
					</RowRenderDelegation>
				</div>
				<div style="flex: 1"></div>
				<TableColumnFixedWrapper
					v-if="table.rightColumns.value.length > 0"
					:width="table.rightFixedWidth.value + 'px'"
					position="right"
					:height="table.tableContentHeight.value + 'px'"
				>
					<RowRenderDelegation
						:columns="table.rightColumns.value"
						:computed-row-style="props.computedRowStyle"
						position="right"
					>
						<template v-for="(_, name) in usageSlots" :key="name" v-slot:[name]="bindValue">
							<slot :name="name" v-bind="bindValue"></slot>
						</template>
					</RowRenderDelegation>
				</TableColumnFixedWrapper>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, provide, ref, useSlots, watch } from 'vue';
import RowRenderDelegation from './RowRenderDelegation.vue';
import { useVirtualTable } from '../hooks/useVirtualTable';
import type {
	IExpandParams,
	IRowRenderItem,
	ITableColumn,
	ITableColumns,
	ITableConfig,
	ITableFormats,
	ITableInstance,
} from '@sapphire-table/core';
import { TABLE_PROVIDER_KEY } from '../constant/table';
import '@sapphire-table/core/lib/style/index.css';
import TableHeader from './TableHeader.vue';
import TableColumnFixedWrapper from './TableColumnFixedWrapper.vue';
import TableHeaderResizeController from './TableHeaderResizeController.vue';
import TableFilter from './TableFilter.vue';
import type { IOpenFilterParams, ITableFilterInstance } from '../types/types';
import SapphireLoading from '../components/SapphireLoading.vue';

interface ITableProps<T = any> {
	data?: Array<T>;
	columns: Array<ITableColumn> | ITableColumns;
	formats?: ITableFormats<T>;
	computedRowStyle?: (row: IRowRenderItem) => string;
	enableFormatCache?: boolean;
	config?: ITableConfig;
	presetHeight?: number;
	loading?: boolean;
}

const emit = defineEmits(['filter', 'sort', 'update:loading']);

const props = defineProps<ITableProps>();

const viewportRef = ref<HTMLDivElement>();

const bodyWrapperRef = ref<HTMLDivElement>();

const tableFilterRef = ref<ITableFilterInstance>();

const tableLoading = computed({
	get() {
		return props.loading;
	},
	set(val) {
		emit('update:loading', val);
	},
});

const slots = useSlots();

const usageSlots = Object.keys(slots).reduce((previousValue, currentValue) => {
	if (currentValue !== 'sapphireExpandInner') {
		previousValue[currentValue] = slots[currentValue];
	}
	return previousValue;
}, {} as any);

const table = useVirtualTable(props.config);

provide(TABLE_PROVIDER_KEY, table);

Object.assign(table.globalFormatter, props.formats || {});

let wrapperBodyHasScrollBar = false;

const sizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
	const [wrapperBody] = entries;
	const target = wrapperBody.target as HTMLDivElement;
	if (target) {
		if (
			(target.offsetWidth !== target.clientWidth && !wrapperBodyHasScrollBar) ||
			(target.offsetWidth === target.clientWidth && wrapperBodyHasScrollBar)
		) {
			if (bodyWrapperRef.value) {
				table.updateBodySize(bodyWrapperRef.value.clientWidth, bodyWrapperRef.value.clientHeight);
				tableFilterRef.value?.hiddenFilter();
			}
		}
		wrapperBodyHasScrollBar = target.offsetWidth !== target.clientWidth;
	}
});

const handleScrollChange = (event: Event) => {
	const target = event.target as HTMLDivElement;
	table.virtualTable.updateScrollOffset(target.scrollLeft, target.scrollTop);
	tableFilterRef.value?.hiddenFilter();
};

const testScrollBarVisibleChange = () => {
	if (viewportRef.value && bodyWrapperRef.value) {
		table.scrollBarWidth.value = viewportRef.value.clientWidth - bodyWrapperRef.value.clientWidth;
	}
};

const handleOpenFilter = (params: IOpenFilterParams) => {
	tableFilterRef.value?.openFilter(params);
};

onMounted(() => {
	if (bodyWrapperRef.value && viewportRef.value) {
		sizeObserver.observe(bodyWrapperRef.value);
		// sizeObserver.observe(viewportRef.value);
	}
});

watch(
	() => props.columns,
	(newColumn) => {
		table.virtualTable.updateTableColumn(newColumn);
		table.virtualTable.bodyGrid.testColumnWidth();
		nextTick(() => {
			testScrollBarVisibleChange();
			table.updatePingAction();
		});
	},
	{ immediate: true }
);

const updateNewData = (data: typeof props.data) => {
	table.virtualTable.updateTableData(
		data || [],
		(props.config?.expandConfig?.expandDefaultParams || {}) as IExpandParams,
		props.presetHeight || 50
	);
	nextTick(() => {
		testScrollBarVisibleChange();
		table.updatePingAction();
	});
};

const handleLoadTableData = () => {
	if (props.config) {
		const { dataLoadMethod } = props.config;
		return dataLoadMethod()
			.then((getData) => {
				updateNewData(getData);
			})
			.catch(() => {
				updateNewData([]);
			});
	}
};

const handleScrollToRow = (indexOrSearchCallback: number | ((data: any) => boolean)) => {
	const { renderInfo } = table.virtualTable.getRenderRowIndexByIndexOrSearch(indexOrSearchCallback);
	if (renderInfo) {
		bodyWrapperRef.value?.scroll(0, renderInfo.renderOffset);
	}
};

if (props.data) {
	watch(
		() => props.data,
		(newData) => {
			updateNewData(newData);
		},
		{ immediate: true }
	);
} else {
	updateNewData([]);
	handleLoadTableData();
}

const tableInstance: ITableInstance = {
	setRowExpand: table.handleUpdateExpandRow,
	scrollToRow: handleScrollToRow,
	reloadRowExpand: table.handleReloadRowData,
	getSelectionData: table.getSelectionData,
	clearSelection: table.clearAllSelection,
	setRowSelection: table.handleRowSelect,
	setDefaultSelection: table.setDefaultSelection,
	loadData: handleLoadTableData,
};

defineExpose<ITableInstance>(tableInstance);
</script>
