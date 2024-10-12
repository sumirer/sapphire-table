import type { CSSProperties, FC } from 'react';
import { useContext, useMemo, useRef } from 'react';
import type {
	IColumnRenderItem,
	IExpandInstance,
	ILoadDataRequestParams,
	IRowRenderItem,
	ITableConfig,
} from '@sapphire-table/core';
import { TableContext } from '../context/TableContext';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import { composeClassName } from '../utils/classNameUtils';
import { TableCell } from './TableCell';
import { TableExpandWrapper } from './TableExpandWrapper';
import type { PropsWithSlots } from '../types/table';

interface ITableRowProps<T = any> extends PropsWithSlots {
	rowIndex: number;
	rowData: IRowRenderItem<T>;
	columns: IColumnRenderItem[];
	computedRowStyle?: (row: IRowRenderItem<T>) => string;
	position: 'left' | 'body' | 'right';
	withExpand?: boolean;
	onHover?(index: number): void;
	onUnHover?(index: number): void;
	style?: CSSProperties;
}

export const TableRow: FC<ITableRowProps> = (props) => {
	const table = useContext(TableContext) as VirtualTableType;

	const columnRef = useRef<HTMLDivElement>(null);

	const isHover = useMemo(() => {
		return table.hoverIndex === props.rowIndex;
	}, [table.hoverIndex]);

	const rowClassNames = useMemo(() => {
		const classNames: Record<string, boolean> = {
			'sapphire-table__table-row': true,
		};
		const computeClass = props.computedRowStyle?.(props.rowData);
		if (computeClass) {
			classNames[computeClass] = true;
		}
		return classNames;
	}, []);

	const columnRenderRange = useMemo(
		() => {
			const rangeIndex: Array<number> = [];
			if (props.position === 'body') {
				if (
					table.bodyGrid.renderInfo.renderColumnStart ===
						table.bodyGrid.renderInfo.renderColumnEnd &&
					table.bodyGrid.renderInfo.renderColumnEnd === 0
				) {
					return rangeIndex;
				}
				for (
					let index = table.bodyGrid.renderInfo.renderColumnStart;
					index <= table.bodyGrid.renderInfo.renderColumnEnd;
					index++
				) {
					rangeIndex.push(index);
				}
			} else if (props.position === 'left') {
				for (let index = 0; index < table.leftColumns.length; index++) {
					rangeIndex.push(index);
				}
			} else {
				for (let index = 0; index < table.rightColumns.length; index++) {
					rangeIndex.push(index);
				}
			}
			return rangeIndex;
		},
		props.position === 'body'
			? [table.bodyGrid.renderInfo.renderColumnStart, table.bodyGrid.renderInfo.renderColumnEnd]
			: props.position === 'left'
				? [table.leftColumns]
				: [table.rightColumns]
	);

	const handleColumnHover = () => {
		table.updateHoverIndex(props.rowIndex);
		props.onHover?.(props.rowIndex);
	};

	const handleColumUnHover = () => {
		table.updateHoverIndex(-1);
		props.onUnHover?.(props.rowIndex);
	};

	const reloadExpandData = async (params: ILoadDataRequestParams) => {
		await table.loadExpandData(props.rowData, params);
		table.updateTableView();
		return props.rowData.expandInnerData.data;
	};

	const expandConfig: ITableConfig = {
		dataLoadMethod: reloadExpandData,
	};

	const expandInstance: IExpandInstance = {
		reloadData: () => table.handleReloadRowData(props.rowIndex),
	};

	return (
		<div
			className={composeClassName(rowClassNames)}
			style={{
				height: props.rowData.renderRowHeight + 'px',
				transform: `translateY(${props.rowData.renderOffset + 'px'})`,
				position: 'absolute',
				willChange: 'transform',
				...props.style,
			}}
		>
			<div
				ref={columnRef}
				className={composeClassName({ 'expand-wrapper-row-hover': isHover })}
				onMouseEnter={handleColumnHover}
				onMouseLeave={handleColumUnHover}
			>
				{columnRenderRange.map((colIndex) => {
					return (
						<TableCell
							formats={table.globalFormatter}
							rowInfo={props.rowData}
							columnInfo={props.columns[colIndex]}
							rowIndex={props.rowIndex}
							columnIndex={colIndex}
							slots={props.slots}
							key={colIndex}
						/>
					);
				})}
			</div>
			{props.withExpand && props.slots?.expandSlots ? (
				<TableExpandWrapper rowData={props.rowData} rowIndex={props.rowIndex}>
					{props.rowData.expand
						? props.slots.expandSlots?.({
								rowInfo: props.rowData,
								expandData: props.rowData.expandInnerData,
								rowIndex: props.rowIndex,
								expandHeight: props.rowData.expandHeight,
								instance: expandInstance,
								config: expandConfig,
							})
						: null}
				</TableExpandWrapper>
			) : null}
		</div>
	);
};
