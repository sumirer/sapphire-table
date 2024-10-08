import { observer } from '../observer/Observer';
import type {
	IColumnRenderItem,
	IFilterParams,
	IRenderInfo,
	IRowRenderItem,
	ITableColumns,
} from '../types/types';
import { deepClone } from '../utils/utils';

export class VirtualGrid {
	/**
	 * Initializes a new instance of the VirtualGrid class.
	 *
	 * This constructor sets up listeners for various grid properties to trigger
	 * layout updates when these properties change. It ensures that the grid's
	 * layout is recalculated whenever key attributes are modified.
	 *
	 * The following properties are monitored for changes:
	 * - offsetX: The horizontal scroll position
	 * - offsetY: The vertical scroll position
	 * - gridContentWidth: The total width of the grid content
	 * - gridContentHeight: The total height of the grid content
	 * - gridColumns: The collection of columns in the grid
	 * - gridRows: The collection of rows in the grid
	 *
	 * When any of these properties change, the `requestLayoutUpdate` method is called
	 * to schedule a layout recalculation.
	 */
	constructor() {
		[
			this.offsetX,
			this.offsetY,
			this.gridContentWidth,
			this.gridContentHeight,
			this.gridColumns,
			this.gridRows,
		].forEach((item) => {
			item.addListener(this.requestLayoutUpdate);
		});
	}

	/**
	 * Initializes arrays to store column and row render items, along with grid dimensions and scroll position.
	 * Also sets up observers for these properties and initializes a variable to store the last update task.
	 */
	public gridColumns = observer<Array<IColumnRenderItem>>([]);

	public gridRows = observer<Array<IRowRenderItem>>([]);

	/**
	 * Represents the width of the grid box.
	 */
	public gridWidth = observer(0);

	/**
	 * Represents the total width of the grid content.
	 */
	public gridContentWidth = observer(0);

	/**
	 * Represents the height of the grid box.
	 */
	public gridHeight = observer(0);

	/**
	 * Represents the total height of the grid content.
	 */
	public gridContentHeight = observer(0);

	/**
	 * Represents the horizontal scroll position of the window.
	 */
	public offsetX = observer(0);

	/**
	 * Represents the vertical scroll position of the window.
	 */
	public offsetY = observer(0);

	/**
	 * Stores information about the rendered cells, such as the start and end indices of rows and columns.
	 */
	public renderInfo = observer<IRenderInfo>({
		renderColumnEnd: 0,
		renderColumnStart: 0,
		renderRowEnd: 0,
		renderRowStart: 0,
	});

	/**
	 * Represents the vertical distance in pixels to fill before and after the visible area when rendering.
	 */
	public verticalRenderFillDistance = 100;

	/**
	 * Represents the horizontal distance in pixels to fill before and after the visible area when rendering.
	 */
	public horizontalRenderFillDistance = 100;

	/**
	 * Stores the ID of the last scheduled layout update task.
	 * This is used to cancel the task if a new one is scheduled before the previous one completes.
	 */
	private lastUpdateTask: ReturnType<typeof setTimeout> | undefined;

	/**
	 * Updates the window offset position for the grid.
	 *
	 * @param x - The new horizontal scroll position.
	 * @param y - The new vertical scroll position.
	 *
	 * @returns {void} This function does not return a value.
	 * It updates the `offsetX` and `offsetY` properties of the grid.
	 */
	public updateWindowOffset(x: number, y: number) {
		this.offsetX.replace(x);
		this.offsetY.replace(y);
	}

	/**
	 * Schedules a layout update for the grid.
	 *
	 * This function checks if there is an existing scheduled layout update. If there is, it clears the timeout.
	 * Then, it sets a new timeout to call the `computeGridCellLayoutAndRender` method after a delay.
	 * After the layout update is complete, the `lastUpdateTask` is set to `undefined`.
	 *
	 * @returns {void} This function does not return a value.
	 */
	public requestLayoutUpdate = () => {
		if (this.lastUpdateTask) {
			clearTimeout(this.lastUpdateTask);
		}
		this.lastUpdateTask = setTimeout(() => {
			this.computeGridCellLayoutAndRender();
			this.lastUpdateTask = undefined;
		});
	};

	/**
	 * Computes the horizontal and vertical rendering ranges of the grid and updates the render interval.
	 * This method calculates the visible range of rows and columns based on the current scroll position
	 * and grid dimensions, including a buffer area for smoother scrolling.
	 *
	 * @private
	 * @returns {void} This method doesn't return a value, but updates the internal renderInfo state.
	 */
	private computeGridCellLayoutAndRender(): void {
		const { renderRowStart: oldRowStart, renderColumnStart: oldColStart } =
			this.renderInfo.target.value;
		const renderXPosition = this.offsetX.target.value;
		const renderYPosition = this.offsetY.target.value;

		const { startIndex: rowStartIndex, endIndex: rowEndIndex } = this.getRenderRangeIndex(
			this.gridRows.target.value,
			oldRowStart,
			[
				renderYPosition - this.verticalRenderFillDistance,
				renderYPosition + this.gridHeight.target.value + this.verticalRenderFillDistance,
			],
			{ offset: 'renderOffset', length: 'renderRowHeight' }
		);

		const { startIndex: colStartIndex, endIndex: colEndIndex } = this.getRenderRangeIndex(
			this.gridColumns.target.value,
			oldColStart,
			[
				renderXPosition - this.horizontalRenderFillDistance,
				renderXPosition + this.gridWidth.target.value + this.horizontalRenderFillDistance,
			],
			{ offset: 'renderOffset', length: 'renderWidth' }
		);

		this.renderInfo.replace({
			renderRowStart: rowStartIndex,
			renderRowEnd: rowEndIndex,
			renderColumnStart: colStartIndex,
			renderColumnEnd: colEndIndex,
		});
	}

	/**
	 * Calculates the range of elements to be rendered based on the given parameters.
	 * This function optimizes rendering by using the cached start index to reduce computations.
	 *
	 * @template T - The type of elements in the list.
	 * @param {Array<T>} list - The list of elements to search through.
	 * @param {number} cacheStartIndex - The starting index from the previous render operation.
	 * @param {[number, number]} maxRange - The maximum range to consider for rendering, as [start, end].
	 * @param {Object} options - Options for accessing offset and length properties of list elements.
	 * @param {keyof T} options.offset - The key to access the offset property of list elements.
	 * @param {keyof T} options.length - The key to access the length property of list elements.
	 * @returns {{startIndex: number, endIndex: number}} An object containing the start and end indices of the range to render.
	 * @private
	 */
	public getRenderRangeIndex<T>(
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
				this.doNumberRangesOverlap(
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
	 * Determines if two number ranges overlap.
	 *
	 * @param range1 - The first range to check, represented as an array of two numbers: [start, end].
	 * @param range2 - The second range to check, represented as an array of two numbers: [start, end].
	 *
	 * @returns {boolean} - Returns `true` if the two ranges overlap, meaning they have at least one common point.
	 * Otherwise, returns `false`.
	 */
	private doNumberRangesOverlap(range1: [number, number], range2: [number, number]): boolean {
		return (
			(range1[0] >= range2[0] && range1[0] <= range2[1]) ||
			(range1[1] >= range2[0] && range1[1] <= range2[1]) ||
			(range2[0] >= range1[0] && range2[0] <= range1[1]) ||
			(range2[1] >= range1[0] && range2[1] <= range1[1])
		);
	}

	/**
	 * Initializes the column data for the grid.
	 *
	 * @param columns - The array of column definitions to be used in the grid.
	 * Each column definition should contain a `width` property (optional) and other relevant properties.
	 *
	 * @returns {void} This function does not return a value.
	 * It initializes the `gridColumns` array with new `IColumnRenderItem` objects,
	 * updates the `gridContentWidth`, and triggers a layout update by calling `requestLayoutUpdate`.
	 */
	public initGridCellRenderInfo(columns: ITableColumns) {
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
		this.gridColumns.replace(newColumnList);
		this.gridContentWidth.replace(totalWidth);
		this.requestLayoutUpdate();
	}

	/**
	 * Updates the render width and offset of each column in the grid.
	 *
	 * This function iterates through the column data, calculates the total render width,
	 * and updates the render offset and width of each column. The total render width is
	 * then used to update the `gridContentWidth` property.
	 *
	 * @returns {void} This function does not return a value.
	 * It updates the `gridColumns` and `gridContentWidth` properties.
	 */
	public updateGridCellRenderInfo() {
		let totalWidth = 0;
		const columnData = this.gridColumns.target.value;
		for (let index = 0; index < columnData.length; index++) {
			const parseWidth = columnData[index].renderWidth;
			columnData[index].renderOffset = totalWidth;
			totalWidth += parseWidth;
		}
		this.gridColumns.replace([...columnData]);
		this.gridContentWidth.replace(totalWidth);
	}

	/**
	 * Tests the column widths to ensure they fill the available space.
	 * If the total render width of columns is less than the available grid width,
	 * the remaining space is distributed evenly among all columns.
	 *
	 * @returns {void} This function does not return a value. It updates the render width of each column.
	 */
	public testColumnWidth() {
		const renderColumnWidth = this.gridWidth.target.value;
		const columnData = this.gridColumns.target.value;
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
		this.allocateSpace(renderColumnWidth - renderMaxWidth);
	}

	/**
	 * Distributes the available space evenly among all columns.
	 *
	 * @param size - The total available space to be distributed among the columns.
	 *
	 * @returns {void} This function does not return a value. It updates the render width of each column.
	 */
	public allocateSpace(size: number) {
		const columnData = this.gridColumns.target.value;
		const columnCount = columnData.length;
		const cellWidth = Math.floor(size / columnCount);
		columnData.forEach((col) => {
			col.renderWidth += cellWidth;
		});
		this.updateGridCellRenderInfo();
	}
}
