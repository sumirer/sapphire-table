import { VirtualGrid } from './VirtualGrid';
import type { IExpandParams, IRowRenderItem, ITableColumn } from '../types/types';
import { deepClone } from '../utils/utils';
import { observer } from '../observer/Observer';

export class VirtualTable {
	/**
	 * Represents the column data for the body section of the table.
	 *
	 * @remarks
	 * This property holds an array of column objects, each representing a column in the body section of the table.
	 * The column objects should have properties such as `key`, `title`, `dataIndex`, and `fixed`.
	 *
	 * @type {Array<ITableColumn>}
	 * @default []
	 */
	public bodyColumns: Array<ITableColumn> = [];

	/**
	 * Represents the column data for the left fixed section of the table.
	 *
	 * @remarks
	 * This property holds an array of column objects, each representing a column in the left fixed section of the table.
	 * The column objects should have properties such as `key`, `title`, `dataIndex`, and `fixed`.
	 *
	 * @type {Array<ITableColumn>}
	 * @default []
	 */
	public leftFixedColumns: Array<ITableColumn> = [];

	/**
	 * Represents the column data for the right fixed section of the table.
	 *
	 * @remarks
	 * This property holds an array of column objects, each representing a column in the right fixed section of the table.
	 * The column objects should have properties such as `key`, `title`, `dataIndex`, and `fixed`.
	 *
	 * @type {Array<ITableColumn>}
	 * @default []
	 */
	public rightFixedColumns: Array<ITableColumn> = [];

	/**
	 * Represents the body grid instance for the table.
	 *
	 * @type {VirtualGrid}
	 */
	public bodyGrid = new VirtualGrid();

	/**
	 * Represents the left fixed grid instance for the table.
	 *
	 * @type {VirtualGrid}
	 */
	public leftFixedGrid = new VirtualGrid();

	/**
	 * Represents the right fixed grid instance for the table.
	 *
	 * @type {VirtualGrid}
	 */
	public rightFixedGrid = new VirtualGrid();

	/**
	 * Represents the row data for the table.
	 *
	 * @type {IRowRenderItem[]}
	 * @default []
	 */
	public rowData: IRowRenderItem[] = [];

	/**
	 * Represents the observer for the row height.
	 *
	 * @type {Observer<number>}
	 * @default 0
	 */
	public rowHeight = observer(0);

	/**
	 * Updates the column configuration for the table, separating fixed columns and body columns.
	 *
	 * @param columns - An array of column objects to be displayed in the table.
	 * Each column object should have properties such as `key`, `title`, `dataIndex`, and `fixed`.
	 *
	 * @returns {void}
	 *
	 * @remarks
	 * This method categorizes the provided columns into fixed columns (left and right) and body columns.
	 * It then updates the corresponding column arrays in the VirtualTable instance.
	 * After updating the column arrays, it calls the `updateGridData` and `updateTableLayout` methods.
	 *
	 */
	public updateTableColumn(columns: Array<ITableColumn>) {
		const rightFixedColumns: Array<ITableColumn> = [];
		const bodyColumns: Array<ITableColumn> = [];
		const leftFixedColumns: Array<ITableColumn> = [];
		columns.forEach((col) => {
			if (col.fixed === 'right') {
				rightFixedColumns.push(col);
			} else if (col.fixed === 'left') {
				leftFixedColumns.push(col);
			} else {
				bodyColumns.push(col);
			}
		});
		this.leftFixedColumns = leftFixedColumns;
		this.bodyColumns = bodyColumns;
		this.rightFixedColumns = rightFixedColumns;
		this.updateGridData();
		this.updateTableLayout();
	}

	/**
	 * Updates the grid cell render information for the body, left fixed, and right fixed grids.
	 *
	 * @remarks
	 * This method initializes the grid cell render information for each grid based on the corresponding column data.
	 * It calls the `initGridCellRenderInfo` method of the `VirtualGrid` instances for each grid.
	 *
	 * @returns {void}
	 *
	 * @example
	 * ```typescript
	 * // Update the grid cell render information
	 * virtualTable.updateGridData();
	 * ```
	 */
	private updateGridData() {
		this.bodyGrid.initGridCellRenderInfo(this.bodyColumns);
		this.leftFixedGrid.initGridCellRenderInfo(this.leftFixedColumns);
		this.rightFixedGrid.initGridCellRenderInfo(this.rightFixedColumns);
	}

	/**
	 * Updates the table data, row height, and grid layouts with the provided data and parameters.
	 *
	 * @param dataList - An array of data objects to populate the table.
	 * @param expandData - An object containing expand-related parameters.
	 * @param presetHeight - The preset height for each row in the table.
	 *
	 * @returns {void}
	 *
	 * @remarks
	 * This method initializes the row data, updates the scroll offset, grid row data, table layout, and row height.
	 * It also resets the scroll offset to (0, 0) and triggers updates for all relevant components.
	 *
	 * @example
	 * ```typescript
	 * const dataList = [
	 *   { id: 1, name: 'John', age: 25 },
	 *   { id: 2, name: 'Alice', age: 30 },
	 * ];
	 * const expandData = { isExpand: false, rowIndex: -1 };
	 * const presetHeight = 40;
	 * virtualTable.updateTableData(dataList, expandData, presetHeight);
	 * ```
	 */
	public updateTableData(dataList: Array<any>, expandData: IExpandParams, presetHeight: number) {
		let offset = 0;
		this.rowData =
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
		this.updateScrollOffset(0, 0);
		this.updateAllGridRowData();
		this.updateTableLayout();
		this.updateRowHeight();
	}

	/**
	 * Updates the row data for all the fixed and body grids.
	 *
	 * This method replaces the existing row data in the body grid, left fixed grid, and right fixed grid
	 * with the current row data stored in the VirtualTable instance.
	 *
	 * @returns {void}
	 */
	public updateAllGridRowData() {
		this.bodyGrid.gridRows.replace(this.rowData);
		this.leftFixedGrid.gridRows.replace(this.rowData);
		this.rightFixedGrid.gridRows.replace(this.rowData);
	}

	/**
	 * Updates the scroll offset of the table's fixed and body grids.
	 *
	 * @param x - The new horizontal scroll offset.
	 * @param y - The new vertical scroll offset.
	 *
	 * @returns {void}
	 *
	 * @remarks
	 * This method updates the scroll offset for the left fixed grid, right fixed grid, and body grid.
	 * It sets the horizontal scroll offset to 0 for the fixed grids and passes the provided vertical scroll offset to all grids.
	 *
	 * @example
	 * ```typescript
	 * // Update the scroll offset to (100, 200)
	 * virtualTable.updateScrollOffset(100, 200);
	 * ```
	 */
	public updateScrollOffset(x: number, y: number) {
		this.leftFixedGrid.updateWindowOffset(0, y);
		this.rightFixedGrid.updateWindowOffset(0, y);
		this.bodyGrid.updateWindowOffset(x, y);
	}

	/**
	 * Updates the layout of the table by requesting layout updates for the fixed and body grids.
	 * Additionally, it triggers a column width test for the body grid.
	 *
	 * @returns {void}
	 */
	public updateTableLayout(): void {
		this.leftFixedGrid.requestLayoutUpdate();
		this.bodyGrid.requestLayoutUpdate();
		this.rightFixedGrid.requestLayoutUpdate();
		this.bodyGrid.testColumnWidth();
	}

	/**
	 * Updates the total height of the table rows and recalculates the render offsets.
	 * This method iterates through the row data, calculates the cumulative height,
	 * and updates the render offsets and total height of the table.
	 *
	 * @returns {void}
	 */
	public updateRowHeight(): void {
		let totalHeight = 0;
		this.rowData.forEach((value) => {
			value.renderOffset = totalHeight;
			totalHeight += value.renderRowHeight + value.expandHeight;
		});
		this.rowHeight.replace(totalHeight);
		this.updateAllGridRowData();
	}

	/**
	 * Finds the row data and index based on the provided index or search callback.
	 * @param indexOrSearchCallback - The index of the row or a search callback function.
	 * The function will only find the first matching element.
	 * @returns An object containing the index of the row and the corresponding row data.
	 * If no match is found, the index will be -1 and the row data will be `undefined`.
	 */
	public getRenderRowIndexByIndexOrSearch = (
		indexOrSearchCallback: number | ((data: any) => boolean)
	) => {
		let findData: IRowRenderItem | undefined = undefined;
		let dataIndex = 0;
		if (typeof indexOrSearchCallback === 'number') {
			findData = this.rowData[indexOrSearchCallback];
			dataIndex = indexOrSearchCallback;
		} else {
			for (let index = 0; index < this.rowData.length; index++) {
				const renderRowItem = this.rowData[index];
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
	};
}
