<template>
	<div ref="viewportRef" class="sapphire-table">
		<slot name="sapphireLoading" :loading="tableLoading">
			<SapphireLoading v-if="tableLoading" />
		</slot>
		<TableContentMenu :on-menu-click="handleMenuClick" />
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
				:class="{ 'sapphire-table__unselectable': props.rangeSelection }"
				:style="{
					width:
						table.tableContentWidth.value +
						table.leftFixedWidth.value +
						table.rightFixedWidth.value +
						'px',
				}"
				@contextmenu="handleBodyContextMenu"
			>
				<TableFilter ref="tableFilterRef" @filter="handleConfirmFilter">
					<template v-for="(_, name) in usageSlots" :key="name" v-slot:[name]="bindValue">
						<slot :name="name" v-bind="bindValue"></slot>
					</template>
				</TableFilter>
				<TableColumnFixedWrapper
					v-if="table.leftGrid.value.gridColumns.length > 0"
					:width="table.leftFixedWidth.value + 'px'"
					position="left"
					:height="table.tableContentHeight.value + 'px'"
					:style="{
						overflow: 'visible',
						zIndex: 5,
					}"
					:range-selection="props.rangeSelection"
				>
					<RowRenderDelegation
						:columns="table.leftGrid.value.gridColumns"
						:computed-row-style="props.computedRowStyle"
						position="left"
						with-expand
						:cell-render="props.leftGridCellRender"
						:stripe="props.stripe"
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
					:ref="cellSelection.bodyRef"
				>
					<RowRenderDelegation
						:columns="table.bodyGrid.value.gridColumns"
						:computed-row-style="props.computedRowStyle"
						position="body"
						:cell-render="props.cellRender"
						:stripe="props.stripe"
					>
						<template v-for="(_, name) in usageSlots" :key="name" v-slot:[name]="bindValue">
							<slot :name="name" v-bind="bindValue"></slot>
						</template>
					</RowRenderDelegation>
				</div>
				<div style="flex: 1"></div>
				<TableColumnFixedWrapper
					v-if="table.rightGrid.value.gridColumns.length > 0"
					:width="table.rightFixedWidth.value + 'px'"
					position="right"
					:height="table.tableContentHeight.value + 'px'"
					:range-selection="props.rangeSelection"
				>
					<RowRenderDelegation
						:columns="table.rightGrid.value.gridColumns"
						:computed-row-style="props.computedRowStyle"
						position="right"
						:cell-render="props.rightGridCellRender"
						:stripe="props.stripe"
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
	CellInfo,
	ICellRenderCallback,
	IExpandParams,
	IFilterParams,
	IMenuContentBlock,
	IMenuVisible,
	IRowRenderItem,
	ISortParams,
	ITableColumn,
	ITableColumns,
	ITableConfig,
	ITableFormats,
	ITableInstance,
	ITableMenuGroup,
} from '@sapphire-table/core';
import {
	TABLE_PROVIDER_CONTENT_MENU_KEY,
	TABLE_PROVIDER_KEY,
	TABLE_PROVIDER_SELECTION_KEY,
} from '../constant/table';
import '@sapphire-table/core/lib/style/index.css';
import TableHeader from './TableHeader.vue';
import TableColumnFixedWrapper from './TableColumnFixedWrapper.vue';
import TableHeaderResizeController from './TableHeaderResizeController.vue';
import TableFilter from './TableFilter.vue';
import type { IOpenFilterParams, ITableFilterInstance } from '../types/types';
import SapphireLoading from '../components/SapphireLoading.vue';
import { useGridSelection } from '../hooks/useGridSelection';
import { useContentMenu } from '../hooks/useContentMenu';
import TableContentMenu from './TableContentMenu.vue';

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

	verticalRenderFillDistance?: number;
	horizontalRenderFillDistance?: number;

	cellRender?: ICellRenderCallback;

	leftGridCellRender?: ICellRenderCallback;

	rightGridCellRender?: ICellRenderCallback;

	stripe?: boolean;

	rangeSelection?: boolean;

	menus?: ITableMenuGroup;
}

// const emit = defineEmits(['filter', 'sort', 'update:loading']);

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

const cellSelection = useGridSelection(table, props.rangeSelection);

const contentMenu = useContentMenu();

provide(TABLE_PROVIDER_KEY, table);

provide(TABLE_PROVIDER_SELECTION_KEY, cellSelection);

provide(TABLE_PROVIDER_CONTENT_MENU_KEY, contentMenu);

Object.assign(table.globalFormatter.value, props.formats || {});

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

const getVisibleMenus = (
	menus: IMenuContentBlock[],
	visibleParams: Parameters<IMenuVisible>[0]
) => {
	const getComputeCellMenu: IMenuContentBlock[] = [];
	menus.forEach((menu) => {
		if (typeof menu?.visible === 'function') {
			if (menu?.visible(visibleParams)) {
				menu.children = menu.children ? getVisibleMenus(menu.children, visibleParams) : undefined;
				getComputeCellMenu.push(menu);
			}
		} else if (typeof menu?.visible === 'boolean') {
			if (menu?.visible) {
				menu.children = menu.children ? getVisibleMenus(menu.children, visibleParams) : undefined;
				getComputeCellMenu.push(menu);
			}
		} else {
			menu.children = menu.children ? getVisibleMenus(menu.children, visibleParams) : undefined;
			getComputeCellMenu.push(menu);
		}
	});
	return getComputeCellMenu;
};

const handleBodyContextMenu = (event: MouseEvent) => {
	const bodyCellMenu = props.menus?.cell || [];
	if (bodyCellMenu.length === 0 && !props.rangeSelection) {
		return;
	}
	const range = cellSelection.getSelectedCellData(event.target as HTMLDivElement);
	const currentGrid =
		range?.current?.position === 'left'
			? table.leftGrid
			: range?.current?.position === 'right'
				? table.rightGrid
				: range?.current?.position === 'body'
					? table.bodyGrid
					: null;
	const selectionCell: Pick<CellInfo, 'cellCol' | 'cellRow'>[] = [];
	if (range?.range) {
		Object.entries(range.range).forEach((entries) => {
			const [rowKey, value] = entries;
			Object.keys(value).forEach((colKey) => {
				selectionCell.push({ cellCol: Number(colKey), cellRow: Number(rowKey) });
			});
		});
	}
	const visibleParams = {
		current: range?.current,
		rowData: range?.current.rowIndex ? table.tableRowData.value[range.current.rowIndex] : undefined,
		columnData: range
			? currentGrid?.value.gridColumns[range.current.rowIndex as number]
			: undefined,
		selection: selectionCell,
	};
	const getComputeCellMenu = getVisibleMenus(bodyCellMenu, visibleParams);
	if (getComputeCellMenu.length === 0) {
		return;
	}
	event.preventDefault();
	contentMenu.showMenuContent(getComputeCellMenu, {
		x: event.clientX,
		y: event.clientY,
		position: range?.current.position,
		selection: selectionCell,
		current: range?.current,
		columnData: range
			? currentGrid?.value.gridColumns[range.current.rowIndex as number]
			: undefined,
		rowData: range?.current.rowIndex ? table.tableRowData.value[range.current.rowIndex] : undefined,
	});
};

const handleMenuClick = (menu: IMenuContentBlock) => {
	menu.onMenuClick?.({
		tableInstance,
		selection: contentMenu.position.selection,
		current: contentMenu.position.current,
		columnData: contentMenu.position.columnData,
		rowData: contentMenu.position.rowData,
	});
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
		table.updateTableCellSpan(
			props.leftGridCellRender,
			props.cellRender,
			props.rightGridCellRender
		);
		nextTick(() => {
			testScrollBarVisibleChange();
			table.updatePingAction();
		});
	},
	{ immediate: true }
);

watch(
	() => [
		table.bodyGrid.value.renderInfo.renderColumnEnd,
		table.bodyGrid.value.renderInfo.renderColumnStart,
		table.bodyGrid.value.renderInfo.renderRowEnd,
		table.bodyGrid.value.renderInfo.renderRowStart,
	],
	() => {
		table.updateTableCellSpan(
			props.leftGridCellRender,
			props.cellRender,
			props.rightGridCellRender
		);
	}
);

watch(
	() => [props.verticalRenderFillDistance, props.horizontalRenderFillDistance],
	() => {
		table.updateBodyRenderFillDistance(
			props.verticalRenderFillDistance ?? 100,
			props.horizontalRenderFillDistance ?? 200
		);
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
	table.updateTableCellSpan(props.leftGridCellRender, props.cellRender, props.rightGridCellRender);
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
			filter: { ...table.filterParamsCache.value },
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

const tableInstance: ITableInstance = {
	setRowExpand: table.handleUpdateExpandRow,
	scrollToRow: handleScrollToRow,
	reloadRowExpand: table.handleReloadRowData,
	getSelectionData: table.getSelectionData,
	clearSelection: table.clearAllSelection,
	setRowSelection: table.handleRowSelect,
	setDefaultSelection: table.setDefaultSelection,
	loadData: handleLoadTableData,
	filterInstance: table.filterInstance,
};

defineExpose<ITableInstance>(tableInstance);
</script>
