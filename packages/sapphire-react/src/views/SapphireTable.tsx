import type { CSSProperties, UIEventHandler } from 'react';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { ITableProps } from '../types/table';
import { useVirtualTable } from '../hooks/useVirtualTable';
import type {
	IExpandParams,
	IFilterParams,
	ISortParams,
	ITableInstance,
} from '@sapphire-table/core';
import { TableContext } from '../context/TableContext';
import { TableHeader } from './TableHeader';
import { TableColumnFixedWrapper } from './TableColumnFixedWrapper';
import { RowRenderDelegation } from './RowRenderDelegation';
import '@sapphire-table/core/lib/style/index.scss';
import { TableFilter } from './TableFilter';
import { SapphireLoading } from '../components/SapphireLoading';
import type { IOpenFilterParams, ITableFilterInstance } from '../types/types';
import { TableHeaderResizeController } from './TableHeaderResizeController';

export const SapphireTable = forwardRef<ITableInstance, ITableProps & { style?: CSSProperties }>(
	(
		{
			slots,
			columns,
			data,
			config,
			computedRowStyle,
			presetHeight,
			onFilterChange,
			onSortChange,
			style,
			loading,
			horizontalRenderFillDistance,
			verticalRenderFillDistance,
		},
		ref
	) => {
		const table = useVirtualTable(config);

		const viewportRef = useRef<HTMLDivElement>(null);

		const bodyWrapperRef = useRef<HTMLDivElement>(null);

		const tableFilterRef = useRef<ITableFilterInstance>(null);

		const sizeObserver = useRef(
			new ResizeObserver((entries: ResizeObserverEntry[]) => {
				const [wrapperBody] = entries;
				const target = wrapperBody.target as HTMLDivElement;
				if (target) {
					if (bodyWrapperRef.current) {
						table.updateBodySize(
							bodyWrapperRef.current.clientWidth,
							bodyWrapperRef.current.clientHeight
						);
						testScrollBarVisibleChange();
						tableFilterRef.current?.hiddenFilter();
					}
				}
			})
		);

		useEffect(() => {
			if (data) {
				updateNewData(data);
			}
		}, [data]);

		useEffect(() => {
			if (!data) {
				updateNewData([]);
				handleLoadTableData();
			}
			if (bodyWrapperRef.current && viewportRef.current) {
				sizeObserver.current.observe(bodyWrapperRef.current);
				// sizeObserver.observe(viewportRef.value);
			}
		}, []);

		useEffect(() => {
			table.updateBodyRenderFillDistance(
				verticalRenderFillDistance ?? 150,
				horizontalRenderFillDistance ?? 200
			);
		}, [verticalRenderFillDistance, horizontalRenderFillDistance]);

		useEffect(() => {
			table.updateTableColumn(columns);
			setTimeout(() => {
				table.updatePingAction();
				resetTableAction();
			});
		}, [columns]);

		const updateNewData = (newData: typeof data) => {
			table.updateTableData(
				newData || [],
				(config?.expandConfig?.expandDefaultParams || {}) as IExpandParams,
				presetHeight || 50
			);
			setTimeout(() => {
				table.updatePingAction();
				resetTableAction();
			});
		};

		useEffect(() => {
			setTimeout(() => {
				testScrollBarVisibleChange();
			});
		}, [
			table.tableContentWidth,
			table.leftFixedWidth,
			table.rightFixedWidth,
			table.tableContentHeight,
		]);

		const resetTableAction = () => {
			bodyWrapperRef.current?.scrollTo(0, 0);
		};

		const testScrollBarVisibleChange = () => {
			if (viewportRef.current && bodyWrapperRef.current) {
				table.updateScrollBodyBarWidth(
					viewportRef.current.clientWidth - bodyWrapperRef.current.clientWidth
				);
			}
		};

		const handleScrollChange: UIEventHandler<HTMLDivElement> = (event) => {
			const target = event.target as HTMLDivElement;
			table.updateScrollOffset(target.scrollLeft, target.scrollTop);
			tableFilterRef.current?.hiddenFilter();
		};

		/**
		 * Handles loading table data based on the provided configuration.
		 * If a data load method is provided in the configuration, it will be used to fetch the data.
		 * Otherwise, it will call the `updateNewData` function with an empty array.
		 */
		const handleLoadTableData = () => {
			if (config) {
				const { dataLoadMethod } = config;
				tableFilterRef.current?.hiddenFilter();
				return dataLoadMethod({
					filter: { ...table.filterParamsCache },
					sort: { ...table.sortInfo },
				})
					.then((getData) => {
						updateNewData(getData);
					})
					.catch(() => {
						updateNewData([]);
					});
			}
			tableFilterRef.current?.hiddenFilter();
		};

		/**
		 * Scrolls the table to the specified row based on the provided index or search callback.
		 *
		 * @param {number | ((data: any) => boolean)} indexOrSearchCallback - The index of the row to scroll to,
		 * or a search callback that returns true for the desired row.
		 */
		const handleScrollToRow = (indexOrSearchCallback: number | ((data: any) => boolean)) => {
			const { renderInfo } = table.getRenderRowIndexByIndexOrSearch(indexOrSearchCallback);
			if (renderInfo) {
				bodyWrapperRef.current?.scroll(0, renderInfo.renderOffset);
			}
		};

		const handleOpenFilter = (params: IOpenFilterParams) => {
			tableFilterRef.current?.openFilter(params);
		};

		const handleConfirmFilter = (params: Array<IFilterParams>) => {
			// If a data loading configuration exists, directly retrieve the data;
			// if not, delegate it to external processing.
			onFilterChange?.(params);
			handleLoadTableData();
		};

		const handleUpdateSort = (params: ISortParams) => {
			onSortChange?.(params);
			handleLoadTableData();
		};

		useImperativeHandle(ref, () => ({
			setRowExpand: table.handleUpdateExpandRow,
			scrollToRow: handleScrollToRow,
			reloadRowExpand: table.handleReloadRowData,
			getSelectionData: table.getSelectionData,
			clearSelection: table.clearAllSelection,
			setRowSelection: table.handleRowSelect,
			setDefaultSelection: table.setDefaultSelection,
			loadData: handleLoadTableData,
			filterInstance: table.filterInstance,
		}));

		return (
			<TableContext.Provider value={table}>
				<div className={'sapphire-table'} ref={viewportRef} style={style}>
					{slots?.loadingSlots?.(loading) || (loading && <SapphireLoading />)}
					<TableHeader slots={slots} onFilter={handleOpenFilter} onSort={handleUpdateSort} />
					<TableHeaderResizeController position="body" />
					<TableHeaderResizeController position="left" />
					<TableHeaderResizeController position="right" />
					<div
						className={'sapphire-table__table-scroll-body'}
						onScroll={handleScrollChange}
						ref={bodyWrapperRef}
					>
						<div
							className={'sapphire-table__table-scroll-body-wrapper'}
							style={{
								width:
									table.tableContentWidth + table.leftFixedWidth + table.rightFixedWidth + 'px',
							}}
						>
							<TableFilter onFilter={handleConfirmFilter} ref={tableFilterRef} />
							{table.leftColumns.length > 0 && (
								<TableColumnFixedWrapper
									position={'left'}
									width={table.leftFixedWidth + 'px'}
									height={table.tableContentHeight + 'px'}
									style={{
										overflow: 'visible',
										zIndex: 5,
									}}
								>
									<RowRenderDelegation
										columns={table.leftColumns}
										position={'left'}
										withExpand
										computedRowStyle={computedRowStyle}
										slots={slots}
									/>
								</TableColumnFixedWrapper>
							)}
							<div
								className={'sapphire-table__table-body'}
								style={{
									width: table.tableContentWidth + 'px',
									height: table.tableContentHeight + 'px',
								}}
							>
								<RowRenderDelegation
									columns={table.bodyColumns}
									position={'body'}
									computedRowStyle={computedRowStyle}
									slots={slots}
								/>
							</div>
							<div style={{ flex: 1 }}></div>
							{table.rightColumns.length > 0 && (
								<TableColumnFixedWrapper
									position={'right'}
									width={table.rightFixedWidth + 'px'}
									height={table.tableContentHeight + 'px'}
								>
									<RowRenderDelegation
										columns={table.rightColumns}
										position={'right'}
										computedRowStyle={computedRowStyle}
										slots={slots}
									/>
								</TableColumnFixedWrapper>
							)}
						</div>
					</div>
				</div>
			</TableContext.Provider>
		);
	}
);
