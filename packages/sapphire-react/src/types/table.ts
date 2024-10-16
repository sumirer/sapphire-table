import type {
	IExpandInstance,
	IExpandParams,
	IFilterData,
	IFilterInstance,
	IFilterParams,
	IRowRenderItem,
	ISortParams,
	ITableColumn,
	ITableColumns,
	ITableConfig,
	ITableFormats,
} from '@sapphire-table/core';
import type { ReactNode } from 'react';
export interface ITableProps<T = any> extends PropsWithSlots {
	/**
	 * Table data. Can be replaced with a loading method.
	 * @see ITableProps.config
	 * @see ITableConfig.dataLoadMethod
	 */
	data?: Array<T>;

	/**
	 * Column definitions for the table. Can be built using a builder tool.
	 * @see import('@sapphire-table/core').TableColumnFactory
	 */
	columns: Array<ITableColumn> | ITableColumns;

	/**
	 * Collection of formatting utility methods for the table.
	 */
	formats?: ITableFormats<T>;

	/**
	 * Row style calculation function.
	 * @param row - The row for which the style is being calculated.
	 */
	computedRowStyle?: (row: IRowRenderItem) => string;

	/**
	 * Whether to enable calculation caching for the table cells.
	 * Useful when cells display complex calculations or when using the format method.
	 * However, it may introduce cache issues.
	 */
	enableFormatCache?: boolean;

	/**
	 * Configuration options for the table.
	 */
	config?: ITableConfig;

	/**
	 * Preset row height for the table.
	 * Useful for estimating row height in dynamic height lists to reduce row jitter.
	 * A higher value may result in a closer approximation to the actual row height.
	 */
	presetHeight?: number;

	/**
	 * Whether the table is in a loading state.
	 */
	loading?: boolean;

	onSortChange?(params: ISortParams): void;

	onFilterChange?(params: Array<IFilterParams>): void;
	verticalRenderFillDistance?: number;
	horizontalRenderFillDistance?: number;
}

export interface ITableCellSlotsParams<T = any> {
	row: T;
	column: ITableColumn;
	colIndex: number;
	rowIndex: number;
	key: string;
	formatValue: any;
}

export interface ITableExpandSlotsParams {
	rowInfo: IRowRenderItem;
	expandData: IExpandParams;
	rowIndex: number;
	expandHeight: number;
	instance: IExpandInstance;
	config: ITableConfig;
}

export type SapphireExpandInnerSlot = (params: ITableExpandSlotsParams) => ReactNode;
export type SapphireLoadingSlot = (loading?: boolean) => ReactNode;
export type SapphireTableCellSlot = (params: ITableCellSlotsParams) => ReactNode;
export type SapphireHeaderSlot = (params: ITableColumn) => ReactNode;
export type SapphireFilterSlot = (params: IFilterData & { instance: IFilterInstance }) => ReactNode;

export interface PropsWithSlots {
	slots?: {
		expandSlots?: SapphireExpandInnerSlot;
		loadingSlots?: SapphireLoadingSlot;
		headerSlots?: Record<string, SapphireHeaderSlot>;
		cellSlots?: Record<string, SapphireTableCellSlot>;
		filterSlots?: Record<string, SapphireFilterSlot>;
	};
}
