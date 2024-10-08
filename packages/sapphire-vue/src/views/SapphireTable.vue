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
	 * 表格数据，可以使用加载方法替代该属性
	 * @see ITableProps.config
	 * @see ITableConfig.dataLoadMethod
	 */
	data?: Array<T>;
	/**
	 * 列表的column定义，可以使用构建工具构建
	 *  @see import('@sapphire-table/core').TableColumnFactory
	 */
	columns: Array<ITableColumn> | ITableColumns;
	/**
	 * 格式化工具方法集合
	 */
	formats?: ITableFormats<T>;
	/**
	 * 行样式计算
	 * @param row
	 */
	computedRowStyle?: (row: IRowRenderItem) => string;
	/**
	 * 是否启用列表的计算缓存，当列表单元格显示存在复杂计算时，或者在使用format进行格式化时
	 * 能有效减少计算，但是会存在缓存问题
	 */
	enableFormatCache?: boolean;
	/**
	 * 表格的配置项
	 */
	config?: ITableConfig;
	/**
	 * 行预设高度，用于预估行高度，在动态高度列表中，可以减少行抖动的发生
	 * 在使用动态高度时候，越接近真实高度效果越好
	 */
	presetHeight?: number;
	/**
	 * 表格是否处于加载状态
	 */
	loading?: boolean;
}

// const emit = defineEmits(['filter', 'sort', 'update:loading'])

const emit = defineEmits<{
	/**
	 * 过滤事件
	 * @description 过滤事件
	 * @param e
	 * @param params
	 */
	(e: 'filter', params: Array<IFilterParams>): void;
	/**
	 * 排序事件
	 * @description 排序事件
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
	// 展开slots不进行传递
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

const handleConfirmFilter = (params: Array<IFilterParams>) => {
	// 存在数据加载配置的情况下，直接获取数据，不存在的情况下交由外部处理
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
		table.virtualTable.updateTableColumn(newColumn);
		table.virtualTable.bodyGrid.testColumnWidth();
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
 *
 * @returns {void}
 */
const updateNewData = (data: typeof props.data) => {
	table.virtualTable.updateTableData(
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
 *
 * @returns {Promise<void>} - A promise that resolves when the data loading is complete.
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
 *
 * @returns {void}
 */
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
