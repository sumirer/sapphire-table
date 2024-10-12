import type { CSSProperties, FC, PropsWithChildren } from 'react';
import { useContext, useMemo } from 'react';
import { composeClassName } from '../utils/classNameUtils';
import { TableContext } from '../context/TableContext';
import type { VirtualTableType } from '../hooks/useVirtualTable';

interface ITableColumnFixedWrapperProps extends PropsWithChildren {
	position: 'left' | 'right';
	width: string;
	height: string;
	style?: CSSProperties;
}

export const TableColumnFixedWrapper: FC<ITableColumnFixedWrapperProps> = (props) => {
	const table = useContext(TableContext) as VirtualTableType;

	const showFixedAction = useMemo(() => {
		if (props.position === 'left') {
			return table.pingLeft;
		}
		return table.pingRight;
	}, [table.pingRight, table.pingLeft]);

	return (
		<div
			className={composeClassName({
				'sapphire-table__table-fixed': true,
				[`sapphire-table__ping-${props.position}`]: showFixedAction,
				[props.position || '']: true,
			})}
			style={{
				[props.position]: 0,
				width: props.width,
				height: props.height,
				...props.style,
			}}
		>
			{props.children}
		</div>
	);
};
