import type { ITableColumn, ITableColumns, ITableDescribe } from '../src/types/types';
import { createTableDescribe, updateTableColumnsConfig } from '../src/table/table';

const mockTableDescribe: ITableDescribe = {
	leftGrid: {
		gridColumns: [],
	},
	bodyGrid: {
		gridColumns: [],
	},
	rightGrid: {
		gridColumns: [],
	},
	leftColumns: [],
	bodyColumns: [],
	rightColumns: [],
	// Add any other necessary properties or methods
} as any;

describe('updateTableColumnsConfig', () => {
	it('should handle null input columns', () => {
		const columns = null as any;
		updateTableColumnsConfig(mockTableDescribe, columns);
	});

	it('should handle undefined input columns', () => {
		const columns = undefined as any;

		updateTableColumnsConfig(mockTableDescribe, columns);
	});

	test('should handle empty array input columns', () => {
		const describe = createTableDescribe();

		const columns: Array<ITableColumn> = [];

		updateTableColumnsConfig(describe, columns);

		// Assertions to validate the updated table description object
		expect(describe.leftColumns.length).toBe(0);
		expect(describe.bodyColumns.length).toBe(0);
		expect(describe.rightColumns.length).toBe(0);
		expect(describe.leftGrid.gridColumns.length).toBe(0);
		expect(describe.bodyGrid.gridColumns.length).toBe(0);
		expect(describe.rightGrid.gridColumns.length).toBe(0);
	});
});
