import { observer } from '../observer/Observer';
import type { IColumnRenderItem, IRenderInfo, IRowRenderItem, ITableColumns } from '../types/types';

export class VirtualGrid {
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

	public gridColumns = observer<Array<IColumnRenderItem>>([]);

	public gridRows = observer<Array<IRowRenderItem>>([]);

	/**
	 * grid box width
	 */
	public gridWidth = observer(0);

	public gridContentWidth = observer(0);

	/**
	 * grid box height
	 */
	public gridHeight = observer(0);

	public gridContentHeight = observer(0);

	/**
	 * window offset x position
	 */
	public offsetX = observer(0);

	/**
	 * window offset y position
	 */
	public offsetY = observer(0);

	/**
	 * view render info
	 */
	public renderInfo = observer<IRenderInfo>({
		renderColumnEnd: 0,
		renderColumnStart: 0,
		renderRowEnd: 0,
		renderRowStart: 0,
	});

	public verticalRenderFillDistance = 100;

	public horizontalRenderFillDistance = 100;

	private lastUpdateTask: ReturnType<typeof setTimeout> | undefined;

	/**
	 * update window offset position
	 * @param x
	 * @param y
	 */
	public updateWindowOffset(x: number, y: number) {
		this.offsetX.replace(x);
		this.offsetY.replace(y);
	}

	/**
	 * request compute layout by sync
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

	private computeGridCellLayoutAndRender() {
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

	private getRenderRangeIndex<T>(
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
			const isDown = (cacheLast[offset] as number) >= maxRange[0];
			// 上次渲染位置在当前之下，需要向上查找位置
			while (
				newStartIndex >= 0 &&
				(isDown
					? (list[newStartIndex][offset] as number) + (list[newStartIndex][length] as number) >=
						maxRange[0]
					: (list[newStartIndex][offset] as number) + (list[newStartIndex][length] as number) <=
						maxRange[0])
			) {
				if (isDown) {
					newStartIndex--;
				} else {
					newStartIndex++;
				}
			}
			findStart = true;
			startIndex = newStartIndex < 0 ? 0 : newStartIndex;
		}
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

	private doNumberRangesOverlap = (range1: [number, number], range2: [number, number]): boolean => {
		return (
			(range1[0] >= range2[0] && range1[0] <= range2[1]) ||
			(range1[1] >= range2[0] && range1[1] <= range2[1]) ||
			(range2[0] >= range1[0] && range2[0] <= range1[1]) ||
			(range2[1] >= range1[0] && range2[1] <= range1[1])
		);
	};

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
			});
			totalWidth += parseWidth;
		}
		this.gridColumns.replace(newColumnList);
		this.gridContentWidth.replace(totalWidth);
		this.requestLayoutUpdate();
	}

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

	public testColumnWidth() {
		const renderColumnWidth = this.gridWidth.target.value;
		const columnData = this.gridColumns.target.value;
		let renderMaxWidth = 0;
		// 判断所有的行是否大于等于能渲染的总区域
		for (let index = 0; index < columnData.length; index++) {
			renderMaxWidth += columnData[index].renderWidth;
			if (renderMaxWidth >= renderColumnWidth) {
				return;
			}
		}
		this.allocateSpace(renderColumnWidth - renderMaxWidth);
	}

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
