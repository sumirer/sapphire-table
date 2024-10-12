import type { IFilterParams, ITableColumn } from '@sapphire-table/core';

export interface IOpenFilterParams {
	filterParams: IFilterParams;
	filterField: string;
	offset: number;
	colWidth: number;
	column: ITableColumn;
	slotName: string;
}

export interface ITableFilterInstance {
	openFilter: (params: IOpenFilterParams) => Promise<void>;
	hiddenFilter: () => void;
}
