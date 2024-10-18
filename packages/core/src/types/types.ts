export interface ITableColumn {
	/**
	 * 列标题
	 */
	title?: string;
	/**
	 * 列宽度
	 */
	width?: number;
	/**
	 * 数据索引键值
	 */
	colKey: string;
	/**
	 * 是否启用拖拽改变大小
	 */
	resize?: boolean;

	/**
	 * 最小宽度，默认最小值为20，仅在resize为true时使用
	 */
	minWidth?: number;

	/**
	 * 最大宽度
	 */
	maxWidth?: number;
	/**
	 * 是否固定在两侧，设置其固定位置
	 */
	fixed?: 'left' | 'right';
	/**
	 * 多级子表头定义
	 */
	children?: Array<ITableColumn>;
	/**
	 * 表头文字对齐方式
	 */
	align?: 'left' | 'center' | 'right';
	/**
	 * 是否开启排序
	 */
	sort?: boolean;
	/**
	 * 对应的排序自定义值，默认为 `[asc,desc]`
	 */
	sortValue?: [string, string];
	/**
	 * 自定义筛选插槽名称，筛选框会从表头处弹出
	 */
	filter?: string;

	/**
	 * filter params
	 */
	filterParams?: IFilterParams;

	/**
	 * custom render slots
	 * [default] is cell slot, [header] is custom table header slot
	 */
	slots?: { default?: string; header?: string };

	/**
	 * 列类型
	 */
	type?: 'expand' | 'selection' | 'radio';

	/**
	 * 格式化工具，使用函数对数据进行处理
	 */
	formatter?: Array<string> | string;

	/**
	 * 自定义当前单元格的padding值
	 */
	customPadding?: string;

	/**
	 * 渲染的时候添加的额外参数
	 */
	renderParams?: any;
}

export type ITableColumns = Array<ITableColumn>;

export interface IColumnRenderItem {
	/**
	 * 设定宽度
	 */
	width: number;
	/**
	 * 实际渲染宽度
	 */
	renderWidth: number;
	column: ITableColumn;
	/**
	 * 渲染偏移量
	 */
	renderOffset: number;

	/**
	 * filter params
	 */
	filterParams: IFilterParams;

	deepLength: number;

	children?: Array<IColumnRenderItem>;

	parent: number[];
}

export interface IRenderInfo {
	renderRowStart: number;
	renderRowEnd: number;
	renderColumnStart: number;
	renderColumnEnd: number;
}

/**
 * Represents a row item for rendering in a table.
 *
 * @template D - The type of the row data.
 */
export interface IRowRenderItem<D = any> {
	/**
	 * The row data.
	 */
	rowData: D;

	/**
	 * The height of the row when it is expanded.
	 */
	expandHeight: number;

	/**
	 * The vertical offset of the row from the top of the table.
	 */
	renderOffset: number;

	/**
	 * The height of the row when it is not expanded.
	 */
	rowHeight: number;

	/**
	 * The height of the row when it is rendered.
	 */
	renderRowHeight: number;

	/**
	 * A cache for storing the results of function calculations, such as formatters.
	 * This can help improve performance by avoiding redundant calculations.
	 */
	formatCache: D;

	/**
	 * Indicates whether the row is selected.
	 */
	selection: boolean;

	/**
	 * Indicates whether the row is expanded.
	 */
	expand: boolean;

	/**
	 * Additional data for the expanded content.
	 */
	expandInnerData: IExpandParams;

	/**
	 * A unique key for the expanded content.
	 */
	expandRenderKey?: string;
}

export interface ICellFormatter<T> {
	column: ITableColumn;
	columnRenderItem: IColumnRenderItem;
	rowData: T;
	rowRenderItem: IRowRenderItem<T>;
	rowIndex: number;
	columnIndex: number;
	cellValue: any;
}

export type ITableFormats<T = any> = Record<
	string,
	(raw: ICellFormatter<T>, ...params: any[]) => string
>;

export interface IFilterData {
	animationClose: boolean;
	visible: boolean;
	offset: number;
	left: string | number;
	fixOffset: string | number;
	top: string;
	field: string;
	slotName: string;
	value: any;
	colWidth: number;
	bodyWidth: number;
	column: ITableColumn;
	type: string;
	filterInnerParams: Record<string, any>;
}

export interface ILoadDataRequestParams {
	sort: ISortParams;
	filter: IFilterParams[];
}

/**
 * Represents the configuration for a table, including data loading and expansion settings.
 *
 * @template ExpandData - The type of the expand data, defaulted to `IExpandParams<ExpandSource>`.
 * @template Source - The type of the source data, defaulted to `any`.
 * @template ExpandSource - The type of the expand source data, defaulted to `any`.
 */
export interface ITableConfig<
	ExpandData extends IExpandParams<ExpandSource> = any,
	Source = any,
	ExpandSource = any,
> {
	/**
	 * A method for loading data into the table. It takes an `ILoadDataRequestParams` object as a parameter
	 * and returns a Promise that resolves to an array of `Source` objects.
	 */
	dataLoadMethod: (params: ILoadDataRequestParams) => Promise<Source[]>;

	/**
	 * An optional configuration for expanding rows in the table. It is of type `ITableExpandConfig<ExpandData, ExpandSource>`.
	 */
	expandConfig?: ITableExpandConfig<ExpandData, ExpandSource>;
}

export interface IExpandParams<Data = any> {
	loading: boolean;
	data: Data[];
	columns: ITableColumn[] | ITableColumns;
	rowIndex?: number;
}

/**
 * Represents the configuration for a table, including data loading and expansion settings.
 *
 * @template ExpandData - The type of the expand data, defaulted to `IExpandParams<ExpandSource>`.
 * @template Source - The type of the source data, defaulted to `any`.
 * @template ExpandSource - The type of the expand source data, defaulted to `any`.
 */
export interface ITableConfig<
	ExpandData extends IExpandParams<ExpandSource> = any,
	Source = any,
	ExpandSource = any,
> {
	/**
	 * A method for loading data into the table. It takes an `ILoadDataRequestParams` object as a parameter
	 * and returns a Promise that resolves to an array of `Source` objects.
	 */
	dataLoadMethod: (params: ILoadDataRequestParams) => Promise<Source[]>;

	/**
	 * An optional configuration for expanding rows in the table. It is of type `ITableExpandConfig<ExpandData, ExpandSource>`.
	 */
	expandConfig?: ITableExpandConfig<ExpandData, ExpandSource>;
}

/**
 * Represents the configuration for expanding rows in a table.
 *
 * @template ExpandData - The type of the expand data, defaulted to `IExpandParams<ExpandSource>`.
 * @template ExpandSource - The type of the expand source data, defaulted to `any`.
 */
export interface ITableExpandConfig<
	ExpandData extends IExpandParams<ExpandSource> = any,
	ExpandSource = any,
> {
	/**
	 * A method for loading data into the expanded rows. It takes an `ExpandData` object and an `ILoadDataRequestParams` object as parameters
	 * and returns a Promise that resolves to `void` or `undefined`.
	 *
	 * @param params - An object containing the expand data and the table's load data request parameters.
	 * @param rowIndex - The index of the row for which the expand data is being loaded.
	 *
	 * @returns A Promise that resolves to `void` or `undefined`.
	 */
	dataLoadMethod: (
		params: ExpandData & {
			rowData: IRowRenderItem;
		},
		tableParams: ILoadDataRequestParams
	) => Promise<void> | void;

	/**
	 * The default expand data to be used when expanding rows.
	 */
	expandDefaultParams: ExpandData;
}

/**
 * Represents an instance of a table, providing methods for interacting with the table.
 *
 * @template Source - The type of the source data, defaulted to `any`.
 */
export interface ITableInstance<Source = any> {
	/**
	 * Reloads the table data, which can only be used when the `config` loading item is configured.
	 * @see ITableConfig
	 */
	loadData: () => Promise<void> | void;

	/**
	 * Reloads the expanded data for a specific row.
	 * @param rowIndex - The index of the row for which the expanded data is being reloaded.
	 */
	reloadRowExpand: (rowIndex: number) => void;

	/**
	 * Expands a row in the table.
	 * @param indexOrSearchCallback - The index of the row or a callback function to search for the row data.
	 */
	setRowExpand: (indexOrSearchCallback: number | ((data: Source) => boolean)) => void;

	/**
	 * Retrieves the selected row data.
	 * @returns An array of selected row data.
	 */
	getSelectionData: () => Source[];

	/**
	 * Clears the selected items in the table.
	 */
	clearSelection: () => void;

	/**
	 * Sets the default selected items in the table.
	 * @param selectData - The array of selected row data.
	 * @param key - The key used to identify the selected items.
	 */
	setDefaultSelection: (selectData: Source[], key: string) => void;

	/**
	 * Sets the selection status of a specific row in the table.
	 * @param rowIndex - The index of the row.
	 * @param action - The action to perform on the selection status (true for selecting, false for deselecting).
	 */
	setRowSelection: (rowIndex: number, action: boolean) => void;

	/**
	 * Scrolls the table to the specified row and makes it visible in the viewport.
	 * @param indexOrSearchCallback - The index of the row or a callback function to search for the row data.
	 */
	scrollToRow: (indexOrSearchCallback: number | ((data: Source) => boolean)) => void;

	/**
	 * The filter control instance.
	 */
	filterInstance: IFilterInstance;
}

/**
 * Represents an instance for managing and interacting with table filters.
 * This interface provides methods for resetting, closing, clearing, confirming, and updating filter options.
 */
export interface IFilterInstance {
	/**
	 * Resets the specified filter option.
	 * @param colKey - The key of the column for which the filter option is being reset.
	 */
	resetFilter: (colKey: string) => void;

	/**
	 * Closes the filter dialog.
	 */
	closeFilterDialog: () => void;

	/**
	 * Clears all filter data.
	 */
	clearAllFilter: () => void;

	/**
	 * Confirms the filter, triggering the filter event.
	 */
	confirmFilter: () => void;

	/**
	 * Updates the filter data for the specified column.
	 * @param colKey - The key of the column for which the filter data is being updated.
	 * @param filterValue - The new value for the filter.
	 */
	updateFilter: (colKey: string, filterValue: any) => void;
}

/**
 * An interface representing an instance for managing and interacting with table expansions.
 *
 * @remarks
 * This interface provides methods for reloading expanded data.
 */
export interface IExpandInstance {
	/**
	 * Reloads the expanded data.
	 *
	 * @returns A Promise that resolves to `void` or `undefined` when the data is successfully reloaded.
	 */
	reloadData: () => Promise<void> | void;
}

/**
 * Represents parameters used for filtering data in a table.
 *
 * @remarks
 * This interface is used to store and manage filter parameters, such as the filter value, type,
 * custom data, and optional property.
 */
export interface IFilterParams {
	/**
	 * The value used for filtering.
	 */
	value: any;

	/**
	 * The type of filter being applied.
	 */
	type: string;

	/**
	 * Custom data associated with the filter.
	 */
	customData: any;

	/**
	 * The property or field name being filtered.
	 *
	 * @remarks
	 * This property is optional and may not be present in all filter parameter objects.
	 */
	property?: string;
}

export interface ISortParams {
	property: string;
	type: string;
}

/**
 * Represents the description of a grid used for rendering rows and columns.
 *
 * @remarks
 * This interface is used to store and manage the necessary information for rendering a grid,
 * such as column and row data, grid dimensions, scroll offsets, render information, and fill distances.
 */
export interface IGridDescribe {
	/**
	 * An array of column render items.
	 */
	gridColumns: IColumnRenderItem[];

	gridHeaderColumns: IColumnRenderItem[];
	/**
	 * An array of row render items.
	 */
	gridRows: IRowRenderItem[];

	/**
	 * The width of the grid.
	 */
	gridWidth: number;

	/**
	 * The content width of the grid.
	 */
	gridContentWidth: number;

	/**
	 * The height of the grid.
	 */
	gridHeight: number;

	/**
	 * The content height of the grid.
	 */
	gridContentHeight: number;

	/**
	 * The horizontal scroll offset.
	 */
	offsetX: number;

	/**
	 * The vertical scroll offset.
	 */
	offsetY: number;

	/**
	 * The render information for the grid.
	 */
	renderInfo: IRenderInfo;

	headerRenderInfo: Pick<IRenderInfo, 'renderColumnStart' | 'renderColumnEnd'>;

	/**
	 * The vertical render fill distance.
	 */
	verticalRenderFillDistance: number;

	/**
	 * The horizontal render fill distance.
	 */
	horizontalRenderFillDistance: number;

	/**
	 * The last update task, represented as a timeout ID.
	 */
	lastUpdateTask: ReturnType<typeof setTimeout> | undefined;

	/**
	 * A record representing the selected cells in the grid.
	 * The keys are row indices, and the values are records representing the selected cells in each row.
	 */
	selectCell: Record<number, Record<number, ICellBorderInfo>>;

	/**
	 * A record representing the cell spans in the grid.
	 * The keys are row indices, and the values are records representing the cell spans in each row.
	 */
	cellSpans: Record<number, Record<number, IGridCellSpan>>;

	maxColumnDeepLength: number;
}

export interface ICellBorderInfo {
	top: boolean;
	left: boolean;
	right: boolean;
	bottom: boolean;
}

export interface IScrollOffset {
	x: number;
	y: number;
}

export interface ISize {
	width: number;
	height: number;
}

/**
 * Describes the table's state and layout, including dimensions, scroll offsets, column and row data,
 * and other relevant information.
 *
 * @remarks
 * This interface is used to manage and represent the state of the table, such as its dimensions,
 * scroll positions, column and row render items, and other necessary information for rendering and
 * interacting with the table.
 */
export interface ITableDescribe {
	/**
	 * The total width of the table.
	 */
	tableWidth: number;

	/**
	 * The content width of the table.
	 */
	tableContentWidth: number;

	/**
	 * The total height of the table.
	 */
	tableHeight: number;

	/**
	 * The content height of the table.
	 */
	tableContentHeight: number;

	/**
	 * The height of the table header.
	 */
	headerHeight: number;

	/**
	 * The width of the fixed columns on the left side.
	 */
	leftFixedWidth: number;

	/**
	 * The width of the fixed columns on the right side.
	 */
	rightFixedWidth: number;

	/**
	 * The width of the body section of the table.
	 */
	bodyWidth: number;

	/**
	 * The height of the body section of the table.
	 */
	bodyHeight: number;

	/**
	 * The column render items for the left fixed columns.
	 */
	leftColumns: IColumnRenderItem[];

	/**
	 * The column render items for the body columns.
	 */
	bodyColumns: IColumnRenderItem[];

	/**
	 * The column render items for the right fixed columns.
	 */
	rightColumns: IColumnRenderItem[];

	/**
	 * The row render items for the table.
	 */
	tableRowData: IRowRenderItem[];

	/**
	 * The column render items for the tools columns.
	 */
	toolsColumns: IColumnRenderItem[];

	/**
	 * The width of the table toolbar.
	 */
	toolBarWidth: number;

	/**
	 * The width of the scroll bar.
	 */
	scrollBarWidth: number;

	/**
	 * Indicates whether the left side of the table is in a "ping" state.
	 */
	pingLeft: boolean;

	/**
	 * Indicates whether the right side of the table is in a "ping" state.
	 */
	pingRight: boolean;

	/**
	 * The global formatter for cell values.
	 */
	globalFormatter: ITableFormats;

	/**
	 * The index of the row currently being hovered over.
	 */
	hoverIndex: number;

	/**
	 * The key used to trigger a render update.
	 */
	renderUpdateKey: string;

	/**
	 * The current sorting information.
	 */
	sortInfo: ISortParams;

	/**
	 * The cache of filter parameters.
	 */
	filterParamsCache: IFilterParams[];

	/**
	 * The number of selected rows.
	 */
	selectCount: number;

	/**
	 * The total height of all rows in the table.
	 */
	rowTotalHeight: number;

	/**
	 * The grid description for the body section.
	 */
	bodyGrid: IGridDescribe;

	/**
	 * The grid description for the left fixed columns.
	 */
	leftGrid: IGridDescribe;

	/**
	 * The grid description for the right fixed columns.
	 */
	rightGrid: IGridDescribe;

	/**
	 * The current scroll offset.
	 */
	offset: IScrollOffset;

	/**
	 * Indicates whether the table is in a "half" state.
	 */
	isHalf: boolean;

	/**
	 * Indicates whether all rows are selected.
	 */
	selectAll: boolean;

	/**
	 * The table header columns deep level
	 */
	tableHeaderDeepLevel: number;
}

/**
 * Represents a rectangle with x, y, width, and height properties.
 */
export type Rectangle = {
	/**
	 * The x-coordinate of the top-left corner of the rectangle.
	 */
	x: number;

	/**
	 * The y-coordinate of the top-left corner of the rectangle.
	 */
	y: number;

	/**
	 * The width of the rectangle.
	 */
	width: number;

	/**
	 * The height of the rectangle.
	 */
	height: number;
};

/**
 * Represents information about a cell in a table, including its row and column indices,
 * as well as its rowspan and colspan.
 */
export type CellInfo = {
	/**
	 * The index of the row that contains the cell.
	 */
	cellRow: number;

	/**
	 * The index of the column that contains the cell.
	 */
	cellCol: number;

	/**
	 * The number of rows that the cell spans.
	 */
	rowSpan: number;

	/**
	 * The number of columns that the cell spans.
	 */
	colSpan: number;
};

/**
 * Represents the rowspan and colspan of a cell in a grid.
 */
export interface IGridCellSpan {
	/**
	 * The number of rows that the cell spans.
	 */
	rowSpan: number;

	/**
	 * The number of columns that the cell spans.
	 */
	colSpan: number;
}

/**
 * A callback function used to determine the rowspan and colspan of a cell in the table.
 *
 * @remarks
 * This function is used to handle scenarios where a cell spans multiple rows or columns.
 * It takes the row and column render items, along with their respective indices, as parameters.
 * The function should return an object containing the rowspan and colspan values for the cell.
 * If the cell does not span any rows or columns, the function should return `undefined`.
 *
 * @param row - The row render item for the cell.
 * @param column - The column render item for the cell.
 * @param rowIndex - The index of the row in the table.
 * @param columnIndex - The index of the column in the table.
 *
 * @returns An object containing the rowspan and colspan values for the cell, or `undefined` if the cell does not span any rows or columns.
 */
export type ICellRenderCallback = (
	row: IRowRenderItem,
	column: IColumnRenderItem,
	rowIndex: number,
	columnIndex: number
) => { rowSpan: number; colSpan: number } | undefined;

export type CellPositionData = 'left' | 'body' | 'right' | null | undefined;

export interface IMenuCurrentCell {
	rowIndex: number;
	columnIndex: number;
	position: CellPositionData;
}

export interface IMenuParams {
	tableInstance: ITableInstance;
	current?: IMenuCurrentCell;
	rowData?: IRowRenderItem;
	columnData?: IColumnRenderItem;
	selection?: Array<Pick<CellInfo, 'cellRow' | 'cellCol'>> | null;
}

export type IMenuVisible = (
	params: Omit<IMenuParams, 'tableInstance'>
) => boolean | undefined | null | number;

export interface IMenuContentBlock {
	title: string;
	description?: string;
	icon?: string;
	key: string;
	isGroup?: boolean;
	visible?: IMenuVisible | boolean;
	children?: IMenuContentBlock[];
	onMenuClick?: (params: IMenuParams) => void;
}

export interface ITableMenuGroup {
	header?: IMenuContentBlock[];
	cell?: IMenuContentBlock[];
	footer?: IMenuContentBlock[];
}
