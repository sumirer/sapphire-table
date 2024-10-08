import type { ITableColumns } from '../src/types/types';
import { VirtualGrid } from '../src/table/VirtualGrid';

it('handles column resizing', () => {
	const virtualGrid = new VirtualGrid();
	const columns: ITableColumns = [
		{ colKey: '1', title: 'Column 1', width: 100 },
		{ colKey: '2', title: 'Column 2', width: 200 },
		{ colKey: '3', title: 'Column 3', width: 300 },
	];
	virtualGrid.initGridCellRenderInfo(columns);

	const newColumnWidths: number[] = [150, 250, 350];
	newColumnWidths.forEach((width, index) => {
		columns[index].width = width;
	});
	virtualGrid.initGridCellRenderInfo(columns);

	const updatedColumnData = virtualGrid.gridColumns.target.value;
	updatedColumnData.forEach((col, index) => {
		expect(col.renderWidth).toBe(newColumnWidths[index]);
	});
});

test('empty list input', () => {
	const virtualGrid = new VirtualGrid();
	const emptyList: Array<any> = [];
	const cacheStartIndex = 0;
	const maxRange: [number, number] = [0, 100];
	const options = { offset: 'offset', length: 'length' };

	const result = virtualGrid.getRenderRangeIndex(emptyList, cacheStartIndex, maxRange, options);

	expect(result.startIndex).toBe(0);
	expect(result.endIndex).toBe(0);
});

test('getRenderRangeIndex returns correct range when list has only one element', () => {
	const virtualGrid = new VirtualGrid();
	const list = [{ offset: 0, length: 100 }];
	const cacheStartIndex = 0;
	const maxRange: [number, number] = [0, 200];
	const options = { offset: 'offset', length: 'length' };

	const { startIndex, endIndex } = virtualGrid.getRenderRangeIndex<any>(
		list,
		cacheStartIndex,
		maxRange,
		options
	);

	expect(startIndex).toBe(0);
	expect(endIndex).toBe(0);
});

test('should handle list with mixed positive and negative offsets and lengths', () => {
	const virtualGrid = new VirtualGrid();

	const mockList = [
		{ offset: 0, length: 20 },
		{ offset: 20, length: 30 },
		{ offset: 50, length: 15 },
		{ offset: 65, length: 40 },
	];

	const cacheStartIndex = 1;

	const maxRange: [number, number] = [-5, 25];

	const options = { offset: 'offset', length: 'length' };

	const result = virtualGrid.getRenderRangeIndex<any>(mockList, cacheStartIndex, maxRange, options);
	expect(result).toEqual({
		startIndex: 0,
		endIndex: 2,
	});
});
