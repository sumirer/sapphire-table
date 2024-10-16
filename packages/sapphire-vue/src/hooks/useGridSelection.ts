import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { ICellBorderInfo, IGridDescribe } from '@sapphire-table/core';
import { doRectanglesIntersect, getGridSelectionRect } from '@sapphire-table/core';
import type { VirtualTableType } from './useVirtualTable';

export const useGridSelection = (tableDescribe: VirtualTableType, enabled?: boolean) => {
	const bodyRef = ref<HTMLDivElement>();

	const leftRef = ref<HTMLDivElement>();

	const rightRef = ref<HTMLDivElement>();

	let startCell: HTMLElement | undefined = undefined;

	let endCell: HTMLElement | undefined = undefined;

	let lastCell: HTMLElement | undefined = undefined;

	const isCellElement = (element: HTMLElement) => {
		return element.role === 'cell' && element.classList.contains('sapphire-table__table-cell');
	};

	const getCellContent = (element: HTMLElement) => {
		let target = element;
		while (target) {
			if (!isCellElement(target) && target.tagName !== 'BODY') {
				target = target.parentElement as HTMLElement;
			} else {
				break;
			}
		}
		return target && isCellElement(target) ? target : null;
	};

	const handleMouseDown = (event: MouseEvent, grid: IGridDescribe) => {
		if (event.button !== 0) {
			return;
		}
		removeAllSelected();
		const target = event.target as HTMLElement;
		const cell = getCellContent(target);
		if (cell) {
			const { row, col } = cell.dataset;
			setCellSelectionAction(grid, Number(row), Number(col), {
				bottom: true,
				top: true,
				left: true,
				right: true,
			});
			startCell = cell;
		}
	};

	const removeAllSelected = () => {
		tableDescribe.leftGrid.value.selectCell = {};
		tableDescribe.bodyGrid.value.selectCell = {};
		tableDescribe.rightGrid.value.selectCell = {};
	};

	const getCellFromMouseEvent = (event: MouseEvent) => {
		const { row, col } = (event.target as HTMLElement).dataset;
		if (row && col) {
			return bodyRef.value?.querySelector(`div[data-row="${row}"][data-col="${col}"]`);
		}
		return null;
	};

	const getCellInfo = (target: HTMLElement) => {
		const cellRow = parseInt(target.dataset.row as string, 10);
		const cellCol = parseInt(target.dataset.col as string, 10);
		const rowSpan = parseInt(target.getAttribute('rowspan') as string, 10) || 1;
		const colSpan = parseInt(target.getAttribute('colspan') as string, 10) || 1;
		return {
			cellRow,
			cellCol,
			rowSpan,
			colSpan,
		};
	};

	const handleMouseMove = (event: MouseEvent, grid: IGridDescribe) => {
		if (startCell) {
			const currentCell = getCellFromMouseEvent(event);
			if (currentCell) {
				endCell = currentCell as HTMLTableCellElement;
				if (lastCell === endCell) {
					return;
				}
				lastCell = endCell;
				removeAllSelected();
				const { startX, startY, endX, endY } = getGridSelectionRect(
					getCellInfo(startCell),
					getCellInfo(endCell)
				);
				const {
					startX: rsX,
					startY: rsY,
					endX: reX,
					endY: reY,
				} = setCellSelection(grid, startX, startY, endX, endY);
				for (let rIndex = rsX; rIndex < reX; rIndex++) {
					for (let cIndex = rsY; cIndex < reY; cIndex++) {
						const cellSpan = grid.cellSpans[rIndex][cIndex];
						if (cellSpan.rowSpan > 0 && cellSpan.colSpan > 0) {
							setCellSelectionAction(grid, rIndex, cIndex, {
								bottom: rIndex + cellSpan.rowSpan === reX,
								top: rIndex === rsX,
								left: cIndex === rsY,
								right: cIndex + cellSpan.colSpan === reY,
							});
						}
					}
				}
			}
		}
	};

	const setCellSelectionAction = (
		grid: IGridDescribe,
		row: number,
		col: number,
		border: ICellBorderInfo
	) => {
		if (grid.selectCell[row]) {
			grid.selectCell[row][col] = border;
		} else {
			grid.selectCell[row] = {};
			grid.selectCell[row][col] = border;
		}
	};

	const setCellSelection = (
		grid: IGridDescribe,
		startRow: number,
		startCol: number,
		endRow: number,
		endCol: number
	) => {
		const allCells = [
			...(bodyRef.value?.querySelectorAll('div[data-row][data-col]') || []),
		] as unknown as HTMLTableCellElement[];
		// 遍历所有单元格，检查它们是否在所需的范围内，并添加 'selected' 类
		const result = allCells.map((cell) => {
			const { cellRow, cellCol, colSpan, rowSpan } = getCellInfo(cell);
			if (
				doRectanglesIntersect(
					{
						x: startRow,
						y: startCol,
						width: endRow - startRow,
						height: endCol - startCol,
					},
					{
						x: cellRow,
						y: cellCol,
						height: colSpan,
						width: rowSpan,
					}
				)
			) {
				setCellSelectionAction(grid, cellRow, cellCol, {
					bottom: cellRow === endRow,
					top: cellRow === startRow,
					left: cellCol === startCol,
					right: cellCol === endCol,
				});
				return {
					cellRow,
					cellCol,
					colSpan,
					rowSpan,
					gX: cellRow + rowSpan,
					gY: cellCol + colSpan,
				};
			}
		});
		let minX = startRow;
		let minY = startCol;
		let maxX = endRow;
		let maxY = endCol;
		result.forEach((item) => {
			if (item) {
				if (item.gX > maxX) {
					maxX = item.gX;
				}
				if (item.cellRow < minX) {
					minX = item.cellRow;
				}
				if (item.gY > maxY) {
					maxY = item.gY;
				}
				if (item.cellCol < minY) {
					minY = item.cellCol;
				}
			}
		});
		if (maxX !== endRow || maxY !== endCol || minX !== startRow || minY !== startCol) {
			// 递归获取附属的单元格，计算范围内被合并的范围，合并范围内所有的单元格
			const { startX, startY, endX, endY } = setCellSelection(grid, minX, minY, maxX, maxY);
			minX = startX;
			minY = startY;
			maxX = endX;
			maxY = endY;
		}
		return {
			startX: minX,
			startY: minY,
			endX: maxX,
			endY: maxY,
		};
	};

	const handleMouseUp = () => {
		if (startCell && endCell && startCell !== endCell) {
			// showContextMenuCurrentRef.value = bodyRef.value?.querySelector(
			// 	`div[data-row="${selectRange.startRow}"][data-col="${selectRange.startCol}"]`
			// ) as unknown as HTMLDivElement;
			// mergeCell();
			// removeAllSelected();
		}
		startCell = undefined;
		endCell = undefined;
	};

	const bindElementEvents = (
		target: HTMLDivElement | undefined,
		eventBinds: Record<string, (event: Event) => void>
	) => {
		Object.keys(eventBinds).forEach((key) => {
			target?.addEventListener(key, eventBinds[key]);
		});
	};

	const unbindElementEvents = (
		target: HTMLDivElement | undefined,
		eventBinds: Record<string, (event: Event) => void>
	) => {
		Object.keys(eventBinds).forEach((key) => {
			target?.removeEventListener(key, eventBinds[key]);
		});
	};

	const bodyEvents: Record<string, (event: Event) => void> = {
		mousemove: (event) => handleMouseMove(event as MouseEvent, tableDescribe.bodyGrid.value),
		mouseup: handleMouseUp,
		mousedown: (event) => handleMouseDown(event as MouseEvent, tableDescribe.bodyGrid.value),
	};

	const leftEvents: Record<string, (event: Event) => void> = {
		mousemove: (event) => handleMouseMove(event as MouseEvent, tableDescribe.leftGrid.value),
		mouseup: handleMouseUp,
		mousedown: (event) => handleMouseDown(event as MouseEvent, tableDescribe.leftGrid.value),
	};

	const rightEvents: Record<string, (event: Event) => void> = {
		mousemove: (event) => handleMouseMove(event as MouseEvent, tableDescribe.rightGrid.value),
		mouseup: handleMouseUp,
		mousedown: (event) => handleMouseDown(event as MouseEvent, tableDescribe.rightGrid.value),
	};

	onMounted(() => {
		if (enabled) {
			bindElementEvents(bodyRef.value, bodyEvents);
			bindElementEvents(leftRef.value, leftEvents);
			bindElementEvents(rightRef.value, rightEvents);
		}
	});

	onBeforeUnmount(() => {
		if (enabled) {
			unbindElementEvents(bodyRef.value, bodyEvents);
			unbindElementEvents(leftRef.value, leftEvents);
			unbindElementEvents(rightRef.value, rightEvents);
		}
	});

	return { bodyRef, rightRef, leftRef };
};

export type GridSelectionType = ReturnType<typeof useGridSelection>;
