import type {
	CellInfo,
	ICellRenderCallback,
	IColumnRenderItem,
	IFilterParams,
	IGridDescribe,
	IRenderInfo,
	IScrollOffset,
	ITableColumns,
	Rectangle,
} from '../types/types';
import { deepClone } from '../utils/utils';
import type { IGridCellSpan } from '../types/types';

/**
 * Creates a new instance of `IGridDescribe` with default values.
 *
 * @returns A new instance of `IGridDescribe`.
 */
export function createGridDescribe(): IGridDescribe {
	return {
		gridColumns: [],
		gridHeaderColumns: [],
		gridRows: [],
		gridWidth: 0,
		gridContentWidth: 0,
		gridHeight: 0,
		gridContentHeight: 0,
		offsetX: 0,
		offsetY: 0,
		renderInfo: {
			renderColumnEnd: 0,
			renderColumnStart: 0,
			renderRowEnd: 0,
			renderRowStart: 0,
		},
		headerRenderInfo: {
			renderColumnEnd: 0,
			renderColumnStart: 0,
		},
		verticalRenderFillDistance: 100,
		horizontalRenderFillDistance: 100,
		lastUpdateTask: undefined,
		selectCell: {},
		cellSpans: {},
		maxColumnDeepLength: 1,
	};
}

/**
 * Requests an update to the grid layout and rendering.
 *
 * This function is responsible for initiating a delayed task to update the grid layout and rendering.
 * If a previous update task is still pending, it will be canceled before starting a new one.
 * The new update task will call the `computeGridCellLayoutAndRender` function with the provided `describe` parameter.
 *
 * @param describe - The grid description object containing necessary information for rendering and layout.
 * @remarks
 * The `describe` object is expected to contain the following properties:
 * - `lastUpdateTask`: A timeout ID representing the last update task. If not `undefined`, the task will be canceled.
 */
export function requestGridLayoutUpdate(describe: IGridDescribe) {
	if (describe.lastUpdateTask) {
		clearTimeout(describe.lastUpdateTask);
	}
	describe.lastUpdateTask = setTimeout(() => {
		calculateVisibleCells(describe);
		if (describe.maxColumnDeepLength > 1) {
			calculateVisibleHeaderCell(describe);
		} else {
			Object.assign(describe.headerRenderInfo, {
				renderColumnEnd: describe.renderInfo.renderColumnEnd,
				renderColumnStart: describe.renderInfo.renderColumnStart,
			});
		}
		describe.lastUpdateTask = undefined;
	}, 0);
}

/**
 * Updates the scroll position of the grid by setting the `offsetX` and `offsetY` properties of the `describe` object.
 * It then triggers a grid layout update by calling the `requestGridLayoutUpdate` function.
 *
 * @param describe - The grid description object containing necessary information for rendering and layout.
 * @param offset - The new scroll position to be applied to the grid.
 * @param offset.x - The new horizontal scroll position.
 * @param offset.y - The new vertical scroll position.
 */
export function updateGridOffset(describe: IGridDescribe, offset: IScrollOffset) {
	describe.offsetX = offset.x;
	describe.offsetY = offset.y;
	requestGridLayoutUpdate(describe);
}

/**
 * Calculates the visible cells within the grid based on the current scroll position and render fill distances.
 *
 * @param describe - The grid description object containing necessary information for rendering and layout.
 * @remarks
 * This function calculates the start and end indices of the rows and columns that should be rendered based on the current scroll position and render fill distances.
 * The calculated indices are then used to update the `renderInfo` property of the `describe` object.
 */
export function calculateVisibleCells(describe: IGridDescribe): void {
	const {
		offsetY: renderYPosition,
		offsetX: renderXPosition,
		gridRows,
		gridHeight,
		gridWidth,
		horizontalRenderFillDistance,
		gridColumns,
		verticalRenderFillDistance,
	} = describe;
	const { renderRowStart: oldRowStart, renderColumnStart: oldColStart } = describe.renderInfo;

	const { startIndex: rowStartIndex, endIndex: rowEndIndex } = calculateRenderRangeIndices(
		gridRows,
		oldRowStart,
		[
			renderYPosition - verticalRenderFillDistance,
			renderYPosition + gridHeight + verticalRenderFillDistance,
		],
		{ offset: 'renderOffset', length: 'renderRowHeight', expand: 'expandHeight' }
	);

	const { startIndex: colStartIndex, endIndex: colEndIndex } = calculateRenderRangeIndices(
		gridColumns,
		oldColStart,
		[
			renderXPosition - horizontalRenderFillDistance,
			renderXPosition + gridWidth + horizontalRenderFillDistance,
		],
		{ offset: 'renderOffset', length: 'renderWidth' }
	);

	Object.assign(describe.renderInfo, {
		renderRowStart: rowStartIndex,
		renderRowEnd: rowEndIndex,
		renderColumnStart: colStartIndex,
		renderColumnEnd: colEndIndex,
	});
}

/**
 * Calculates the visible header cells based on the grid's current state.
 *
 * @param describe - The grid description object containing necessary information for rendering and layout.
 *
 * @remarks
 * This function uses the `calculateRenderRangeIndices` helper function to determine the visible header cells
 * based on the grid's current scroll position and the available grid width.
 * The function updates the `headerRenderInfo` object with the start and end indices of the visible header cells.
 */
export function calculateVisibleHeaderCell(describe: IGridDescribe): void {
	const {
		headerRenderInfo,
		gridHeaderColumns,
		gridWidth,
		offsetX: renderXPosition,
		horizontalRenderFillDistance,
	} = describe;
	const { renderColumnStart: oldColStart } = headerRenderInfo;

	const { startIndex: colStartIndex, endIndex: colEndIndex } = calculateRenderRangeIndices(
		gridHeaderColumns,
		oldColStart,
		[
			renderXPosition - horizontalRenderFillDistance,
			renderXPosition + gridWidth + horizontalRenderFillDistance,
		],
		{ offset: 'renderOffset', length: 'renderWidth' }
	);

	Object.assign(describe.headerRenderInfo, {
		renderColumnStart: colStartIndex,
		renderColumnEnd: colEndIndex,
	});
}
/**
 * Initializes the grid columns based on the provided table columns and updates the grid description.
 *
 * @param describe - The grid description object containing necessary information for rendering and layout.
 * @param columns - The array of table columns to initialize the grid with.
 *
 * @remarks
 * This function calculates the total width of the columns and initializes the `gridColumns` property of the `describe` object.
 * It also updates the `gridContentWidth` property with the calculated total width.
 * Finally, it triggers a grid layout update by calling the `requestGridLayoutUpdate` function.
 */
export function initializeGridColumns(describe: IGridDescribe, columns: ITableColumns) {
	const { column, width, deepLength } = parseComposeColumnData(columns);
	describe.maxColumnDeepLength = deepLength;
	if (deepLength > 1) {
		const parseGridColumns: IColumnRenderItem[] = [];
		getLastChildColumn(column, parseGridColumns);
		reComputeColumnOffset(parseGridColumns);
		describe.gridColumns = parseGridColumns;
	} else {
		describe.gridColumns = column;
	}
	describe.gridHeaderColumns = column;
	describe.gridContentWidth = width;
	requestGridLayoutUpdate(describe);
	return deepLength;
}

/**
 * Updates the render information for each column in the grid.
 *
 * This function iterates through the grid columns, calculates the cumulative width of each column,
 * and updates the `renderOffset` and `gridContentWidth` properties of the grid description.
 *
 * @param describe - The grid description object containing necessary information for rendering and layout.
 * @remarks
 * The `describe` object is expected to contain the following properties:
 * - `gridColumns`: An array of column render items.
 * - `gridContentWidth`: The total width of the grid content.
 */
export function updateColumnRenderInfo(describe: IGridDescribe) {
	reComputeColumnOffset(describe.gridHeaderColumns);
	if (describe.maxColumnDeepLength > 1) {
		const parseGridColumns: IColumnRenderItem[] = [];
		getLastChildColumn(describe.gridHeaderColumns, parseGridColumns);
		describe.gridColumns = parseGridColumns;
	} else {
		describe.gridColumns = [...describe.gridHeaderColumns];
	}
	describe.gridContentWidth = reComputeColumnOffset(describe.gridColumns);
	requestGridLayoutUpdate(describe);
}

/**
 * Ensures that the total width of the columns in the grid fills the available space.
 * If the total width is less than the available grid width, the remaining space is distributed evenly among all columns.
 *
 * @param describe - The grid description object containing necessary information for rendering and layout.
 * @remarks
 * This function calculates the total width of the columns and compares it to the available grid width.
 * If the total width is less than the available grid width, the remaining space is distributed evenly among all columns.
 * The function uses the `allocateSpace` helper function to perform the distribution.
 */
export function ensureColumnWidthsFillSpace(describe: IGridDescribe) {
	const { gridWidth: renderColumnWidth, gridHeaderColumns: columnData } = describe;
	let renderMaxWidth = 0;

	// Iterate through each column to calculate the total render width
	for (let index = 0; index < columnData.length; index++) {
		renderMaxWidth += columnData[index].renderWidth;

		// If the total render width is greater than or equal to the available grid width,
		// no further action is needed
		if (renderMaxWidth >= renderColumnWidth) {
			return;
		}
	}
	// If the total render width is less than the available grid width,
	// distribute the remaining space evenly among all columns
	allocateGridColumnSpace(describe, renderColumnWidth - renderMaxWidth);
}

/**
 * Distributes the remaining space evenly among all columns in the grid.
 *
 * This function calculates the remaining space based on the given size and the total width of the columns.
 * It then evenly distributes this remaining space among all columns by incrementing their `renderWidth` property.
 * Finally, it updates the column render information by calling the `updateColumnRenderInfo` function.
 *
 * @param describe - The grid description object containing necessary information for rendering and layout.
 * @param size - The remaining space to be distributed among the columns.
 */
function allocateGridColumnSpace(describe: IGridDescribe, size: number) {
	allocateGridColumnChildSpace(describe.gridHeaderColumns, size);
	updateColumnRenderInfo(describe);
}

/**
 * Distributes the remaining space evenly among all columns in the grid.
 *
 * @param columns - An array of column render items, each representing a column in the grid.
 * @param size - The remaining space to be distributed among the columns.
 *
 * @remarks
 * This function calculates the remaining space based on the given size and the total width of the columns.
 * It then evenly distributes this remaining space among all columns by incrementing their `renderWidth` property.
 * If a column has children, this function recursively calls itself with the children array to distribute the space among the child columns.
 */
function allocateGridColumnChildSpace(columns: IColumnRenderItem[], size: number) {
	const childWidth = Math.floor(size / columns.length);
	columns.forEach((col) => {
		col.renderWidth += childWidth;
		if (col.children && col.children.length > 0) {
			allocateGridColumnChildSpace(col.children, childWidth);
		}
	});
}

/**
 * Calculates the start and end indices of the range to render based on the given parameters,
 * such as the list of elements, cache start index, maximum range, and options for accessing offset and length properties.
 *
 * @template T - The type of elements in the list.
 * @param {Array<T>} list - The list of elements to search through.
 * @param {number} cacheStartIndex - The starting index from the previous render operation.
 * @param {[number, number]} maxRange - The maximum range to consider for rendering, as [start, end].
 * @param {Object} options - Options for accessing offset and length properties of list elements.
 * @param {keyof T} options.offset - The key to access the offset property of list elements.
 * @param {keyof T} options.length - The key to access the length property of list elements.
 * @private
 */
export function calculateRenderRangeIndices<T>(
	list: Array<T>,
	cacheStartIndex: number,
	maxRange: [number, number],
	options: { offset: keyof T; length: keyof T; expand?: keyof T }
) {
	const { offset, length, expand } = options;
	let startIndex = 0;
	let endIndex = 0;
	let findStart = false;
	const cacheLast = list[cacheStartIndex];
	if (cacheLast) {
		let newStartIndex = cacheStartIndex;
		// 上次渲染位置在当前之下，需要向上查找位置
		const isBefore = (cacheLast[offset] as number) >= maxRange[0];
		const getRowItemHeightByIndex = (index: number) => {
			let expandHeight = 0;
			if (expand) {
				expandHeight = (list[index][expand] as number) || 0;
			}
			return (list[index][length] as number) + (list[index][offset] as number) + expandHeight;
		};
		while (
			newStartIndex >= 0 &&
			newStartIndex < list.length &&
			(isBefore
				? getRowItemHeightByIndex(newStartIndex) >= maxRange[0]
				: getRowItemHeightByIndex(newStartIndex) <= maxRange[0])
		) {
			if (isBefore) {
				newStartIndex--;
			} else {
				newStartIndex++;
			}
		}
		findStart = true;
		startIndex = newStartIndex < 0 ? 0 : newStartIndex;
	}
	// 向下查找到渲染结束位置
	for (let index = startIndex; index < list.length; index++) {
		const target = list[index];
		if (!findStart && (target[offset] as number) < maxRange[0]) {
			startIndex = index;
		}
		if (
			doNumberRangesOverlap(
				[target[offset] as number, (target[length] as number) + (target[offset] as number)],
				maxRange
			)
		) {
			if (!findStart) {
				findStart = true;
			}
		}
		endIndex = index;
		if ((target[offset] as number) > maxRange[1]) {
			break;
		}
	}
	return {
		startIndex,
		endIndex,
	};
}

/**
 * Checks if two number ranges overlap.
 * This function takes two number ranges, represented as arrays of two numbers, and determines if they overlap.
 * A range is considered to overlap if any part of it falls within the other range.
 * @param range1 - The first number range, represented as an array of two numbers: [start, end].
 * @param range2 - The second number range, represented as an array of two numbers: [start, end].
 * @returns true if the two number ranges overlap, false otherwise.
 * @example
 * const range1 = [10, 20];
 * const range2 = [15, 25];
 * console.log(doNumberRangesOverlap(range1, range2)); // Output: true
 * const range3 = [5, 10];
 * const range4 = [15, 20];
 * console.log(doNumberRangesOverlap(range3, range4)); // Output: false
 */
function doNumberRangesOverlap(range1: [number, number], range2: [number, number]): boolean {
	return (
		(range1[0] >= range2[0] && range1[0] <= range2[1]) ||
		(range1[1] >= range2[0] && range1[1] <= range2[1]) ||
		(range2[0] >= range1[0] && range2[0] <= range1[1]) ||
		(range2[1] >= range1[0] && range2[1] <= range1[1])
	);
}

/**
 * Checks if two rectangles intersect.
 * This function takes two rectangles as input and determines if they intersect.
 * An intersection occurs when any part of one rectangle overlaps with any part of the other rectangle.
 * @param rect1
 * @param rect2
 */
export function doRectanglesIntersect(rect1: Rectangle, rect2: Rectangle): boolean {
	if (rect2.x + rect2.width <= rect1.x) {
		return false;
	}
	if (rect2.x >= rect1.x + rect1.width) {
		return false;
	}
	if (rect2.y + rect2.height <= rect1.y) {
		return false;
	}
	return rect2.y < rect1.y + rect1.height;
}

/**
 * Calculates the selection rectangle based on the given start and end cell information.
 *
 * @param cellStart - The cell information representing the start of the selection.
 * @param cellEnd - The cell information representing the end of the selection.
 *
 * @returns An object containing the start and end coordinates of the selection rectangle.
 * - `startX`: The row index of the start of the selection rectangle.
 * - `startY`: The column index of the start of the selection rectangle.
 * - `endX`: The row index of the end of the selection rectangle.
 * - `endY`: The column index of the end of the selection rectangle.
 *
 * @remarks
 * This function takes into account the row and column spans of the cells to calculate the selection rectangle.
 * If the start cell is positioned after the end cell, the function adjusts the row and column indices accordingly.
 */
export function getGridSelectionRect(cellStart: CellInfo, cellEnd: CellInfo) {
	let useRowSpan = cellEnd.rowSpan;
	let useColSpan = cellEnd.colSpan;
	const result = {
		startX: Math.min(cellStart.cellRow, cellEnd.cellRow),
		startY: Math.min(cellStart.cellCol, cellEnd.cellCol),
		endX: Math.max(cellStart.cellRow, cellEnd.cellRow),
		endY: Math.max(cellStart.cellCol, cellEnd.cellCol),
	};
	if (cellStart.cellRow > result.startX || cellStart.cellCol > result.startY) {
		useRowSpan = cellStart.rowSpan;
		useColSpan = cellStart.colSpan;
	}
	result.endX += useRowSpan;
	result.endY += useColSpan;
	return result;
}

/**
 * Computes the row and column spans for each cell in the grid.
 *
 * @param describe - The grid description object containing necessary information for rendering and layout.
 * @param renderInfo
 * @param computeCallback - An optional callback function that can be used to customize the row and column spans for each cell.
 *
 * @remarks
 * This function iterates through each row and column in the grid, and calculates the row and column spans for each cell.
 * If a `computeCallback` function is provided, it will be used to customize the row and column spans for each cell.
 * The calculated row and column spans are stored in the `cellSpans` property of the `describe` object.
 */
export function computeGridCellSpans(
	describe: IGridDescribe,
	renderInfo: IRenderInfo,
	computeCallback?: ICellRenderCallback
) {
	const spans: Record<number, Record<number, IGridCellSpan>> = {};
	const { renderColumnStart, renderRowStart, renderRowEnd, renderColumnEnd } = renderInfo;
	for (let rowIndex = renderRowStart; rowIndex <= renderRowEnd; rowIndex++) {
		const rowData = describe.gridRows[rowIndex];
		for (let colIndex = renderColumnStart; colIndex <= renderColumnEnd; colIndex++) {
			const colData = describe.gridColumns[colIndex];
			const computeSpans = computeCallback?.(rowData, colData, rowIndex, colIndex) || {
				rowSpan: 1,
				colSpan: 1,
			};
			if (spans[rowIndex]) {
				if (!spans[rowIndex][colIndex]) {
					spans[rowIndex][colIndex] = computeSpans;
				}
			} else {
				spans[rowIndex] = {};
				spans[rowIndex][colIndex] = computeSpans;
			}
			if (computeSpans.colSpan > 1 && computeSpans.rowSpan > 1) {
				for (let rIndex = rowIndex; rIndex < rowIndex + computeSpans.rowSpan; rIndex++) {
					for (let cIndex = colIndex; cIndex < colIndex + computeSpans.colSpan; cIndex++) {
						if (rIndex !== rowIndex || cIndex !== colIndex) {
							if (spans[rIndex]) {
								spans[rIndex][cIndex] = { rowSpan: 0, colSpan: 0 };
							} else {
								spans[rIndex] = {};
								spans[rIndex][cIndex] = { rowSpan: 0, colSpan: 0 };
							}
						}
					}
				}
			}
		}
	}
	describe.cellSpans = spans;
}

/**
 * Parses and composes column data for a grid component.
 *
 * @param columns - The array of column data to be parsed and composed.
 *
 * @param parent
 * @returns An object containing the parsed and composed column data.
 * - `column`: An array of column render items, each representing a column in the grid.
 * - `width`: The total width of all columns combined.
 *
 * @remarks
 * This function iterates through the given array of column data, calculates the width of each column,
 * and constructs a new array of column render items. It also recursively handles nested columns.
 * The total width of all columns is calculated and returned alongside the array of column render items.
 */
function parseComposeColumnData(columns: ITableColumns, parent: Array<number> = []) {
	let totalWidth = 0;
	let deepLength = 1;
	const newColumnList: Array<IColumnRenderItem> = [];
	for (let index = 0; index < columns.length; index++) {
		const targetColumn = columns[index];
		let parseWidth = targetColumn.width ?? 0;
		let children: IColumnRenderItem[] | undefined = undefined;
		let childDeepLength = 1;
		if (targetColumn.children) {
			const {
				column,
				width,
				deepLength: childDeep,
			} = parseComposeColumnData(targetColumn.children, [...parent, index]);
			// get all children width
			parseWidth = width;
			children = column;
			childDeepLength += childDeep;
			deepLength = Math.max(deepLength, childDeepLength);
		}
		const createColumn: IColumnRenderItem = {
			renderWidth: parseWidth,
			width: parseWidth,
			column: targetColumn,
			renderOffset: totalWidth,
			filterParams: targetColumn.filterParams
				? (deepClone(targetColumn.filterParams) as IFilterParams)
				: { type: '', value: undefined, customData: null },
			children,
			deepLength: childDeepLength,
			parent: [...parent, index],
		};
		newColumnList.push(createColumn);
		totalWidth += parseWidth;
	}
	return {
		column: newColumnList,
		width: totalWidth,
		deepLength,
	};
}

/**
 * Retrieves the last child column from the given array of columns and appends it to the columnData array.
 * If a column has children, this function recursively retrieves the last child column from the children array.
 *
 * @param columns - An array of column render items, each representing a column in the grid.
 * @param columnData - An array to store the last child columns retrieved from the given columns array.
 *
 * @returns The columnData array, containing the last child columns retrieved from the given columns array.
 *
 * @remarks
 * This function iterates through the given array of column render items and checks if each column has children.
 * If a column has children, the function recursively calls itself with the children array to retrieve the last child column.
 * If a column does not have children, it appends the column to the columnData array.
 * The function returns the columnData array after processing all columns.
 */
export function getLastChildColumn(columns: IColumnRenderItem[], columnData: IColumnRenderItem[]) {
	columns.forEach((column) => {
		if (column.children && column.children.length > 0) {
			getLastChildColumn(column.children, columnData);
		} else {
			columnData.push({ ...column });
		}
	});
	return columnData;
}

/**
 * Recomputes the render offset for each column in the given array.
 *
 * @param columns - An array of column render items, each representing a column in the grid.
 *
 * @returns The total width of all columns combined after recomputing the render offsets.
 *
 * @remarks
 * This function iterates through the given array of column render items and updates the `renderOffset` property of each column.
 * The `renderOffset` property represents the cumulative width of all columns before the current column.
 * The function also calculates and returns the total width of all columns combined after recomputing the render offsets.
 */
export function reComputeColumnOffset(columns: IColumnRenderItem[]) {
	let totalOffset = 0;
	columns.forEach((column) => {
		column.renderOffset = totalOffset;
		totalOffset += column.renderWidth;
		if (column.children && column.children.length > 0) {
			reComputeColumnOffset(column.children);
		}
	});
	return totalOffset;
}
