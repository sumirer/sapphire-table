import type { FC, PropsWithChildren } from 'react';
import { useContext, useEffect, useRef } from 'react';
import type { IRowRenderItem } from '@sapphire-table/core';
import { TableContext } from '../context/TableContext';
import type { VirtualTableType } from '../hooks/useVirtualTable';

interface IExpandProps extends PropsWithChildren {
	rowData: IRowRenderItem;
	rowIndex: number;
}

export const TableExpandWrapper: FC<IExpandProps> = (props) => {
	const table = useContext(TableContext) as VirtualTableType;

	const expandBodyRef = useRef<HTMLDivElement>(null);

	const sizeObserver = useRef(
		new ResizeObserver((entries: ResizeObserverEntry[]) => {
			if (entries.length) {
				const [target] = entries;
				const element = target.target as HTMLDivElement;
				if (element) {
					if (element.clientHeight === 0) {
						return;
					}
				}
			}
		})
	);

	useEffect(() => {
		if (expandBodyRef.current) {
			sizeObserver.current.observe(expandBodyRef.current);
		}
		return () => {
			sizeObserver.current?.disconnect();
		};
	}, []);

	return (
		<div
			className={'sapphire-table__expand-wrapper'}
			style={{
				height: props.rowData.expandHeight + 'px',
				width: table.bodyWidth + 'px',
				marginTop: props.rowData.renderRowHeight + 'px',
				zIndex: 8,
				opacity: props.rowData.expand ? 1 : 0,
			}}
			ref={expandBodyRef}
		>
			<div className="sapphire-table__expand-body">{props.children}</div>
		</div>
	);
};
