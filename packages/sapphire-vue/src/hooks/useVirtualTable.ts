import { computed, onBeforeUnmount, reactive, ref, shallowRef } from 'vue';
import type {
	IColumnRenderItem,
	IFilterInstance,
	IFilterParams,
	ILoadDataRequestParams,
	IRenderInfo,
	IRowRenderItem,
	ISortParams,
	ITableConfig,
	ITableFormats,
} from '@sapphire-table/core';
import { VirtualTable } from '@sapphire-table/core';

/**
 * A custom hook that encapsulates the logic for managing and interacting with a virtualized table.
 * It initializes various reactive variables and provides functions for handling table operations.
 *
 * @param tableConfig - Optional configuration object for the table.
 * @returns An object containing various reactive variables and functions for managing the table.
 */
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

	const renderUpdateKey = ref('_');

	const sortInfo = ref<ISortParams>({
		property: '',
		type: '',
	});

	const filterParamsCache = shallowRef<IFilterParams[]>([]);

	const selectCount = ref(0);

	const renderInfo = reactive<IRenderInfo>({
		renderColumnEnd: 0,
		renderColumnStart: 0,
		renderRowEnd: 0,
		renderRowStart: 0,
	});

	/**
	 * A computed property that determines if the number of selected rows is greater than 0 and less than the total number of rows.
	 *
	 * @returns {boolean} - Returns `true` if the number of selected rows is greater than 0 and less than the total number of rows, otherwise `false`.
	 */
	const isHalf = computed(
		() => selectCount.value > 0 && selectCount.value < tableRowData.value.length
	);

	/**
	 * A computed property that determines if all rows are selected.
	 *
	 * @returns {boolean} - Returns `true` if all rows are selected, otherwise `false`.
	 */
	const isSelectAll = computed(
		() => selectCount.value === tableRowData.value.length && selectCount.value > 0
	);

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

	/**
	 * Updates the size of the table body grid.
	 *
	 * @param width - The new width of the table body grid.
	 * @param height - The new height of the table body grid.
	 *
	 * @remarks
	 * This function updates the `tableWidth` and `bodyHeight` reactive variables with the provided `width` and `height` parameters.
	 * It then replaces the current values of the `gridHeight` and `gridWidth` properties of the `bodyGrid` with the new `height` and `width` values, respectively.
	 * After that, it calls the `updateTableLayout` and `testColumnWidth` methods of the `virtualTable` to reflect the changes.
	 */
	const updateBodySize = (width: number, height: number) => {
		tableWidth.value = width;
		bodyHeight.value = height;
		virtualTable.bodyGrid.gridHeight.replace(height);
		virtualTable.bodyGrid.gridWidth.replace(width);
		virtualTable.updateTableLayout();
		virtualTable.bodyGrid.testColumnWidth();
	};

	/**
	 * Updates the hover index.
	 *
	 * @param index - The new hover index.
	 *
	 * @remarks
	 * This function updates the `hoverIndex` reactive variable with the provided `index` parameter.
	 */
	const updateHoverIndex = (index: number) => {
		hoverIndex.value = index;
	};

	/**
	 * Handles the expand or collapse action for a specific row in the table.
	 *
	 * @param rowIndex - The index of the row to expand or collapse.
	 *
	 * @remarks
	 * This function checks the current state of the row (expanded or collapsed) and toggles it accordingly.
	 * If the row is currently expanded, it sets the `expand` property to `false` and the `expandHeight` property to `0`.
	 * If the row is currently collapsed, it sets the `expand` property to `true` and the `expandHeight` property to `300`.
	 * After updating the row data, it calls the `updateRowHeight` and `updateTableLayout` methods of the `virtualTable` to reflect the changes.
	 */
	const handleExpandRow = (rowIndex: number) => {
		if (tableRowData.value[rowIndex].expand) {
			tableRowData.value[rowIndex].expand = false;
			tableRowData.value[rowIndex].expandHeight = 0;
		} else {
			tableRowData.value[rowIndex].expand = true;
			tableRowData.value[rowIndex].expandHeight = 300;
			// handleReloadRowData(rowIndex);
		}
		virtualTable.updateRowHeight();
		virtualTable.updateTableLayout();
	};

	/**
	 * Handles the selection or deselection of a specific row in the table.
	 *
	 * @param rowIndex - The index of the row to select or deselect.
	 * @param action - A boolean indicating whether to select (`true`) or deselect (`false`) the row.
	 *
	 * @remarks
	 * This function updates the `selection` property of the specified row based on the provided `action`.
	 * If `action` is `true`, it increments the `selectCount` by `1`. If `action` is `false`, it decrements the `selectCount` by `1`.
	 */
	const handleRowSelect = (rowIndex: number, action: boolean) => {
		tableRowData.value[rowIndex].selection = action;
		if (action) {
			selectCount.value += 1;
		} else {
			selectCount.value -= 1;
		}
	};

	/**
	 * Clears the selection for all rows in the table.
	 *
	 * @remarks
	 * This function iterates through all rows in the table and sets the `selection` property to `false`.
	 * It also resets the `selectCount` to `0`.
	 */
	const clearAllSelection = () => {
		tableRowData.value.forEach((item) => {
			item.selection = false;
		});
		selectCount.value = 0;
	};

	/**
	 * Retrieves the selected row data from the table.
	 *
	 * @returns {Array<any>} - An array of objects representing the selected rows. Each object contains the row data.
	 *
	 * @remarks
	 * This function filters the table row data based on the 'selection' property, which indicates whether a row is selected.
	 * It then maps the selected rows to their corresponding row data and returns the array.
	 */
	const getSelectionData = () => {
		return tableRowData.value.filter((item) => item.selection).map((item) => item.rowData);
	};

	/**
	 * Sets the default selection for the table rows based on the provided data and key.
	 *
	 * @param selectData - An array of objects representing the selected rows.
	 * @param key - The key of the property to compare for selection.
	 *
	 * @returns {void} - This function does not return a value.
	 */
	const setDefaultSelection = (selectData: Array<any>, key: string) => {
		tableRowData.value.forEach((item, index) => {
			selectData.forEach((select) => {
				if (select[key] === item[key as unknown as keyof typeof item]) {
					handleRowSelect(index, true);
				}
			});
		});
	};

	/**
	 * Loads and returns expanded row data based on the provided row data and optional parameters.
	 *
	 * @param rowData - The row data object for which to load expanded data.
	 * @param params - Optional parameters for data loading. If not provided, default values will be used.
	 *
	 * @returns - The expanded row data based on the provided row data and parameters.
	 *
	 * @remarks
	 * This function checks if the `tableConfig` has an `expandConfig` property. If it does, it retrieves the `dataLoadMethod`
	 * from the `expandConfig`. The `dataLoadMethod` is then called with the `expandInnerData` from the `rowData` and the provided
	 * `params` (or default values if not provided). If the `tableConfig` does not have an `expandConfig`, a warning message is logged
	 * to the console and `undefined` is returned.
	 */
	const loadExpandData = (rowData: IRowRenderItem, params?: ILoadDataRequestParams) => {
		if (tableConfig?.expandConfig) {
			const { dataLoadMethod } = tableConfig.expandConfig;
			return dataLoadMethod(
				rowData.expandInnerData,
				params || {
					filter: [],
					sort: { property: '', type: '' },
				}
			);
		} else {
			console.warn(
				'Please configure the method for unfolding and loading data, otherwise unfolding and loading will be invalid'
			);
		}
	};

	/**
	 * Handles the update of expandable row data based on the provided index or search callback.
	 *
	 * @param indexOrSearchCallback - The index of the row or a search callback function to find the row.
	 *
	 * @remarks
	 * This function retrieves the render row index and information using the `getRenderRowIndexByIndexOrSearch` method of the `virtualTable`.
	 * If a render row information is found, it calls the `loadExpandData` function with the corresponding row data and then expands the row using the `handleExpandRow` function.
	 */
	const handleUpdateExpandRow = (indexOrSearchCallback: number | ((data: any) => boolean)) => {
		const { index, renderInfo } =
			virtualTable.getRenderRowIndexByIndexOrSearch(indexOrSearchCallback);
		if (renderInfo) {
			loadExpandData(renderInfo);
			handleExpandRow(index);
		}
	};

	/**
	 * Reloads the expanded row data for the specified row index.
	 *
	 * @param rowIndex - The index of the row to reload.
	 *
	 * @remarks
	 * This function calls the `loadExpandData` function with the row data at the specified index and updates the row data.
	 */
	const handleReloadRowData = (rowIndex: number) => {
		loadExpandData(tableRowData.value[rowIndex]);
	};

	/**
	 * Handles the click event for the select all checkbox.
	 *
	 * @remarks
	 * If the table is in a half-selected state or no rows are selected, this function selects all rows and sets the `selectCount` to the total number of rows.
	 * If the table is in a fully selected state, this function clears all selections by calling the `clearAllSelection` function.
	 */
	const handleSelectAllClick = () => {
		if (isHalf.value || selectCount.value === 0) {
			selectCount.value = tableRowData.value.length;
			tableRowData.value.forEach((item) => {
				item.selection = true;
			});
			return;
		}
		if (isSelectAll.value) {
			clearAllSelection();
		}
	};

	const runAllColumn = (callback: (item: IColumnRenderItem) => void) => {
		leftColumns.value.forEach(callback);
		bodyColumns.value.forEach(callback);
		rightColumns.value.forEach(callback);
	};

	/**
	 * Resets the filter for the specified column.
	 *
	 * @param colKey - The unique identifier of the column to reset the filter for.
	 *
	 * @remarks
	 * This function iterates through all columns and checks if the column's `colKey` matches the provided `colKey`.
	 * If a match is found, it sets the `filterParams.value` of the column to `undefined`, effectively resetting the filter.
	 *
	 * @example
	 * ```typescript
	 * handleResetFilter('column1'); // Resets the filter for the column with colKey 'column1'
	 * ```
	 */
	const handleResetFilter = (colKey: string) => {
		runAllColumn((col) => {
			if (col.column.colKey && col.column.colKey === colKey) {
				col.filterParams.value = undefined;
			}
		});
	};

	/**
	 * Handles the clear all filter action for the table.
	 *
	 * This function iterates through all columns and resets the filter for each column by setting the `filterParams.value` to `undefined`.
	 *
	 * @returns {void} - This function does not return a value.
	 *
	 * @remarks
	 * The `runAllColumn` function is used to iterate through all columns, and for each column, the `filterParams.value` is set to `undefined`.
	 *
	 * @example
	 * ```typescript
	 * handleClearAllFilter(); // Resets the filter for all columns
	 * ```
	 */
	const handleClearAllFilter = () => {
		runAllColumn((col) => {
			col.filterParams.value = undefined;
		});
	};

	/**
	 * Updates the filter value for the specified column.
	 *
	 * @param colKey - The unique identifier of the column to update the filter for.
	 * @param filterValue - The new filter value to apply to the specified column.
	 *
	 * @returns {void} - This function does not return a value.
	 *
	 * @remarks
	 * This function iterates through all columns and checks if the column's `colKey` matches the provided `colKey`.
	 * If a match is found, it updates the `filterParams.value` of the column with the provided `filterValue`.
	 *
	 * @example
	 * ```typescript
	 * handleUpdateColumnFilter('column1', 'newFilterValue'); // Updates the filter for the column with colKey 'column1' to 'newFilterValue'
	 * ```
	 */
	const handleUpdateColumnFilter: IFilterInstance['updateFilter'] = (colKey, filterValue) => {
		runAllColumn((col) => {
			if (col.column.filterParams?.type && col.column.colKey && col.column.colKey === colKey) {
				col.filterParams.value = filterValue;
			}
		});
	};

	/**
	 * This function retrieves all filter parameters applied to the table.
	 * It iterates through all columns and collects the filter parameters for each column where a filter is applied.
	 * The collected filter parameters are then returned as an array.
	 *
	 * @returns {IFilterParams[]} - An array of filter parameters applied to the table.
	 * Each filter parameter object contains the property, filter type, filter value, and custom data.
	 */
	const getAllFilterParams = () => {
		const filterParamsList: IFilterParams[] = [];
		runAllColumn((col) => {
			if (col.filterParams.value !== undefined) {
				filterParamsList.push({
					...col.filterParams,
					property: col.column.colKey,
					customData: col.filterParams.customData,
				});
			}
		});
		filterParamsCache.value = filterParamsList;
		return filterParamsList;
	};

	const filterInstance: IFilterInstance = {
		resetFilter: handleResetFilter,
		closeFilterDialog: null as any,
		clearAllFilter: handleClearAllFilter,
		updateFilter: handleUpdateColumnFilter,
		confirmFilter: null as any,
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
		isHalf,
		isSelectAll,
		filterInstance,
		renderUpdateKey,
		filterParamsCache,
		handleSelectAllClick,
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
		getAllFilterParams,
		loadExpandData,
	};
};

export type VirtualTableType = ReturnType<typeof useVirtualTable>;
