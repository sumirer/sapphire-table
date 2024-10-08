import type { IFilterParams, ITableColumn } from '../types/types';

/**
 * 表格列头构造器
 */
export class TableColumnFactory {
	/**
	 * 默认构造器
	 * @param defaultFilterSlotName 默认的筛选插槽名称
	 */
	constructor(private readonly defaultFilterSlotName: string = 'sapphireFilter') {}

	private columns: ColumnBuilder[] = [];

	/**
	 * Adds a new column to the table column factory.
	 *
	 * @param name - The display name of the column.
	 * @param colKey - The unique key for the column. If not provided, a default key will be used.
	 *
	 * @returns A new instance of `ColumnBuilder` for further customization of the column.
	 */
	public addColumn(name: string, colKey = ''): ColumnBuilder {
		const factory = new ColumnBuilder(name, colKey, this.defaultFilterSlotName);
		this.columns.push(factory);
		return factory;
	}

	public addLockColumn(slotName = 'dataLocked', width = 14, padding = '5px 0') {
		const factory = new ColumnBuilder('', '', this.defaultFilterSlotName);
		factory.setWith(width).setSlots(slotName).setFixed('left').setCustomPadding(padding);
		this.columns.push(factory);
	}

	public addExpandColum(width = 40) {
		const factory = new ColumnBuilder('', '', this.defaultFilterSlotName);
		factory.setWith(width).setType('expand').setFixed('left');
		this.columns.push(factory);
	}

	/**
	 * 添加状态高亮列
	 * @param name
	 * @param command 表格命令名称
	 * @param nameFieldKeyOrCallback 显示的名称名字
	 * @param gotDataKeys 构建的返回对象字段，不传的话，返回全部数据
	 */
	public addHighlightColumn(
		name: string,
		command: string,
		nameFieldKeyOrCallback: string | ((row: any) => string),
		gotDataKeys?: Array<string>
	) {
		// command通过colKey下传，区别一组数据多个插槽
		const factory = new ColumnBuilder(
			name,
			typeof nameFieldKeyOrCallback === 'string' ? nameFieldKeyOrCallback : '__' + command,
			this.defaultFilterSlotName
		);
		factory
			.setSlots('highlightClick')
			.setFormat([
				'formatHighlight',
				command,
				nameFieldKeyOrCallback,
				gotDataKeys,
			] as unknown as string[]);
		this.columns.push(factory);
		return factory;
	}

	/**
	 * Adds a new selection column to the table column factory.
	 * This column is typically used for row selection in a table.
	 *
	 * @returns A new instance of `ColumnBuilder` for further customization of the selection column.
	 */
	public addSelection() {
		const factory = new ColumnBuilder('', '', this.defaultFilterSlotName);
		factory.setType('selection').setFixed('left').setWith(30);
		this.columns.push(factory);
		return factory;
	}

	/**
	 * 添加状态列
	 * @param name
	 * @param colKey
	 * @param options
	 */
	public addStatusColumn(
		name: string,
		colKey: string,
		options: Array<{ code: string | number; name: string; type: string | any }>
	) {
		const factory = this.addColumn(name, colKey);
		factory
			.setSlots('statusDefault')
			.setWith(120)
			.setRenderParams({ options })
			.setFilter('radio', undefined, options);
		return factory;
	}

	/**
	 * 构造方法
	 * @param factoryCallback
	 */
	public factory(factoryCallback: (factory: TableColumnFactory) => void): TableColumnFactory {
		factoryCallback(this);
		return this;
	}

	/**
	 * 构造器复制
	 * @param column
	 * @param name
	 * @param colKey
	 */
	public addCopyWith(column: ColumnBuilder, name: string, colKey = ''): ColumnBuilder {
		const factory = new ColumnBuilder(name, colKey, this.defaultFilterSlotName);
		factory.copyWith(column);
		this.columns.push(factory);
		return factory;
	}

	/**
	 * 添加构建好的factory
	 * @param items
	 */
	public addFactoryItem(...items: ColumnBuilder[]) {
		this.columns.push(...items);
	}

	/**
	 * 构造表格列信息
	 */
	public build(): ITableColumn[] {
		return this.columns.map((item) => item.build());
	}
}

export class ColumnBuilder {
	/**
	 * Represents a column builder for constructing table columns.
	 *
	 * @param name - The display name of the column.
	 * @param colKey - The unique key for the column. If not provided, a default key will be used.
	 * @param filterSlotName - The default filter slot name. Defaults to 'sapphireFilter'.
	 */
	public constructor(
		public name: string,
		public colKey: string,
		public filterSlotName: ITableColumn['filter'] = 'sapphireFilter'
	) {}

	private width = 120;

	private resize: ITableColumn['resize'] = undefined;

	private fixed: ITableColumn['fixed'] = undefined;

	private align: ITableColumn['align'] = 'left';

	private sort: ITableColumn['sort'] = undefined;

	private filterParams: ITableColumn['filterParams'] = undefined;

	private slots: ITableColumn['slots'] = undefined;

	private type: ITableColumn['type'] = undefined;

	private formatter: ITableColumn['formatter'] = undefined;

	private filterName: ITableColumn['filter'] = undefined;

	private customPadding: ITableColumn['customPadding'] = undefined;

	private renderParams: ITableColumn['renderParams'] = undefined;

	private minWidth: ITableColumn['minWidth'] = undefined;

	private maxWidth: ITableColumn['maxWidth'] = undefined;

	public setWith(width: number): ColumnBuilder {
		this.width = width;
		return this;
	}

	public setResize(resize: boolean): ColumnBuilder {
		this.resize = resize;
		return this;
	}

	public setSort(sort: boolean): ColumnBuilder {
		this.sort = sort;
		return this;
	}

	public setType(type: ITableColumn['type']): ColumnBuilder {
		this.type = type;
		return this;
	}

	public setAlign(align: ITableColumn['align']): ColumnBuilder {
		this.align = align;
		return this;
	}

	public setFormat(format: string | (string | number)[]): ColumnBuilder {
		this.formatter = format as unknown as ITableColumn['formatter'];
		return this;
	}

	public setFixed(fixed: ITableColumn['fixed']): ColumnBuilder {
		this.fixed = fixed;
		return this;
	}

	/**
	 * 设置插槽名称
	 * @param slotName 填入预设插槽或者自定义插槽
	 * @param type
	 */
	public setSlots(slotName: string, type: 'default' | 'header' = 'default') {
		if (!this.slots) {
			this.slots = { [type]: slotName } as any;
		} else {
			this.slots[type] = slotName;
		}
		return this;
	}

	public setCustomPadding(padding: string): ColumnBuilder {
		this.customPadding = padding;
		return this;
	}

	/**
	 * 设置筛选参数
	 * @param type
	 * @param customData 附加参数
	 * @param defaultValue 默认值
	 */
	public setFilter(
		type: string,
		defaultValue?: any,
		customData?: IFilterParams['customData']
	): ColumnBuilder {
		this.filterName = this.filterSlotName;
		this.filterParams = { customData, value: defaultValue, type };
		return this;
	}

	public removeFilter(): ColumnBuilder {
		this.filterName = undefined;
		this.filterParams = undefined;
		return this;
	}

	public setRenderParams(params: any) {
		this.renderParams = params;
		return this;
	}

	public setMaxWidth(width: number) {
		this.maxWidth = width;
	}

	public setMinWidth(width: number) {
		this.minWidth = width;
	}

	/**
	 * 从另外一个对象进行复制,不会复制 name 和 colKey
	 * @param target
	 */
	public copyWith(target: ColumnBuilder): ColumnBuilder {
		this.width = target.width;
		this.sort = target.sort;
		this.slots = target.slots;
		this.formatter = target.formatter;
		this.align = target.align;
		this.type = target.type;
		this.filterName = target.filterName;
		this.fixed = target.fixed;
		this.resize = target.resize;
		this.filterSlotName = target.filterSlotName;
		this.renderParams = target.renderParams;
		this.minWidth = target.minWidth;
		this.maxWidth = target.maxWidth;
		return this;
	}

	/**
	 * 构造列头
	 */
	public build(): ITableColumn {
		return {
			title: this.name,
			width: this.width,
			colKey: this.colKey,
			type: this.type,
			formatter: this.formatter,
			slots: this.slots,
			filterParams: this.filterParams,
			filter: this.filterName,
			sort: this.sort,
			resize: this.resize,
			fixed: this.fixed,
			align: this.align,
			customPadding: this.customPadding,
			renderParams: this.renderParams,
			minWidth: this.minWidth,
			maxWidth: this.maxWidth,
		};
	}
}
