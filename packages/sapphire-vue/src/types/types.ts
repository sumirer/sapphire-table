import { ITableColumn } from '@sapphire-table/core';

export interface IOpenFilterParams {
	value: unknown;
	filterField: string;
	offset: number;
	colWidth: number;
	column: ITableColumn;
}

export interface ITableFilterInstance {
	openFilter: (params: IOpenFilterParams) => Promise<void>;
	hiddenFilter: () => void;
}
