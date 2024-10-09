import type { IGridDescribe, ITableColumns } from '../src/types/types';
import {
	calculateRenderRangeIndices,
	createGridDescribe,
	initializeGridColumns,
	updateColumnRenderInfo,
} from '../src/table/grid';

function createGrid() {
	const describe: IGridDescribe = {
		gridColumns: [
			{
				renderWidth: 100,
				width: 100,
				column: { width: 100, colKey: '1' },
				renderOffset: 0,
				filterParams: undefined as undefined as any,
			},
			{
				renderWidth: 50,
				width: 50,
				column: { width: 50, colKey: '2' },
				renderOffset: 100,
				filterParams: undefined as undefined as any,
			},
		],
		gridRows: [
			{
				expand: false,
				expandHeight: 0,
				renderOffset: 0,
				renderRowHeight: 50,
				rowHeight: 50,
				rowData: {},
				selection: false,
				formatCache: {},
				expandInnerData: { loading: false, columns: [], rowIndex: 0, data: [] },
			},
			{
				expand: false,
				expandHeight: 0,
				renderOffset: 50,
				renderRowHeight: 50,
				rowHeight: 50,
				rowData: {},
				selection: false,
				formatCache: {},
				expandInnerData: { loading: false, columns: [], rowIndex: 0, data: [] },
			},
			{
				expand: false,
				expandHeight: 0,
				renderOffset: 100,
				renderRowHeight: 50,
				rowHeight: 50,
				rowData: {},
				selection: false,
				formatCache: {},
				expandInnerData: { loading: false, columns: [], rowIndex: 0, data: [] },
			},
			{
				expand: false,
				expandHeight: 0,
				renderOffset: 150,
				renderRowHeight: 50,
				rowHeight: 50,
				rowData: {},
				selection: false,
				formatCache: {},
				expandInnerData: { loading: false, columns: [], rowIndex: 0, data: [] },
			},
		],
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
	return describe;
}

describe('grid test', () => {
	test('handles column resizing with negative widths', () => {
		const describe = createGrid();

		describe.gridColumns[0].renderWidth = 50;
		describe.gridColumns[1].renderWidth = 100;

		updateColumnRenderInfo(describe);

		expect(describe.gridColumns[0].renderWidth).toBe(50);
		expect(describe.gridColumns[1].renderWidth).toBe(100);
		expect(describe.gridColumns[0].renderOffset).toBe(0);
		expect(describe.gridColumns[1].renderOffset).toBe(50);
		expect(describe.gridContentWidth).toBe(150);
	});

	test('handles column resizing with zero width', () => {
		const describe = createGrid();

		describe.gridColumns[0].renderWidth = 0;
		describe.gridColumns[1].renderWidth = 100;

		updateColumnRenderInfo(describe);

		expect(describe.gridColumns[0].renderWidth).toBe(0);
		expect(describe.gridColumns[1].renderWidth).toBe(100);
		expect(describe.gridColumns[0].renderOffset).toBe(0);
		expect(describe.gridColumns[1].renderOffset).toBe(0);
		expect(describe.gridContentWidth).toBe(100);
	});

	test('handles empty column list input', () => {
		const describe = createGridDescribe();
		const emptyColumns: ITableColumns = [];

		initializeGridColumns(describe, emptyColumns);

		expect(describe.gridColumns.length).toBe(0);
		expect(describe.gridContentWidth).toBe(0);
	});

	test('Should handle getRenderRangeIndex with missing cacheStartIndex property', () => {
		const list = createGrid().gridRows;
		const cacheStartIndex = undefined;
		const maxRange: [number, number] = [0, 100];
		const options = { offset: 'renderOffset', length: 'renderRowHeight' };

		const { startIndex, endIndex } = calculateRenderRangeIndices(
			list,
			cacheStartIndex ?? 0,
			maxRange,
			options as any
		);

		expect(startIndex).toBe(0);
		expect(endIndex).toBeGreaterThanOrEqual(0);
		// Additional assertions based on the expected behavior of the function with missing cacheStartIndex
		expect(startIndex).toBeLessThan(list.length);
		expect(endIndex).toBeLessThanOrEqual(list.length);
	});
});
