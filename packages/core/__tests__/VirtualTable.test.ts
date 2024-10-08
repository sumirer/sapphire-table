import { VirtualTable } from '../src/table/VirtualTable';
import type { ITableColumns } from '../src/types/types';

describe('VirtualTable', () => {
	test('should handle fixed columns correctly', () => {
		const virtualTable = new VirtualTable();

		const columns: ITableColumns = [
			{ colKey: 'id', title: 'ID', fixed: 'left' },
			{ colKey: 'name', title: 'Name' },
			{ colKey: 'age', title: 'Age', fixed: 'right' },
		];

		virtualTable.updateTableColumn(columns);

		expect(virtualTable.leftFixedColumns).toEqual([{ colKey: 'id', title: 'ID', fixed: 'left' }]);
		expect(virtualTable.bodyColumns).toEqual([{ colKey: 'name', title: 'Name' }]);
		expect(virtualTable.rightFixedColumns).toEqual([
			{ colKey: 'age', title: 'Age', fixed: 'right' },
		]);
	});

	test('Should update table layout correctly', () => {
		const virtualTable = new VirtualTable();
		virtualTable.updateTableColumn([
			{ colKey: 'id', title: 'ID', fixed: 'left' },
			{ colKey: 'name', title: 'Name' },
			{ colKey: 'age', title: 'Age', fixed: 'right' },
		]);
		virtualTable.updateTableData(
			[
				{ id: 1, name: 'John', age: 25 },
				{ id: 2, name: 'Alice', age: 30 },
			],
			{ columns: [], data: [], loading: false, rowIndex: 1 },
			40
		);

		virtualTable.updateTableLayout();

		setTimeout(() => {
			expect(virtualTable.leftFixedGrid.requestLayoutUpdate).toHaveBeenCalledTimes(1);
			expect(virtualTable.bodyGrid.requestLayoutUpdate).toHaveBeenCalledTimes(1);
			expect(virtualTable.rightFixedGrid.requestLayoutUpdate).toHaveBeenCalledTimes(1);
			expect(virtualTable.bodyGrid.testColumnWidth).toHaveBeenCalledTimes(1);
		});
	});

	test('should find row data and index correctly', () => {
		const virtualTable = new VirtualTable();

		const columns: ITableColumns = [
			{ colKey: 'id', title: 'ID', fixed: 'left' },
			{ colKey: 'name', title: 'Name' },
			{ colKey: 'age', title: 'Age', fixed: 'right' },
		];
		const dataList = [
			{ id: 1, name: 'John', age: 25 },
			{ id: 2, name: 'Alice', age: 30 },
		];
		const expandData = { columns: [], data: [], loading: false, rowIndex: 1 };
		const presetHeight = 40;

		// Update table data and column configuration
		virtualTable.updateTableColumn(columns);
		virtualTable.updateTableData(dataList, expandData, presetHeight);

		const resultByIndex = virtualTable.getRenderRowIndexByIndexOrSearch(1);
		expect(resultByIndex.index).toBe(1);
		expect(resultByIndex.renderInfo?.rowData).toEqual(dataList[1]);

		const searchCallback = (data: any) => data.name === 'Alice';
		const resultBySearchCallback = virtualTable.getRenderRowIndexByIndexOrSearch(searchCallback);
		expect(resultBySearchCallback.index).toBe(1);
		expect(resultBySearchCallback.renderInfo?.rowData).toEqual(dataList[1]);

		const invalidIndex = 3;
		const resultForInvalidIndex = virtualTable.getRenderRowIndexByIndexOrSearch(invalidIndex);
		expect(resultForInvalidIndex.index).toBe(3);
		expect(resultForInvalidIndex.renderInfo).toBeUndefined();

		const invalidSearchCallback = (data: any) => data.name === 'Bob';
		const resultForInvalidSearchCallback =
			virtualTable.getRenderRowIndexByIndexOrSearch(invalidSearchCallback);
		expect(resultForInvalidSearchCallback.index).toBe(0);
		expect(resultForInvalidSearchCallback.renderInfo).toBeUndefined();
	});

	test('VirtualTable.getRenderRowIndexByIndexOrSearch handles edge cases with empty or null input values', () => {
		const virtualTable = new VirtualTable();

		// Test with empty dataList
		virtualTable.updateTableData([], { columns: [], data: [], loading: false, rowIndex: 1 }, 40);
		expect(virtualTable.getRenderRowIndexByIndexOrSearch(0)).toEqual({
			index: 0,
			renderInfo: undefined,
		});

		// Test with null dataList
		virtualTable.updateTableData(
			null as unknown as any,
			{ columns: [], data: [], loading: false, rowIndex: 1 },
			40
		);
		expect(virtualTable.getRenderRowIndexByIndexOrSearch(0)).toEqual({
			index: 0,
			renderInfo: undefined,
		});

		// Test with null search callback
		const searchCallback: any = null;
		expect(virtualTable.getRenderRowIndexByIndexOrSearch(searchCallback)).toEqual({
			index: 0,
			renderInfo: undefined,
		});

		// Test with empty search callback
		const emptySearchCallback: any = () => {};
		expect(virtualTable.getRenderRowIndexByIndexOrSearch(emptySearchCallback)).toEqual({
			index: 0,
			renderInfo: undefined,
		});
	});
});
