import type {
	IExpandParams,
	IFilterInstance,
	ILoadDataRequestParams,
	IRowRenderItem,
	ITableColumns,
	ITableConfig,
	ITableDescribe,
} from '@sapphire-table/core';
import {
	createTableDescribe,
	ensureColumnWidthsFillSpace,
	findTableRowDataAndIndex,
	getTableAllFilterParams,
	getTableAllSelectionData,
	loadTableExpandData,
	reloadTableExpandByDataIndex,
	resetTableAllFilter,
	resetTableFilterByColumnKey,
	setTableSelectionFromData,
	updateTableColumnsConfig,
	updateTableExpandByDataIndex,
	updateTableFilter,
	updateTableFixedColumnPing,
	updateTableHoverIndex,
	updateTableRowDataConfig,
	updateTableRowExpand,
	updateTableRowSelection,
	updateTableRowToAllSelection,
	updateTableRowToUnSelection,
	updateTableScrollOffset,
	updateTableSize,
	updateTableLayout as updateLayout,
} from '@sapphire-table/core';
import { useEffect, useRef } from 'react';
import { useUpdate } from './useUpdate';

export const useVirtualTable = (tableConfig?: ITableConfig) => {
	const tableDescribe = useRef<ITableDescribe>(createTableDescribe());

	const { update } = useUpdate();

	useEffect(() => {
		tableDescribe.current.tableContentWidth = tableDescribe.current.bodyGrid.gridContentWidth;
		tableDescribe.current.tableContentHeight = tableDescribe.current.rowTotalHeight;
		update();
	}, [tableDescribe.current.bodyGrid.gridContentWidth, tableDescribe.current.rowTotalHeight]);

	useEffect(() => {
		tableDescribe.current.leftFixedWidth = tableDescribe.current.leftGrid.gridContentWidth;
		tableDescribe.current.rightFixedWidth = tableDescribe.current.rightGrid.gridContentWidth;
		update();
	}, [
		tableDescribe.current.leftGrid.gridContentWidth,
		tableDescribe.current.rightGrid.gridContentWidth,
	]);

	/**
	 * Updates the vertical and horizontal render fill distances for the table body grid.
	 *
	 * @param vertical - The new vertical render fill distance.
	 * @param horizontal - The new horizontal render fill distance.
	 *
	 * @remarks
	 * This function sets the `verticalRenderFillDistance` and `horizontalRenderFillDistance` properties of the `bodyGrid` in the `tableDescribe.current` object to the provided `vertical` and `horizontal` parameters, respectively.
	 * These properties determine the number of rows and columns to render beyond the visible area to improve scrolling performance.
	 *
	 * @example
	 * ```typescript
	 * updateBodyRenderFillDistance(10, 5); // Sets the vertical render fill distance to 10 and horizontal render fill distance to 5
	 * ```
	 */
	const updateBodyRenderFillDistance = (vertical: number, horizontal: number) => {
		tableDescribe.current.bodyGrid.verticalRenderFillDistance = vertical;
		tableDescribe.current.bodyGrid.horizontalRenderFillDistance = horizontal;
		update();
	};

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
		updateTableSize(tableDescribe.current, { width: width, height: height });
		setTimeout(() => {
			update();
		});
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
		updateTableHoverIndex(tableDescribe.current, index);
		update();
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
		updateTableRowExpand(tableDescribe.current, rowIndex);
		update();
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
		updateTableRowSelection(tableDescribe.current, rowIndex, action);
		update();
	};

	/**
	 * Clears the selection for all rows in the table.
	 *
	 * @remarks
	 * This function iterates through all rows in the table and sets the `selection` property to `false`.
	 * It also resets the `selectCount` to `0`.
	 */
	const clearAllSelection = () => {
		updateTableRowToUnSelection(tableDescribe.current);
		update();
	};

	/**
	 * Retrieves the selected row data from the table.
	 *
	 * @remarks
	 * This function filters the table row data based on the 'selection' property, which indicates whether a row is selected.
	 * It then maps the selected rows to their corresponding row data and returns the array.
	 */
	const getSelectionData = () => {
		return getTableAllSelectionData(tableDescribe.current);
	};

	/**
	 * Sets the default selection for the table rows based on the provided data and key.
	 *
	 * @param selectData - An array of objects representing the selected rows.
	 * @param key - The key of the property to compare for selection.
	 */
	const setDefaultSelection = (selectData: Array<any>, key: string) => {
		setTableSelectionFromData(tableDescribe.current, selectData, key);
		update();
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
		return loadTableExpandData(rowData, tableConfig, params);
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
		updateTableExpandByDataIndex(tableDescribe.current, indexOrSearchCallback);
		update();
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
		reloadTableExpandByDataIndex(tableDescribe.current, rowIndex);
		setTimeout(() => {
			update();
		});
	};

	/**
	 * Handles the click event for the select all checkbox.
	 *
	 * @remarks
	 * If the table is in a half-selected state or no rows are selected, this function selects all rows and sets the `selectCount` to the total number of rows.
	 * If the table is in a fully selected state, this function clears all selections by calling the `clearAllSelection` function.
	 */
	const handleSelectAllClick = () => {
		updateTableRowToAllSelection(tableDescribe.current);
		update();
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
		resetTableFilterByColumnKey(tableDescribe.current, colKey);
		update();
	};

	/**
	 * Handles the clear all filter action for the table.
	 *
	 * This function iterates through all columns and resets the filter for each column by setting the `filterParams.value` to `undefined`.
	 * @remarks
	 * The `runAllColumn` function is used to iterate through all columns, and for each column, the `filterParams.value` is set to `undefined`.
	 *
	 * @example
	 * ```typescript
	 * handleClearAllFilter(); // Resets the filter for all columns
	 * ```
	 */
	const handleClearAllFilter = () => {
		resetTableAllFilter(tableDescribe.current);
		update();
	};

	/**
	 * Updates the filter value for the specified column.
	 *
	 * @param colKey - The unique identifier of the column to update the filter for.
	 * @param filterValue - The new filter value to apply to the specified column.
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
		updateTableFilter(tableDescribe.current, colKey, filterValue);
		update();
	};

	/**
	 * This function retrieves all filter parameters applied to the table.
	 * It iterates through all columns and collects the filter parameters for each column where a filter is applied.
	 * The collected filter parameters are then returned as an array.
	 * Each filter parameter object contains the property, filter type, filter value, and custom data.
	 */
	const getAllFilterParams = () => {
		return getTableAllFilterParams(tableDescribe.current);
	};

	const updatePingAction = () => {
		updateTableFixedColumnPing(tableDescribe.current);
		update();
	};

	const updateTableData = (
		dataList: Array<any>,
		expandData: IExpandParams,
		presetHeight: number
	) => {
		updateTableRowDataConfig(tableDescribe.current, dataList, expandData, presetHeight);
		update();
	};

	const getRenderRowIndexByIndexOrSearch = (
		indexOrSearchCallback: number | ((data: any) => boolean)
	) => {
		return findTableRowDataAndIndex(tableDescribe.current, indexOrSearchCallback);
	};

	const updateTableColumn = (column: ITableColumns) => {
		updateTableColumnsConfig(tableDescribe.current, column);
		ensureColumnWidthsFillSpace(tableDescribe.current.bodyGrid);
		update();
	};

	const updateScrollOffset = (x: number, y: number) => {
		updateTableScrollOffset(tableDescribe.current, { x, y });
		updatePingAction();
		update();
	};

	const updateTableLayout = () => {
		updateLayout(tableDescribe.current);
		setTimeout(() => {
			update();
		});
	};

	const updateScrollBodyBarWidth = (width: number) => {
		tableDescribe.current.scrollBarWidth = width;
		update();
	};

	const filterInstance = useRef<IFilterInstance>({
		resetFilter: handleResetFilter,
		closeFilterDialog: null as any,
		clearAllFilter: handleClearAllFilter,
		updateFilter: handleUpdateColumnFilter,
		confirmFilter: null as any,
	});

	return {
		...tableDescribe.current,
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
		updateTableData,
		getRenderRowIndexByIndexOrSearch,
		updateTableColumn,
		updateScrollOffset,
		updateTableLayout,
		updateBodyRenderFillDistance,
		updateScrollBodyBarWidth,
		filterInstance: filterInstance.current,
		updateTableView: update,
	};
};

export type VirtualTableType = ReturnType<typeof useVirtualTable>;
