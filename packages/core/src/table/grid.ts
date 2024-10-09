import type {
	IColumnRenderItem,
	IFilterParams,
	IGridDescribe,
	IScrollOffset,
	ITableColumns,
} from '../types/types';
import { deepClone } from '../utils/utils';

/**
 * Creates a new instance of `IGridDescribe` with default values.
 *
 * @returns A new instance of `IGridDescribe`.
 */
export function createGridDescribe(): IGridDescribe {
	return {
		gridColumns: [],
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
		verticalRenderFillDistance: 100,
		horizontalRenderFillDistance: 100,
		lastUpdateTask: undefined,
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
		{ offset: 'renderOffset', length: 'renderRowHeight' }
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
	let totalWidth = 0;
	const newColumnList: Array<IColumnRenderItem> = [];
	for (let index = 0; index < columns.length; index++) {
		const parseWidth = columns[index].width ?? 0;
		newColumnList.push({
			renderWidth: parseWidth,
			width: parseWidth,
			column: columns[index],
			renderOffset: totalWidth,
			filterParams: columns[index].filterParams
				? (deepClone(columns[index].filterParams) as IFilterParams)
				: { type: '', value: undefined, customData: null },
		});
		totalWidth += parseWidth;
	}
	describe.gridColumns = newColumnList;
	describe.gridContentWidth = totalWidth;
	requestGridLayoutUpdate(describe);
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
	let totalWidth = 0;
	const columnData = describe.gridColumns;
	for (let index = 0; index < columnData.length; index++) {
		const parseWidth = columnData[index].renderWidth;
		columnData[index].renderOffset = totalWidth;
		totalWidth += parseWidth;
	}
	describe.gridColumns = [...columnData];
	describe.gridContentWidth = totalWidth;
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
	const { gridWidth: renderColumnWidth, gridColumns: columnData } = describe;
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
	const columnData = describe.gridColumns;
	const columnCount = columnData.length;
	const cellWidth = Math.floor(size / columnCount);
	columnData.forEach((col) => {
		col.renderWidth += cellWidth;
	});
	updateColumnRenderInfo(describe);
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
	options: { offset: keyof T; length: keyof T }
) {
	const { offset, length } = options;
	let startIndex = 0;
	let endIndex = 0;
	let findStart = false;
	const cacheLast = list[cacheStartIndex];
	if (cacheLast) {
		let newStartIndex = cacheStartIndex;
		// 上次渲染位置在当前之下，需要向上查找位置
		const isBefore = (cacheLast[offset] as number) >= maxRange[0];
		while (
			newStartIndex >= 0 &&
			newStartIndex < list.length &&
			(isBefore
				? (list[newStartIndex][offset] as number) + (list[newStartIndex][length] as number) >=
					maxRange[0]
				: (list[newStartIndex][offset] as number) + (list[newStartIndex][length] as number) <=
					maxRange[0])
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
