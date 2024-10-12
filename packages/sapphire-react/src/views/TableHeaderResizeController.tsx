import type { FC, MouseEvent } from 'react';
import { useContext, useMemo, useRef } from 'react';
import { TableContext } from '../context/TableContext';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import { ensureColumnWidthsFillSpace, updateColumnRenderInfo, utils } from '@sapphire-table/core';
import { useUpdate } from '../hooks/useUpdate';
import { composeClassName } from '../utils/classNameUtils';

export const TableHeaderResizeController: FC<{ position: 'body' | 'left' | 'right' }> = (props) => {
	const table = useContext(TableContext) as VirtualTableType;
	const usageColumns =
		props.position === 'body'
			? table.bodyColumns
			: props.position === 'left'
				? table.leftColumns
				: table.rightColumns;

	const columnRenderRange = useMemo(
		() => {
			const rangeIndex: Array<number> = [];
			if (props.position === 'body') {
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
			? [
					table.bodyColumns.length,
					table.bodyGrid.renderInfo.renderColumnStart,
					table.bodyGrid.renderInfo.renderColumnEnd,
				]
			: props.position === 'left'
				? [table.leftColumns.length]
				: [table.rightColumns.length]
	);

	const resizeControl = useRef({
		offset: '',
		visible: false,
		index: -1,
		resizeOffsetChange: 0,
		resizeStart: 0,
	});

	const { update } = useUpdate();

	const handleResizeStart = (event: MouseEvent, colIndex: number) => {
		console.log(event);
		resizeControl.current.index = colIndex;
		resizeControl.current.resizeStart = event.nativeEvent.x;
		resizeControl.current.resizeOffsetChange = 0;
		update();
	};

	const handleResizeUpdate = (event: MouseEvent) => {
		if (resizeControl.current.index < 0) {
			return;
		}
		const target = usageColumns[resizeControl.current.index];
		const minWidth = utils.clamp(target.column.minWidth || 20, 20, Number.MAX_SAFE_INTEGER);
		const maxWidth = target.column.maxWidth || Number.MAX_SAFE_INTEGER;
		resizeControl.current.resizeOffsetChange = utils.clamp(
			event.nativeEvent.x - resizeControl.current.resizeStart,
			minWidth - target.renderWidth,
			maxWidth - target.renderWidth
		);
		update();
	};

	const handleResizeEnd = () => {
		if (resizeControl.current.index >= 0) {
			usageColumns[resizeControl.current.index].renderWidth =
				usageColumns[resizeControl.current.index].renderWidth +
				resizeControl.current.resizeOffsetChange;
			updateTableLayout();
		}
		resizeControl.current.index = -1;
		resizeControl.current.resizeStart = 0;
		resizeControl.current.resizeOffsetChange = 0;
		update();
	};

	const updateTableLayout = () => {
		if (props.position === 'body') {
			updateColumnRenderInfo(table.bodyGrid);
		} else if (props.position === 'left') {
			updateColumnRenderInfo(table.leftGrid);
			ensureColumnWidthsFillSpace(table.leftGrid);
		} else {
			updateColumnRenderInfo(table.rightGrid);
			ensureColumnWidthsFillSpace(table.rightGrid);
		}
		table.updateTableLayout();
	};

	return (
		<>
			{columnRenderRange.map((colIndex) => {
				if (!usageColumns[colIndex].column.resize) {
					return null;
				}
				return (
					<div
						key={colIndex}
						className={composeClassName(['sapphire-table__resize', props.position])}
						onMouseDown={(event) => handleResizeStart(event, colIndex)}
						onMouseMove={handleResizeUpdate}
						onMouseUp={handleResizeEnd}
						onMouseLeave={handleResizeEnd}
						style={{
							left:
								props.position === 'body'
									? `${
											table.leftFixedWidth +
											usageColumns[colIndex].renderOffset +
											usageColumns[colIndex].renderWidth -
											table.offset.x -
											3 +
											(resizeControl.current.index === colIndex
												? resizeControl.current.resizeOffsetChange
												: 0)
										}px`
									: props.position === 'left'
										? `${
												usageColumns[colIndex].renderOffset +
												usageColumns[colIndex].renderWidth -
												3 +
												(resizeControl.current.index === colIndex
													? resizeControl.current.resizeOffsetChange
													: 0)
											}px`
										: `${
												table.bodyWidth -
												table.rightFixedWidth +
												usageColumns[colIndex].renderOffset +
												usageColumns[colIndex].renderWidth -
												3 +
												(resizeControl.current.index === colIndex
													? resizeControl.current.resizeOffsetChange
													: 0)
											}px`,
						}}
					>
						<div />
					</div>
				);
			})}
		</>
	);
};
