import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { ICellBorderInfo, IGridDescribe } from '@sapphire-table/core';
import { doRectanglesIntersect, getGridSelectionRect } from '@sapphire-table/core';

export const useGridSelection = (grid: IGridDescribe, enabled?: boolean) => {
	const bodyRef = ref<HTMLDivElement>();

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

	const handleMouseDown = (event: MouseEvent) => {
		if (event.button !== 0) {
			return;
		}
		removeAllSelected();
		const target = event.target as HTMLElement;
		const cell = getCellContent(target);
		if (cell) {
			const { row, col } = cell.dataset;
			setCellSelectionAction(Number(row), Number(col), {
				bottom: true,
				top: true,
				left: true,
				right: true,
			});
			startCell = cell;
		}
	};

	const removeAllSelected = () => {
		grid.selectCell = {};
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

	const handleMouseMove = (event: MouseEvent) => {
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
				} = setCellSelection(startX, startY, endX, endY);
				for (let rIndex = rsX; rIndex < reX; rIndex++) {
					for (let cIndex = rsY; cIndex < reY; cIndex++) {
						const cellSpan = grid.cellSpans[rIndex][cIndex];
						if (cellSpan.rowSpan > 0 && cellSpan.colSpan > 0) {
							setCellSelectionAction(rIndex, cIndex, {
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

	const setCellSelectionAction = (row: number, col: number, border: ICellBorderInfo) => {
		if (grid.selectCell[row]) {
			grid.selectCell[row][col] = border;
		} else {
			grid.selectCell[row] = {};
			grid.selectCell[row][col] = border;
		}
	};

	const setCellSelection = (startRow: number, startCol: number, endRow: number, endCol: number) => {
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
				setCellSelectionAction(cellRow, cellCol, {
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
			const { startX, startY, endX, endY } = setCellSelection(minX, minY, maxX, maxY);
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

	onMounted(() => {
		if (enabled) {
			bodyRef.value?.addEventListener('mousemove', handleMouseMove);
			bodyRef.value?.addEventListener('mouseup', handleMouseUp);
			bodyRef.value?.addEventListener('mousedown', handleMouseDown);
		}
	});

	onBeforeUnmount(() => {
		if (enabled) {
			bodyRef.value?.removeEventListener('mousemove', handleMouseMove);
			bodyRef.value?.removeEventListener('mouseup', handleMouseUp);
			bodyRef.value?.removeEventListener('mousedown', handleMouseDown);
		}
	});

	return { bodyRef };
};
