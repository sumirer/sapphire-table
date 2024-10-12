import type { IColumnRenderItem, IRowRenderItem } from '@sapphire-table/core';
import type { FC } from 'react';
import { useContext, useMemo } from 'react';
import { TableContext } from '../context/TableContext';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import { TableRow } from './TableRow';
import type { PropsWithSlots } from '../types/table';

interface IRowRenderDelegationProps extends PropsWithSlots {
	computedRowStyle?: (row: IRowRenderItem) => string;
	columns: IColumnRenderItem[];
	position: 'left' | 'body' | 'right';
	withExpand?: boolean;
}

export const RowRenderDelegation: FC<IRowRenderDelegationProps> = (props) => {
	const table = useContext(TableContext) as VirtualTableType;

	const targetGrid =
		props.position === 'body'
			? table.bodyGrid
			: props.position === 'left'
				? table.leftGrid
				: table.rightGrid;

	const renderComputeIndex = useMemo(() => {
		const indexList: Array<{
			key: number;
			data: IRowRenderItem;
		}> = [];
		// empty
		if (table.tableRowData.length === 0) {
			return indexList;
		}
		for (
			let index = table.bodyGrid.renderInfo.renderRowStart;
			index <= table.bodyGrid.renderInfo.renderRowEnd;
			index++
		) {
			indexList.push({
				data: table.tableRowData[index],
				key: index,
			});
		}
		return indexList;
	}, [
		table.tableRowData,
		table.bodyGrid.renderInfo.renderRowStart,
		table.bodyGrid.renderInfo.renderRowEnd,
	]);

	return (
		<>
			{renderComputeIndex.map((renderRow) => {
				return (
					<TableRow
						key={table.renderUpdateKey + '_' + renderRow.key}
						rowIndex={renderRow.key}
						rowData={renderRow.data}
						columns={props.columns}
						position={props.position}
						withExpand={props.withExpand}
						slots={props.slots}
						style={{
							width: targetGrid.gridContentWidth + 'px',
						}}
					/>
				);
			})}
		</>
	);
};
