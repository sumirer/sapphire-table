import { onBeforeUnmount, reactive, ref } from 'vue';
import type {
	IColumnRenderItem,
	IRenderInfo,
	IRowRenderItem,
	ITableConfig,
	ITableFormats,
} from '@sapphire-table/core';
import { VirtualTable } from '@sapphire-table/core';

export const useVirtualTable = (tableConfig?: ITableConfig) => {
	const virtualTable = new VirtualTable();

	const tableWidth = ref(0);

	const tableContentWidth = ref(0);

	const tableHeight = ref(0);

	const tableContentHeight = ref(0);

	const headerHeight = ref(40);

	const leftFixedWidth = ref(0);

	const rightFixedWidth = ref(0);

	const bodyWidth = ref(0);

	const bodyHeight = ref(0);

	const leftColumns = ref<IColumnRenderItem[]>([]);

	const bodyColumns = ref<IColumnRenderItem[]>([]);

	const rightColumns = ref<IColumnRenderItem[]>([]);

	const tableRowData = ref<IRowRenderItem[]>([]);

	const toolsColumns = ref<IColumnRenderItem[]>([]);

	const toolBarWidth = ref(0);

	const scrollLeftPosition = ref(0);

	const scrollTopPosition = ref(0);

	const scrollBarWidth = ref(0);

	const pingLeft = ref(false);

	const pingRight = ref(false);

	const globalFormatter: ITableFormats = {};

	const hoverIndex = ref(-1);

	const sortInfo = ref({
		colKey: '',
		sortValue: '',
	});

	const renderInfo = reactive<IRenderInfo>({
		renderColumnEnd: 0,
		renderColumnStart: 0,
		renderRowEnd: 0,
		renderRowStart: 0,
	});

	virtualTable.bodyGrid.verticalRenderFillDistance = 200;

	virtualTable.bodyGrid.horizontalRenderFillDistance = 300;

	const updatePingAction = () => {
		pingLeft.value = scrollLeftPosition.value > 0;
		pingRight.value =
			virtualTable.bodyGrid.gridContentWidth.target.value >
			virtualTable.bodyGrid.gridWidth.target.value
				? scrollLeftPosition.value <
					tableContentWidth.value + rightFixedWidth.value + leftFixedWidth.value - tableWidth.value
				: false;
	};

	const observerList: Array<VoidFunction> = [
		virtualTable.bodyGrid.gridContentWidth.addListener((newVal) => {
			tableContentWidth.value = newVal;
		}),
		virtualTable.leftFixedGrid.gridContentWidth.addListener((newVal) => {
			leftFixedWidth.value = newVal;
		}),
		virtualTable.rightFixedGrid.gridContentWidth.addListener((newVal) => {
			rightFixedWidth.value = newVal;
		}),
		virtualTable.rowHeight.addListener((newVal) => {
			tableContentHeight.value = newVal;
		}),
		virtualTable.bodyGrid.renderInfo.addListener((newVal) => {
			Object.assign(renderInfo, { ...newVal });
		}),
		virtualTable.rightFixedGrid.gridColumns.addListener((newVal) => {
			rightColumns.value = newVal;
		}),
		virtualTable.leftFixedGrid.gridColumns.addListener((newVal) => {
			leftColumns.value = newVal;
		}),
		virtualTable.bodyGrid.gridColumns.addListener((newVal) => {
			bodyColumns.value = newVal;
		}),
		virtualTable.bodyGrid.gridRows.addListener((newVal) => {
			tableRowData.value = newVal;
		}),
		virtualTable.bodyGrid.offsetX.addListener((newVal) => {
			scrollLeftPosition.value = newVal;
			updatePingAction();
		}),
		virtualTable.bodyGrid.offsetY.addListener((newVal) => {
			scrollTopPosition.value = newVal;
		}),
		virtualTable.bodyGrid.gridWidth.addListener((newVal) => {
			bodyWidth.value = newVal;
		}),
	];

	const updateBodySize = (width: number, height: number) => {
		tableWidth.value = width;
		bodyHeight.value = height;
		virtualTable.bodyGrid.gridHeight.replace(height);
		virtualTable.bodyGrid.gridWidth.replace(width);
		virtualTable.updateTableLayout();
		virtualTable.bodyGrid.testColumnWidth();
	};

	const updateHoverIndex = (index: number) => {
		hoverIndex.value = index;
	};

	const handleExpandRow = (rowIndex: number) => {
		if (tableRowData.value[rowIndex].expand) {
			tableRowData.value[rowIndex].expand = false;
			tableRowData.value[rowIndex].expandHeight = 0;
		} else {
			tableRowData.value[rowIndex].expand = true;
			tableRowData.value[rowIndex].expandHeight = 300;
			handleReloadRowData(rowIndex);
		}
		virtualTable.updateRowHeight();
		virtualTable.updateTableLayout();
	};

	const handleRowSelect = (rowIndex: number, action: boolean) => {
		tableRowData.value[rowIndex].selection = action;
	};

	const clearAllSelection = () => {
		tableRowData.value.forEach((item) => {
			item.selection = false;
		});
	};

	const getSelectionData = () => {
		return tableRowData.value.filter((item) => item.selection).map((item) => item.rowData);
	};

	const setDefaultSelection = (selectData: Array<any>, key: string) => {
		tableRowData.value.forEach((item, index) => {
			selectData.forEach((select) => {
				if (select[key] === item[key as unknown as keyof typeof item]) {
					handleRowSelect(index, true);
				}
			});
		});
	};

	const loadExpandData = (rowData: IRowRenderItem, rowIndex: number) => {
		if (tableConfig?.expandConfig) {
			const { dataLoadMethod } = tableConfig.expandConfig;
			dataLoadMethod(rowData.expandInnerData, rowIndex);
		} else {
			console.warn('请配置展开加载数据方法，否则展开加载无效');
		}
	};

	const handleUpdateExpandRow = (indexOrSearchCallback: number | ((data: any) => boolean)) => {
		const { index, renderInfo } =
			virtualTable.getRenderRowIndexByIndexOrSearch(indexOrSearchCallback);
		if (renderInfo) {
			loadExpandData(renderInfo, index);
			handleExpandRow(index);
		}
	};

	const handleReloadRowData = (rowIndex: number) => {
		loadExpandData(tableRowData.value[rowIndex], rowIndex);
	};

	onBeforeUnmount(() => {
		observerList.forEach((call) => call());
	});

	return {
		virtualTable,
		tableWidth,
		tableContentWidth,
		tableHeight,
		tableContentHeight,
		renderInfo,
		leftColumns,
		bodyColumns,
		rightColumns,
		leftFixedWidth,
		rightFixedWidth,
		scrollTopPosition,
		bodyWidth,
		headerHeight,
		scrollBarWidth,
		scrollLeftPosition,
		pingLeft,
		pingRight,
		globalFormatter,
		hoverIndex,
		sortInfo,
		toolsColumns,
		toolBarWidth,
		tableRowData,
		updateBodySize,
		updatePingAction,
		updateHoverIndex,
		handleExpandRow,
		handleRowSelect,
		clearAllSelection,
		getSelectionData,
		setDefaultSelection,
		handleUpdateExpandRow,
		handleReloadRowData,
	};
};

export type VirtualTableType = ReturnType<typeof useVirtualTable>;
