import type {
	IColumnRenderItem,
	IExpandParams,
	IFilterParams,
	ILoadDataRequestParams,
	IRowRenderItem,
	ITableColumn,
	ITableConfig,
	ITableDescribe,
} from '../types/types';
import {
	createGridDescribe,
	ensureColumnWidthsFillSpace,
	initializeGridColumns,
	requestGridLayoutUpdate,
	updateGridOffset,
} from './grid';
import type { IScrollOffset } from '../types/types';
import type { ISize } from '../types/types';
import { deepClone } from '../utils/utils';

/**
 * Creates and initializes a new instance of the `ITableDescribe` interface.
 * This interface holds various properties and configurations required for rendering and managing a table.
 *
 * @returns {ITableDescribe} - A new instance of the `ITableDescribe` interface with default values.
 *
 * @remarks
 * The `createTableDescribe` function initializes all properties of the `ITableDescribe` interface with default values.
 * This ensures that the table can be rendered correctly and provides a consistent starting point for managing table configurations.
 */
export function createTableDescribe(): ITableDescribe {
	return {
		tableWidth: 0,
		tableContentWidth: 0,
		tableHeight: 0,
		tableContentHeight: 0,
		headerHeight: 0,
		leftFixedWidth: 0,
		rightFixedWidth: 0,
		bodyWidth: 0,
		bodyHeight: 0,
		leftColumns: [],
		bodyColumns: [],
		rightColumns: [],
		tableRowData: [],
		toolsColumns: [],
		toolBarWidth: 0,
		scrollBarWidth: 0,
		pingLeft: false,
		pingRight: false,
		globalFormatter: {},
		hoverIndex: -1,
		renderUpdateKey: '',
		sortInfo: {
			property: '',
			type: '',
		},
		filterParamsCache: [],
		selectCount: 0,
		rowTotalHeight: 0,
		bodyGrid: createGridDescribe(),
		leftGrid: createGridDescribe(),
		rightGrid: createGridDescribe(),
		offset: {
			x: 0,
			y: 0,
		},
		isHalf: false,
		selectAll: false,
	};
}

/**
 * Updates the table's column configurations and recalculates the layout.
 *
 * @param describe - The table's description object containing various properties and configurations.
 * @param columns - An array of column configurations to be applied to the table.
 *
 * @remarks
 * This function separates the columns into left-fixed, body, and right-fixed columns based on their `fixed` property.
 * It then initializes the respective grid columns for each fixed area and updates the table layout. - The function does not return any value.
 */
export function updateTableColumnsConfig(
	describe: ITableDescribe,
	columns: Array<ITableColumn>
): void {
	const rightFixedColumns: Array<ITableColumn> = [];
	const bodyColumns: Array<ITableColumn> = [];
	const leftFixedColumns: Array<ITableColumn> = [];
	columns?.forEach((col) => {
		if (col.fixed === 'right') {
			rightFixedColumns.push(col);
		} else if (col.fixed === 'left') {
			leftFixedColumns.push(col);
		} else {
			bodyColumns.push(col);
		}
	});
	initializeGridColumns(describe.leftGrid, leftFixedColumns);
	initializeGridColumns(describe.bodyGrid, bodyColumns);
	initializeGridColumns(describe.rightGrid, rightFixedColumns);
	describe.leftColumns = describe.leftGrid.gridColumns;
	describe.bodyColumns = describe.bodyGrid.gridColumns;
	describe.rightColumns = describe.rightGrid.gridColumns;
	updateTableLayout(describe);
}

/**
 * Updates the row data configuration for the table, including expanding rows,
 * calculating row heights, and updating scroll offsets.
 *
 * @param describe - The table's description object containing various properties and configurations.
 * @param dataList - An array of data objects to be used for populating the table rows.
 * @param expandData - An object containing parameters for expanding rows.
 * @param presetHeight - The preset height for each row in the table.
 *
 * @remarks
 * This function initializes the row data for the table, including expand status,
 * selection status, expand height, format cache, render offsets, render row heights,
 * row data, row height, and expand inner data. It also updates the scroll offset,
 * all grid row data, table layout, and calculates the total row height and recalculates
 * render offsets.
 */
export function updateTableRowDataConfig<T>(
	describe: ITableDescribe,
	dataList: Array<T>,
	expandData: IExpandParams,
	presetHeight: number
) {
	let offset = 0;
	describe.tableRowData =
		dataList?.map((item, index) => {
			const addOffset = offset;
			offset += presetHeight;
			return {
				expand: false,
				selection: false,
				expandHeight: 0,
				formatCache: {},
				renderOffset: addOffset,
				renderRowHeight: presetHeight,
				rowData: item,
				rowHeight: presetHeight,
				expandInnerData: { ...deepClone(expandData), rowIndex: index },
			};
		}) || [];
	updateTableScrollOffset(describe, { x: 0, y: 0 });
	updateAllGridRowData(describe);
	updateTableLayout(describe);
	calculateTotalRowHeightAndRecalculateRenderOffsets(describe);
}

/**
 * Updates the table's layout by requesting grid layout updates for each fixed area and ensuring column widths fill the space.
 *
 * @param describe - The table's description object containing various properties and configurations.
 *
 * @remarks
 * This function is responsible for updating the table's layout by requesting grid layout updates for the body, left, and right fixed areas.
 * It also ensures that the column widths in the body area fill the remaining space. - The function does not return any value.
 */
export function updateTableLayout(describe: ITableDescribe): void {
	requestGridLayoutUpdate(describe.bodyGrid);
	requestGridLayoutUpdate(describe.leftGrid);
	requestGridLayoutUpdate(describe.rightGrid);
	ensureColumnWidthsFillSpace(describe.bodyGrid);
}

/**
 * Calculates the total row height and recalculates the render offsets for each row in the table.
 *
 * @param describe - The table's description object containing various properties and configurations.
 *
 * @remarks
 * This function iterates through the `rowData` array in the `describe` object, calculates the total height
 * by accumulating the render row height and expand height for each row, and updates the `renderOffset` property
 * of each row accordingly. The total height is then stored in the `rowTotalHeight` property of the `describe` object.
 * Finally, it calls the `updateAllGridRowData` function to update the row data in the body, left, and right fixed grids. - The function does not return any value.
 */
export function calculateTotalRowHeightAndRecalculateRenderOffsets(describe: ITableDescribe): void {
	let totalHeight = 0;
	describe.tableRowData.forEach((value) => {
		value.renderOffset = totalHeight;
		totalHeight += value.renderRowHeight + value.expandHeight;
	});
	describe.rowTotalHeight = totalHeight;
	updateAllGridRowData(describe);
}

/**
 * Updates the scroll offset for the body, left, and right fixed areas of the table.
 *
 * @param describe - The table's description object containing various properties and configurations.
 * @param offset - The new scroll offset to be applied to the table.
 *
 * @remarks
 * This function updates the scroll offset for the body, left, and right fixed areas of the table.
 * It calls the `updateGridOffset` function for each fixed area to apply the new scroll offset. - This function does not return any value.
 */
export function updateTableScrollOffset(describe: ITableDescribe, offset: IScrollOffset) {
	Object.assign(describe.offset, offset);
	updateGridOffset(describe.bodyGrid, offset);
	updateGridOffset(describe.leftGrid, offset);
	updateGridOffset(describe.rightGrid, offset);
}

/**
 * Finds and returns the row data and index based on the provided index or search callback.
 *
 * @param describe - The table's description object containing various properties and configurations.
 * @param indexOrSearchCallback - Either a row index (number) or a search callback function (function).
 *
 * @returns An object containing the found row index and render information.
 * - `index`: The index of the found row. If not found, it defaults to 0.
 * - `renderInfo`: The render information of the found row. If not found, it defaults to `undefined`.
 *
 * @remarks
 * If a number is provided as the `indexOrSearchCallback`, the function will directly access the row data at that index.
 * If a function is provided, the function will iterate through the `rowData` array and invoke the callback function
 * with each row's data. The first row for which the callback function returns `true` will be considered the found row.
 *
 * @example
 * ```typescript
 * const { index, renderInfo } = findTableRowDataAndIndex(describe, 5);
 * console.log(`Found row index: ${index}, Render info: ${renderInfo}`);
 *
 * const { index, renderInfo } = findTableRowDataAndIndex(describe, (data) => data.id === 123);
 * console.log(`Found row index: ${index}, Render info: ${renderInfo}`);
 * ```
 */
export function findTableRowDataAndIndex(
	describe: ITableDescribe,
	indexOrSearchCallback: number | ((data: any) => boolean)
) {
	let findData: IRowRenderItem | undefined = undefined;
	let dataIndex = 0;
	if (typeof indexOrSearchCallback === 'number') {
		findData = describe.tableRowData[indexOrSearchCallback];
		dataIndex = indexOrSearchCallback;
	} else {
		for (let index = 0; index < describe.tableRowData.length; index++) {
			const renderRowItem = describe.tableRowData[index];
			if (indexOrSearchCallback(renderRowItem.rowData)) {
				findData = renderRowItem;
				dataIndex = index;
				break;
			}
		}
	}
	return {
		index: dataIndex,
		renderInfo: findData,
	};
}

/**
 * Updates the size properties of the table and its fixed areas based on the provided size object.
 *
 * @param describe - The table's description object containing various properties and configurations.
 * @param size - The new size object containing the width and height of the table.
 *
 * @remarks
 * This function updates the `tableWidth`, `tableHeight`, `bodyGrid.gridHeight`, and `bodyGrid.gridWidth` properties
 * of the `describe` object with the corresponding values from the `size` object. It then calls the `updateTableLayout`
 * function to ensure that the table layout is updated accordingly.
 */
export function updateTableSize(describe: ITableDescribe, size: ISize) {
	describe.tableWidth = size.width;
	describe.tableHeight = size.height;
	describe.bodyWidth = size.width;
	describe.bodyHeight = size.height;
	describe.bodyGrid.gridHeight = size.height;
	describe.bodyGrid.gridWidth = size.width;
	updateTableLayout(describe);
}

/**
 * Updates the hover index for the current row based on the provided hover index.
 *
 * @param describe - The table's description object containing various properties and configurations.
 * @param hoverIndex - The index of the row data
 * */
export function updateTableHoverIndex(describe: ITableDescribe, hoverIndex: number) {
	describe.hoverIndex = hoverIndex;
}

/**
 * Updates the expand status of a specific row in the table and recalculates the total row height and layout.
 *
 * @param describe - The table's description object containing various properties and configurations.
 * @param rowIndex - The index of the row to be expanded or collapsed.
 *
 * @remarks
 * This function toggles the expand status of the row at the specified index in the `rowData` array.
 * If the row is currently expanded, it sets the `expand` property to `false` and the `expandHeight` to `0`.
 * If the row is currently collapsed, it sets the `expand` property to `true` and the `expandHeight` to `300`.
 * After updating the row's expand status, it calls the `calculateTotalRowHeightAndRecalculateRenderOffsets` function
 * to recalculate the total row height and render offsets. Finally, it calls the `updateTableLayout` function to update the table layout.
 */
export function updateTableRowExpand(describe: ITableDescribe, rowIndex: number) {
	if (describe.tableRowData[rowIndex].expand) {
		describe.tableRowData[rowIndex].expand = false;
		describe.tableRowData[rowIndex].expandHeight = 0;
	} else {
		describe.tableRowData[rowIndex].expand = true;
		describe.tableRowData[rowIndex].expandHeight = 300;
	}
	calculateTotalRowHeightAndRecalculateRenderOffsets(describe);
	updateTableLayout(describe);
}

/**
 * Updates the selection status of a specific row in the table and recalculates the total selected count.
 *
 * @param describe - The table's description object containing various properties and configurations.
 * @param rowIndex - The index of the row to be updated.
 * @param action - The new selection status (`true` for selected, `false` for deselected).
 *
 * @remarks
 * This function updates the `selection` property of the row at the specified index in the `rowData` array.
 * If the `action` is `true`, it increments the `selectCount` property by 1.
 * If the `action` is `false`, it decrements the `selectCount` property by 1.
 *
 * @example
 * ```typescript
 * updateTableRowSelection(describe, 2, true); // Selects the third row
 * console.log(describe.selectCount); // Output: 1
 * ```
 */
export function updateTableRowSelection(
	describe: ITableDescribe,
	rowIndex: number,
	action: boolean
) {
	describe.tableRowData[rowIndex].selection = action;
	if (action) {
		describe.selectCount += 1;
	} else {
		describe.selectCount -= 1;
	}
	describe.isHalf = describe.selectCount > 0 && describe.selectCount < describe.tableRowData.length;
	describe.selectAll = describe.selectCount === describe.tableRowData.length;
}

/**
 * Updates the selection status of all rows in the table to unselected.
 *
 * @remarks
 * This function resets the `selectCount` property to 0 and iterates through the `rowData` array.
 * For each row, it sets the `selection` property to `false`.
 *
 * @param describe - The table's description object containing various properties and configurations.
 * @example
 * ```typescript
 * updateTableRowToUnSelection(describe);
 * console.log(describe.selectCount); // Output: 0
 * describe.rowData.forEach((row) => console.log(row.selection)); // Output: false for all rows
 * ```
 */
export function updateTableRowToUnSelection(describe: ITableDescribe) {
	describe.selectCount = 0;
	describe.isHalf = false;
	describe.selectAll = false;
	describe.tableRowData.forEach((item) => {
		item.selection = false;
	});
}

/**
 * Updates the selection status of all rows in the table to selected.
 * If the current selection status is half-selected or none, it selects all rows.
 * If the current selection status is all selected, it unselects all rows.
 *
 * @param describe - The table's description object containing various properties and configurations.
 *
 * @remarks
 * This function checks the current selection status (`isHalf` and `selectCount`) and updates the row data accordingly.
 * If `isHalf` is `true` or `selectCount` is `0`, it selects all rows by setting the `selectCount` to the total number of rows,
 * and updating the `selection` property of each row to `true`.
 * If `selectAll` is `true`, it unselects all rows by calling the `updateTableRowToUnSelection` function.
 *
 * @example
 * ```typescript
 * updateTableRowToAllSelection(describe);
 * console.log(describe.selectCount); // Output: Total number of rows
 * describe.rowData.forEach((row) => console.log(row.selection)); // Output: true for all rows
 * ```
 */
export function updateTableRowToAllSelection(describe: ITableDescribe) {
	if (!describe.selectAll) {
		describe.selectCount = describe.tableRowData.length;
		describe.tableRowData.forEach((item) => {
			item.selection = true;
		});
		describe.selectAll = true;
		describe.isHalf = false;
		return;
	} else {
		updateTableRowToUnSelection(describe);
	}
}

/**
 * Sets the selection status of rows in the table based on the provided data and key.
 *
 * @param describe - The table's description object containing various properties and configurations.
 * @param data - An array of objects representing the data for which the selection status needs to be updated.
 * @param key - The key of the property in the data objects that should be used for comparison with the row data.
 *
 * @remarks
 * This function iterates through the `tableRowData` array in the `describe` object.
 * For each row, it checks if the value of the specified `key` in the corresponding data object matches the value in the row data.
 * If a match is found, it updates the selection status of the row by calling the `updateTableRowSelection` function.
 *
 * @example
 * ```typescript
 * const data = [
 *   { id: 1, name: 'John', selected: true },
 *   { id: 2, name: 'Jane', selected: false },
 *   { id: 3, name: 'Bob', selected: true },
 * ];
 * setTableSelectionFormData(describe, data, 'id');
 * // After this function call, the selection status of rows with ids 1 and 3 will be updated to true,
 * // and the selection status of the row with id 2 will be updated to false.
 * ```
 */
export function setTableSelectionFromData<T>(
	describe: ITableDescribe,
	data: Array<T>,
	key: keyof T
) {
	describe.tableRowData.forEach((item, index) => {
		data.forEach((select) => {
			if (select[key] === item[key as unknown as keyof typeof item]) {
				updateTableRowSelection(describe, index, true);
			}
		});
	});
}

/**
 * Retrieves all selected row data from the table's description object.
 *
 * @param describe - The table's description object containing various properties and configurations.
 *
 * @returns An array of selected row data. Each row data is represented as an object.
 *
 * @remarks
 * This function filters the `rowData` array in the `describe` object based on the `selection` property.
 * It then maps the filtered rows to extract the actual row data and returns it as an array.
 *
 * @example
 * ```typescript
 * const selectedData = getTableAllSelectionData(describe);
 * console.log(selectedData); // Output: Array of selected row data
 * ```
 */
export function getTableAllSelectionData(describe: ITableDescribe) {
	return describe.tableRowData.filter((item) => item.selection).map((item) => item.rowData);
}

/**
 * Updates the expand status of a specific row in the table based on the provided index or search callback.
 * If the row is currently expanded, it collapses the row and sets the expand height to 0.
 * If the row is currently collapsed, it expands the row and sets the expand height to 300.
 * After updating the row's expand status, it recalculates the total row height and layout.
 *
 * @param describe - The table's description object containing various properties and configurations.
 * @param indexOrSearchCallback - Either a row index (number) or a search callback function (function).
 *
 * @example
 * ```typescript
 * updateTableExpandByDataIndex(describe, 5); // Expands the row at index 5
 * updateTableExpandByDataIndex(describe, (data) => data.id === 123); // Expands the row with id 123
 * ```
 */
export function updateTableExpandByDataIndex(
	describe: ITableDescribe,
	indexOrSearchCallback: number | ((data: any) => boolean)
) {
	const { index, renderInfo } = findTableRowDataAndIndex(describe, indexOrSearchCallback);
	if (renderInfo) {
		loadTableExpandData(renderInfo);
		updateTableRowExpand(describe, index);
	}
}

/**
 * Reloads the expanded row data for the specified row index.
 *
 * @param describe - The table's description object containing various properties and configurations.
 * @param rowIndex - The index of the row to reload.
 *
 * @remarks
 * This function calls the `loadExpandData` function with the row data at the specified index and updates the row data.
 */
export function reloadTableExpandByDataIndex(describe: ITableDescribe, rowIndex: number) {
	updateTableRowExpand(describe, rowIndex);
}

/**
 * Loads and returns expanded row data based on the provided row data and optional parameters.
 *
 * @param rowData - The row data object for which to load expanded data.
 * @param tableConfig  - Optional configuration object for the table.
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
export function loadTableExpandData(
	rowData: IRowRenderItem,
	tableConfig?: ITableConfig,
	params?: ILoadDataRequestParams
) {
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
}

/**
 * Updates the ping status for the left and right fixed columns based on the current scroll position.
 *
 * @param describe - The table's description object containing various properties and configurations.
 *
 * @remarks
 * This function checks the current scroll position (`offset.x`) and compares it with the table's dimensions
 * to determine whether the left or right fixed columns should be pinged (highlighted).
 * The `pingLeft` and `pingRight` properties of the `describe` object are updated accordingly.
 *
 * @example
 * ```typescript
 * updateTableFixedColumnPing(describe);
 * console.log(describe.pingLeft); // true if left column is pinged, false otherwise
 * console.log(describe.pingRight); // true if right column is pinged, false otherwise
 * ```
 */
export function updateTableFixedColumnPing(describe: ITableDescribe) {
	describe.pingLeft = describe.offset.x > 0;
	describe.pingRight =
		describe.bodyGrid.gridContentWidth > describe.bodyGrid.gridWidth
			? describe.offset.x <
				describe.tableContentWidth +
					describe.rightFixedWidth +
					describe.leftFixedWidth -
					describe.tableWidth
			: false;
}

export function getTableLeftFixedColumnPing(describe: ITableDescribe): boolean {
	return describe.offset.x > 0;
}

export function getTableRightFixedColumnPing(describe: ITableDescribe): boolean {
	return describe.bodyGrid.gridContentWidth > describe.bodyGrid.gridWidth
		? describe.offset.x <
				describe.tableContentWidth +
					describe.rightFixedWidth +
					describe.leftFixedWidth -
					describe.tableWidth
		: false;
}

/**
 * Updates the filter value for a specific column in the table.
 *
 * @param describe - The table's description object containing various properties and configurations.
 * @param colKey - The unique key of the column for which the filter value needs to be updated.
 * @param filterValue - The new filter value to be applied to the specified column.
 *
 * @remarks
 * This function iterates through all columns in the table (left, right, and body) and checks if the column's
 * `colKey` matches the provided `colKey`. If a match is found, it updates the `value` property of the `filterParams`
 * object for the column with the provided `filterValue`.
 */
export function updateTableFilter(describe: ITableDescribe, colKey: string, filterValue: any) {
	runAllColumns(describe, (col) => {
		if (col.column.filterParams?.type && col.column.colKey && col.column.colKey === colKey) {
			col.filterParams.value = filterValue;
		}
	});
}

/**
 * Resets the filter value for all columns in the table.
 *
 * @param describe - The table's description object containing various properties and configurations.
 *
 * @remarks
 * This function iterates through all columns in the table (left, right, and body) and sets the `value` property
 * of the `filterParams` object for each column to `undefined`. This effectively resets the filter for all columns.
 */
export function resetTableAllFilter(describe: ITableDescribe) {
	runAllColumns(describe, (col) => {
		col.filterParams.value = undefined;
	});
}

/**
 * Resets the filter value for a specific column in the table.
 *
 * @param describe - The table's description object containing various properties and configurations.
 * @param columnKey - The unique key of the column for which the filter value needs to be reset.
 *
 * @remarks
 * This function iterates through all columns in the table (left, right, and body) and checks if the column's
 * `colKey` matches the provided `columnKey`. If a match is found, it sets the `value` property of the `filterParams`
 * object for the column to `undefined`. This effectively resets the filter for the specified column.
 */
export function resetTableFilterByColumnKey(describe: ITableDescribe, columnKey: string) {
	runAllColumns(describe, (col) => {
		if (col.column.colKey && col.column.colKey === columnKey) {
			col.filterParams.value = undefined;
		}
	});
}

export function getTableAllFilterParams(describe: ITableDescribe) {
	const filterParamsList: IFilterParams[] = [];
	runAllColumns(describe, (col) => {
		if (col.filterParams.value !== undefined) {
			filterParamsList.push({
				...col.filterParams,
				property: col.column.colKey,
				customData: col.filterParams.customData,
			});
		}
	});
	describe.filterParamsCache = filterParamsList;
	return filterParamsList;
}

/**
 * Updates the row data for all fixed areas (body, left, and right) in the table.
 *
 * @param describe - The table's description object containing various properties and configurations.
 *
 * @remarks
 * This function copies the `rowData` array from the `describe` object to the `gridRows` array
 * in the `bodyGrid`, `leftGrid`, and `rightGrid` properties. This ensures that the row data
 * is synchronized across all fixed areas of the table. - The function does not return any value.
 */
function updateAllGridRowData(describe: ITableDescribe): void {
	describe.bodyGrid.gridRows = describe.tableRowData;
	describe.leftGrid.gridRows = describe.tableRowData;
	describe.rightGrid.gridRows = describe.tableRowData;
}

function runAllColumns(
	describe: ITableDescribe,
	callback: (item: IColumnRenderItem) => void
): void {
	describe.leftColumns.forEach(callback);
	describe.rightColumns.forEach(callback);
	describe.bodyColumns.forEach(callback);
}
