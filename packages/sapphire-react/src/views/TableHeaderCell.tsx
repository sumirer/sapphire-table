import type { CSSProperties, FC, MouseEvent } from 'react';
import { useContext } from 'react';
import type { IColumnRenderItem, ISortParams, ITableColumn } from '@sapphire-table/core';
import { composeClassName } from '../utils/classNameUtils';
import { TableContext } from '../context/TableContext';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import { CheckBox } from '../components/CheckBox';
import type { PropsWithSlots } from '../types/table';
import type { IOpenFilterParams } from '../types/types';

export interface ITableHeaderCellProps extends PropsWithSlots {
	column: IColumnRenderItem;
	onFilter: (params: IOpenFilterParams) => void;
	onSort: (params: ISortParams) => void;
}

export const TableHeaderCell: FC<ITableHeaderCellProps> = ({ column, slots, onSort, onFilter }) => {
	const table = useContext(TableContext) as VirtualTableType;

	const handleSortChange = (
		event: MouseEvent,
		column: ITableColumn,
		type: 'up' | 'down' | 'none'
	) => {
		event.stopPropagation();
		if (type !== 'none') {
			const sortValueIndex = type === 'up' ? 0 : 1;
			const sortValue = column.sortValue || ['asc', 'desc'];
			table.sortInfo.type = sortValue[sortValueIndex];
			table.sortInfo.property = column.colKey;
		} else {
			table.sortInfo.type = '';
			table.sortInfo.property = '';
		}
		table.updateTableView();
	};

	const handleColumnClick = (event: MouseEvent, column: ITableColumn) => {
		if (!column.sort) {
			return;
		}
		const { property, type } = table.sortInfo;
		if (property === column.colKey) {
			const [sortUp, sortDown] = column.sortValue || ['asc', 'desc'];
			if (type === sortUp) {
				handleSortChange(event, column, 'down');
			} else if (type === sortDown) {
				handleSortChange(event, column, 'none');
			}
		} else {
			handleSortChange(event, column, 'up');
		}
		onSort({
			...table.sortInfo,
		});
	};

	const handleOpenFilter = (event: MouseEvent) => {
		event.stopPropagation();
		onFilter({
			offset: column.renderOffset,
			filterField: column.column.colKey,
			filterParams: column.filterParams,
			colWidth: column.renderWidth,
			column: column.column,
			slotName: column.column.filter as string,
		});
	};

	const renderSortIcon = () => {
		if (!column.column.sort) {
			return null;
		}
		const columnHasSort = table.sortInfo.property === column.column.colKey;
		const [sortUp, sortDown] = column.column.sortValue || ['asc', 'desc'];
		const sortUpColor =
			columnHasSort && table.sortInfo.type === sortUp
				? '--sapphire-primary-color'
				: '--sapphire-gray-color';
		const sortDownColor =
			columnHasSort && table.sortInfo.type === sortDown
				? '--sapphire-primary-color'
				: '--sapphire-gray-color';
		return (
			<div className="action-sort-icon">
				<div
					className="sort-up-icon"
					style={
						{
							'--sort-default-color': `var(${sortUpColor})`,
						} as CSSProperties
					}
					onClick={(event) => handleSortChange(event, column.column, 'up')}
				></div>
				<div
					className="sort-down-icon"
					style={
						{
							'--sort-default-color': `var(${sortDownColor})`,
						} as CSSProperties
					}
					onClick={(event) => handleSortChange(event, column.column, 'down')}
				></div>
			</div>
		);
	};

	const renderFilterIcon = () => {
		if (!column.column.filter) {
			return null;
		}
		return (
			<div className={'action-filter-icon'} onClick={handleOpenFilter}>
				<svg
					className="action-filter-icon"
					viewBox="0 -1 12 12"
					xmlns="http://www.w3.org/2000/svg"
					width="200"
					height="200"
				>
					<path
						style={{
							fill: `var(${
								column.filterParams.value !== undefined
									? '--sapphire-primary-color'
									: '--sapphire-gray-color'
							})`,
						}}
						d="M3.40215 8.32031C3.40215 8.52773 3.56855 8.69531 3.7748 8.69531H6.8498C7.05605 8.69531 7.22246 8.52773
          7.22246 8.32031V6.02344H3.40215V8.32031ZM9.62597 0.304688H0.998631C0.711521 0.304688 0.532224 0.617578
          0.676365 0.867188L3.26972 5.27344H7.35722L9.95058 0.867188C10.0924 0.617578 9.91308 0.304688 9.62597
          0.304688Z"
					></path>
				</svg>
			</div>
		);
	};

	return (
		<div
			className={composeClassName({
				'header-title': true,
				'with-action-icon': column.column.sort,
			})}
			style={{
				width: column.renderWidth + 'px',
				left: column.renderOffset + 'px',
			}}
			onClick={(event) => handleColumnClick(event, column.column)}
		>
			<div className={'sapphire-table__table-header-container'}>
				{column.column.slots?.['header'] && slots ? (
					<span className="header-cell-title" style={{ width: '100%' }}>
						{slots?.headerSlots?.[column.column.slots?.['header']]?.(column.column)}
					</span>
				) : (
					<span
						className={`header-cell-title align-${
							column.column.align === 'center' ? 'center' : 'left'
						}`}
					>
						{column.column.type === 'selection' ? (
							<div className="vertical-center">
								<CheckBox
									checked={table.isHalf || table.selectAll}
									half={table.isHalf}
									onCheckboxClick={table.handleSelectAllClick}
								/>
							</div>
						) : (
							column.column.title
						)}
					</span>
				)}
			</div>
			{column.column.sort || column.column.filter ? (
				<div className={'sapphire-table__table-header-tools'}>
					{renderSortIcon()}
					{renderFilterIcon()}
				</div>
			) : null}
		</div>
	);
};
