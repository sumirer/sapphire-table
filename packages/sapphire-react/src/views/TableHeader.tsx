import type { FC } from 'react';
import { useContext, useMemo } from 'react';
import { TableContext } from '../context/TableContext';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import { composeClassName } from '../utils/classNameUtils';
import type { ISortParams } from '@sapphire-table/core';
import { TableHeaderCell } from './TableHeaderCell';
import type { PropsWithSlots } from '../types/table';
import type { IOpenFilterParams } from '../types/types';

export interface ITableHeaderProps extends PropsWithSlots {
	onFilter: (params: IOpenFilterParams) => void;
	onSort: (params: ISortParams) => void;
}

export const TableHeader: FC<ITableHeaderProps> = ({
	onFilter: handleOpenFilter,
	onSort: handleSort,
	slots,
}) => {
	const table = useContext(TableContext) as VirtualTableType;

	const bodyColumnRenderIndex = useMemo(() => {
		const rangeIndex: Array<number> = [];
		if (table.bodyColumns.length === 0) {
			return rangeIndex;
		}
		for (
			let index = table.bodyGrid.renderInfo.renderColumnStart;
			index <= table.bodyGrid.renderInfo.renderColumnEnd;
			index++
		) {
			rangeIndex.push(index);
		}
		return rangeIndex;
	}, [
		table.bodyColumns,
		table.bodyGrid.renderInfo.renderColumnStart,
		table.bodyGrid.renderInfo.renderColumnEnd,
	]);

	return (
		<div
			className="sapphire-table__table-header"
			style={{
				width: '100%',
				height: '40px',
			}}
		>
			<div
				className={composeClassName({
					'sapphire-table__header-fixed left-fixed': true,
					'sapphire-table__ping-left': table.pingLeft,
				})}
				style={{ width: table.leftFixedWidth + 'px' }}
			>
				{table.leftColumns.map((col, index) => {
					return (
						<TableHeaderCell
							column={col}
							slots={slots}
							onFilter={handleOpenFilter}
							onSort={handleSort}
							key={col.column.colKey + '_' + index}
						/>
					);
				})}
			</div>
			<div className={'sapphire-table__header-wrapper'}>
				<div
					className={'sapphire-table__header-body'}
					style={{
						width: table.bodyGrid.gridContentWidth + 'px',
						willChange: 'transform',
						transform: `translateX(-${table.offset.x}px)`,
					}}
				>
					{bodyColumnRenderIndex.map((colIndex) => {
						return (
							<TableHeaderCell
								column={table.bodyColumns[colIndex]}
								slots={slots}
								onFilter={handleOpenFilter}
								onSort={handleSort}
								key={colIndex}
							/>
						);
					})}
				</div>
			</div>
			<div
				className={composeClassName({
					'sapphire-table__header-fixed right-fixed': true,
					'sapphire-table__ping-right': table.pingRight,
				})}
				style={{ width: table.rightFixedWidth + 'px' }}
			>
				{table.rightColumns.map((col, index) => {
					return (
						<TableHeaderCell
							column={col}
							slots={slots}
							onFilter={handleOpenFilter}
							onSort={handleSort}
							key={col.column.colKey + '_' + index}
						/>
					);
				})}
			</div>
			<div
				className="sapphire-table__header-fixed scroll-fixed"
				style={{ width: table.scrollBarWidth + 'px' }}
			></div>
		</div>
	);
};
