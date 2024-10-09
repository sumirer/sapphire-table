<template>
	<div ref="viewportRef" class="sapphire-table" :key="updateKey">
		<slot name="sapphireLoading" :loading="tableLoading">
			<SapphireLoading v-if="tableLoading" />
		</slot>
		<TableHeader @filter="handleOpenFilter" @sort="handleUpdateSort">
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
				<TableFilter ref="tableFilterRef" @filter="handleConfirmFilter">
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
	IFilterParams,
	IRowRenderItem,
	ISortParams,
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
	/**
	 * Table data. Can be replaced with a loading method.
	 * @see ITableProps.config
	 * @see ITableConfig.dataLoadMethod
	 */
	data?: Array<T>;

	/**
	 * Column definitions for the table. Can be built using a builder tool.
	 * @see import('@sapphire-table/core').TableColumnFactory
	 */
	columns: Array<ITableColumn> | ITableColumns;

	/**
	 * Collection of formatting utility methods for the table.
	 */
	formats?: ITableFormats<T>;

	/**
	 * Row style calculation function.
	 * @param row - The row for which the style is being calculated.
	 */
	computedRowStyle?: (row: IRowRenderItem) => string;

	/**
	 * Whether to enable calculation caching for the table cells.
	 * Useful when cells display complex calculations or when using the format method.
	 * However, it may introduce cache issues.
	 */
	enableFormatCache?: boolean;

	/**
	 * Configuration options for the table.
	 */
	config?: ITableConfig;

	/**
	 * Preset row height for the table.
	 * Useful for estimating row height in dynamic height lists to reduce row jitter.
	 * A higher value may result in a closer approximation to the actual row height.
	 */
	presetHeight?: number;

	/**
	 * Whether the table is in a loading state.
	 */
	loading?: boolean;
}

// const emit = defineEmits(['filter', 'sort', 'update:loading'])

const emit = defineEmits<{
	/**
	 * filter event
	 * @param e
	 * @param params
	 */
	(e: 'filter', params: Array<IFilterParams>): void;
	/**
	 * sort event
	 * @param e
	 * @param params
	 */
	(e: 'sort', params: ISortParams): void;
	(e: 'update:loading', loading: boolean): void;
}>();

const props = defineProps<ITableProps>();

const viewportRef = ref<HTMLDivElement>();

const bodyWrapperRef = ref<HTMLDivElement>();

const tableFilterRef = ref<ITableFilterInstance>();

const updateKey = ref(Math.random().toString());

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

const sizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
	const [wrapperBody] = entries;
	const target = wrapperBody.target as HTMLDivElement;
	if (target) {
		if (bodyWrapperRef.value) {
			table.updateBodySize(bodyWrapperRef.value.clientWidth, bodyWrapperRef.value.clientHeight);
			tableFilterRef.value?.hiddenFilter();
		}
	}
});

const handleScrollChange = (event: Event) => {
	const target = event.target as HTMLDivElement;
	table.updateScrollOffset(target.scrollLeft, target.scrollTop);
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

const handleConfirmFilter = (params: Array<IFilterParams>) => {
	// If a data loading configuration exists, directly retrieve the data;
	// if not, delegate it to external processing.
	emit('filter', params);
	handleLoadTableData();
};

const handleUpdateSort = (params: ISortParams) => {
	emit('sort', params);
	handleLoadTableData();
};

const resetTableAction = () => {
	bodyWrapperRef.value?.scrollTo(0, 0);
	table.renderUpdateKey.value = Math.random().toString();
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
		table.updateTableColumn(newColumn);
		nextTick(() => {
			testScrollBarVisibleChange();
			table.updatePingAction();
		});
	},
	{ immediate: true }
);

/**
 * Updates the table data with new data.
 *
 * @param {typeof props.data} data - The new data to update the table with.
 */
const updateNewData = (data: typeof props.data) => {
	table.updateTableData(
		data || [],
		(props.config?.expandConfig?.expandDefaultParams || {}) as IExpandParams,
		props.presetHeight || 50
	);
	resetTableAction();
	nextTick(() => {
		testScrollBarVisibleChange();
		table.updatePingAction();
	});
};

/**
 * Handles loading table data based on the provided configuration.
 * If a data load method is provided in the configuration, it will be used to fetch the data.
 * Otherwise, it will call the `updateNewData` function with an empty array.
 */
const handleLoadTableData = () => {
	if (props.config) {
		const { dataLoadMethod } = props.config;
		tableFilterRef.value?.hiddenFilter();
		return dataLoadMethod({
			filter: table.filterParamsCache.value,
			sort: { ...table.sortInfo.value },
		})
			.then((getData) => {
				updateNewData(getData);
			})
			.catch(() => {
				updateNewData([]);
			});
	}
	tableFilterRef.value?.hiddenFilter();
};

/**
 * Scrolls the table to the specified row based on the provided index or search callback.
 *
 * @param {number | ((data: any) => boolean)} indexOrSearchCallback - The index of the row to scroll to,
 * or a search callback that returns true for the desired row.
 */
const handleScrollToRow = (indexOrSearchCallback: number | ((data: any) => boolean)) => {
	const { renderInfo } = table.getRenderRowIndexByIndexOrSearch(indexOrSearchCallback);
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

defineExpose<ITableInstance>({
	/**
	 * @public
	 */
	setRowExpand: table.handleUpdateExpandRow,
	/**
	 * @public
	 */
	scrollToRow: handleScrollToRow,
	/**
	 * @public
	 */
	reloadRowExpand: table.handleReloadRowData,
	/**
	 * @public
	 */
	getSelectionData: table.getSelectionData,
	/**
	 * @public
	 */
	clearSelection: table.clearAllSelection,
	/**
	 * @public
	 */
	setRowSelection: table.handleRowSelect,
	/**
	 * @public
	 */
	setDefaultSelection: table.setDefaultSelection,
	/**
	 * @public
	 */
	loadData: handleLoadTableData,
	/**
	 * @public
	 */
	filterInstance: table.filterInstance,
});
</script>
