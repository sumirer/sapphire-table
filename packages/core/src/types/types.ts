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
}

export interface IRenderInfo {
	renderRowStart: number;
	renderRowEnd: number;
	renderColumnStart: number;
	renderColumnEnd: number;
}

export interface IRowRenderItem<D = any> {
	/**
	 * 行数据
	 */
	rowData: D;
	/**
	 * 展开高度
	 */
	expandHeight: number;
	/**
	 * 渲染偏移量
	 */
	renderOffset: number;
	/**
	 * 行高度
	 */
	rowHeight: number;
	/**
	 * 渲染高度
	 */
	renderRowHeight: number;
	/**
	 * 渲染内容计算缓存，针对函数计算的结果，可以设置不启用该缓存，
	 * 否在列表在第一次渲染的时候使用的是函数返回值，即format,会进行结果缓存，进行结果重用
	 */
	formatCache: D;
	/**
	 * 是否选中
	 */
	selection: boolean;
	/**
	 * 是否展开
	 */
	expand: boolean;
	/**
	 * 展开内容的参数存放
	 */
	expandInnerData: IExpandParams;

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

export interface ITableConfig<
	ExpandData extends IExpandParams<ExpandSource> = any,
	Source = any,
	ExpandSource = any,
> {
	/**
	 * 表格加载数据
	 */
	dataLoadMethod: (params: ILoadDataRequestParams) => Promise<Source[]>;
	/**
	 * 表格展开配置
	 */
	expandConfig?: ITableExpandConfig<ExpandData, ExpandSource>;
}

export interface IExpandParams<Data = any> {
	loading: boolean;
	data: Data[];
	columns: ITableColumn[] | ITableColumns;
	rowIndex?: number;
}

export interface ITableExpandConfig<
	ExpandData extends IExpandParams<ExpandSource> = any,
	ExpandSource = any,
> {
	/**
	 * 加载数据方法
	 * @param params
	 * @param rowIndex
	 */
	dataLoadMethod: (
		params: ExpandData & {
			rowData: IRowRenderItem;
		},
		tableParams: ILoadDataRequestParams
	) => Promise<void> | void;
	/**
	 * 展开默认数据
	 */
	expandDefaultParams: ExpandData;
}

export interface ITableInstance<Source = any> {
	/**
	 * 重新加载表格数据，在配置了config加载项的时候才能进行使用
	 * @see ITableConfig
	 */
	loadData: () => Promise<void> | void;
	/**
	 * 重新加载展开数据
	 * @param rowIndex
	 */
	reloadRowExpand: (rowIndex: number) => void;
	/**
	 * 展开行
	 * @param indexOrSearchCallback 行index或者数据搜索回调
	 */
	setRowExpand: (indexOrSearchCallback: number | ((data: Source) => boolean)) => void;
	/**
	 * 获取选中行数据
	 */
	getSelectionData: () => Source[];
	/**
	 * 清除选中项
	 */
	clearSelection: () => void;
	/**
	 * 设置默认选中项
	 * @param selectData
	 * @param key
	 */
	setDefaultSelection: (selectData: Source[], key: string) => void;
	/**
	 * 设置行选中状态
	 * @param rowIndex
	 * @param action
	 */
	setRowSelection: (rowIndex: number, action: boolean) => void;
	/**
	 * 列表滚动到指定行到可视区域
	 * @param indexOrSearchCallback 行index或者数据搜索回调
	 */
	scrollToRow: (indexOrSearchCallback: number | ((data: Source) => boolean)) => void;

	/**
	 * 筛选控制实例
	 */
	filterInstance: IFilterInstance;
}

export interface IFilterInstance {
	/**
	 * 重置指定筛选项
	 * @param colKey
	 */
	resetFilter: (colKey: string) => void;
	/**
	 * 关闭过滤的弹窗
	 */
	closeFilterDialog: () => void;
	/**
	 * 清除所有的筛选数据
	 */
	clearAllFilter: () => void;
	/**
	 * 确认筛选，触发筛选事件
	 */
	confirmFilter: () => void;
	/**
	 * 更新筛选数据
	 * @param colKey
	 * @param filterValue
	 */
	updateFilter: (colKey: string, filterValue: any) => void;
}

export interface IExpandInstance {
	/**
	 * 重新加载展开数据
	 */
	reloadData: () => Promise<void> | void;
}

export interface IFilterParams {
	value: any;
	/**
	 * 筛选类型
	 */
	type: string;
	/**
	 * 自定义数据
	 */
	customData: any;
	/**
	 * 筛选字段名称
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
}
