import { TableColumnFactory, ColumnBuilder } from '../src/column/TableColumnBulder';
import type { ITableColumn } from '../src/types/types';

describe('TableColumnFactory', () => {
	test('should support adding a selection column', () => {
		const columnFactory = new TableColumnFactory();

		const expectedColumns: ITableColumn[] = [
			{
				title: '',
				colKey: '',
				width: 30,
				type: 'selection',
				formatter: undefined,
				slots: undefined,
				filterParams: undefined,
				filter: undefined,
				sort: undefined,
				resize: undefined,
				fixed: 'left',
				align: 'left',
				customPadding: undefined,
				renderParams: undefined,
				minWidth: undefined,
				maxWidth: undefined,
			},
			// Add more expected columns as needed
		];

		columnFactory.addSelection();

		const builtColumns = columnFactory.build();

		expect(builtColumns).toEqual(expectedColumns);
	});

	it('Test for TableColumnFactory.addCopyWith method', () => {
		const defaultFilterSlotName = 'sapphireFilter';
		const factory = new TableColumnFactory(defaultFilterSlotName);
		const originalColumn = new ColumnBuilder('Original Column', 'original')
			.setWith(200)
			.setSort(true)
			.setAlign('center')
			.setFixed('right');

		const copiedColumn = factory.addCopyWith(originalColumn, 'Copied Column', 'copied');

		expect(copiedColumn.build()).toEqual({
			title: 'Copied Column',
			width: 200,
			colKey: 'copied',
			type: undefined,
			formatter: undefined,
			slots: undefined,
			filterParams: undefined,
			filter: undefined,
			sort: true,
			resize: undefined,
			fixed: 'right',
			align: 'center',
			customPadding: undefined,
			renderParams: undefined,
			minWidth: undefined,
			maxWidth: undefined,
		});
	});

	it('should build table columns correctly with default settings', () => {
		const columnFactory = new TableColumnFactory();

		const expectedColumns: ITableColumn[] = [
			{
				title: 'Column 1',
				colKey: 'column1',
				width: 120,
				type: undefined,
				formatter: undefined,
				slots: undefined,
				filterParams: undefined,
				filter: undefined,
				sort: undefined,
				resize: undefined,
				fixed: undefined,
				align: 'left',
				customPadding: undefined,
				renderParams: undefined,
				minWidth: undefined,
				maxWidth: undefined,
			},
			{
				title: '',
				colKey: '',
				width: 40,
				type: 'expand',
				formatter: undefined,
				slots: undefined,
				filterParams: undefined,
				filter: undefined,
				sort: undefined,
				resize: undefined,
				fixed: 'left',
				align: 'left',
				customPadding: undefined,
				renderParams: undefined,
				minWidth: undefined,
				maxWidth: undefined,
			},
			// Add more expected columns as needed
		];

		columnFactory.addColumn('Column 1', 'column1');
		columnFactory.addExpandColum();

		const builtColumns = columnFactory.build();

		expect(builtColumns).toEqual(expectedColumns);
	});

	it('TableColumnFactory chaining methods', () => {
		// Arrange
		const factory = new TableColumnFactory();

		// Act
		const column = factory
			.addColumn('Name', 'name')
			.setWith(200)
			.setSort(true)
			.setFixed('left')
			.setAlign('center')
			.setFormat('formatName')
			.setSlots('customSlot')
			.setCustomPadding('10px')
			.setFilter('input', 'default', { options: ['A', 'B', 'C'] })
			.build();

		// Assert
		expect(column).toEqual({
			title: 'Name',
			width: 200,
			colKey: 'name',
			type: undefined,
			formatter: 'formatName',
			slots: { default: 'customSlot' },
			filterParams: { customData: { options: ['A', 'B', 'C'] }, value: 'default', type: 'input' },
			filter: 'sapphireFilter',
			sort: true,
			resize: undefined,
			fixed: 'left',
			align: 'center',
			customPadding: '10px',
			renderParams: undefined,
			minWidth: undefined,
			maxWidth: undefined,
		});
	});
});
