import type { FC } from 'react';
import { useContext } from 'react';
import type {
	IColumnRenderItem,
	IRowRenderItem,
	ITableColumn,
	ITableFormats,
} from '@sapphire-table/core';
import { TableContext } from '../context/TableContext';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import { composeClassName } from '../utils/classNameUtils';
import { CheckBox } from '../components/CheckBox';
import type { PropsWithSlots } from '../types/table';

interface ITableCellProps extends PropsWithSlots {
	enableFormatCache?: boolean;
	formats: ITableFormats;
	rowInfo: IRowRenderItem;
	columnInfo: IColumnRenderItem;
	rowIndex: number;
	columnIndex: number;
}
export const TableCell: FC<ITableCellProps> = (props) => {
	const table = useContext(TableContext) as VirtualTableType;

	/**
	 * Formats the cell value based on the column's formatter function.
	 * If the enableFormatCache flag is true and the value is already cached, it returns the cached value.
	 * Otherwise, it applies the formatter function to the cell value and caches the result if enabled.
	 *
	 * @param value - The row data object containing the cell value.
	 * @param col - The column object defining the cell's properties and formatting rules.
	 *
	 * @returns The formatted cell value. If the column type is defined, it returns undefined.
	 */
	const getValueByFormat = (value: IRowRenderItem, col: ITableColumn) => {
		if (col.type) {
			return undefined;
		}
		let formatter = col.formatter;
		let formatterValue = value.rowData[col.colKey];
		const formatCache = value.formatCache;

		// Check if the value is already cached and return it if enabled
		if (props.enableFormatCache && formatCache && col.colKey in formatCache) {
			return formatCache[col.colKey];
		}

		if (formatter) {
			if (!Array.isArray(formatter)) {
				formatter = [formatter];
			}
			const [fnName, ...params] = formatter;
			const formatFn = props.formats[fnName];

			// Apply the formatter function to the cell value
			if (typeof formatFn === 'function') {
				formatterValue = formatFn(
					{
						cellValue: formatterValue,
						rowData: value.rowData,
						column: col,
						columnIndex: 0,
						rowIndex: props.rowIndex,
						rowRenderItem: value,
						columnRenderItem: props.columnInfo,
					},
					...params
				);
			}

			// Cache the formatted value if enabled
			if (props.enableFormatCache) {
				if (formatCache) {
					formatCache[col.colKey] = formatterValue;
				} else {
					value.formatCache = { [col.colKey]: formatterValue };
				}
			}
		}

		return formatterValue;
	};

	const colInfo = props.columnInfo;

	const colData = colInfo.column;

	const slotsName = colData.slots?.default;

	const cellFormatValue = getValueByFormat(props.rowInfo, colData);

	const handleOpenRowExpand = () => {
		table.handleExpandRow(props.rowIndex);
	};

	const handleSelectRowStatusChange = (checked: boolean) => {
		table.handleRowSelect(props.rowIndex, checked);
	};

	if (colData.type === 'expand') {
		return (
			<div
				className={'sapphire-table__table-cell tools'}
				style={{
					width: props.columnInfo.renderWidth + 'px',
					transform: `translateX(${props.columnInfo.renderOffset}px)`,
				}}
				onClick={handleOpenRowExpand}
			>
				<svg
					className={composeClassName({
						'sapphire-table__table-expand': true,
						'expand-active': props.rowInfo.expand,
					})}
					viewBox="0 0 1024 1024"
					xmlns="http://www.w3.org/2000/svg"
					width="200"
					height="200"
				>
					<path d="M295.7 897.96c-18.8-18.8-18.8-49.1 0-67.9l318-318-318-318c-18.8-18.8-18.8-49.2 0-67.9 18.8-18.8 49.1-18.8 67.9 0l352 352c18.8 18.8 18.8 49.2 0 67.9l-352 352c-9.4 9.4-21.7 14-34 14C317.4 911.96 305.1 907.36 295.7 897.96z"></path>
				</svg>
			</div>
		);
	}
	if (colData.type === 'selection' || colData.type === 'radio') {
		return (
			<div
				className={'sapphire-table__table-cell tools'}
				style={{
					width: props.columnInfo.renderWidth + 'px',
					transform: `translateX(${props.columnInfo.renderOffset}px)`,
				}}
			>
				<CheckBox checked={props.rowInfo.selection} onChange={handleSelectRowStatusChange} />
			</div>
		);
	}
	return (
		<div
			className={composeClassName({
				'sapphire-table__table-cell': true,
				[`align-${props.columnInfo.column.align || 'left'}`]: true,
			})}
			style={{
				width: props.columnInfo.renderWidth + 'px',
				transform: `translateX(${props.columnInfo.renderOffset}px)`,
			}}
		>
			{slotsName
				? props.slots?.cellSlots?.[slotsName]?.({
						row: props.rowInfo.rowData,
						column: {
							...colData,
						},
						colIndex: props.rowIndex,
						rowIndex: props.rowIndex,
						key: colData.colKey,
						formatValue: cellFormatValue,
					})
				: cellFormatValue}
		</div>
	);
};
