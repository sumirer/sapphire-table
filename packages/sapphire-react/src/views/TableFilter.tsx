import type { CSSProperties } from 'react';
import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import type { IFilterData, IFilterParams, ITableColumn } from '@sapphire-table/core';
import type { IOpenFilterParams, ITableFilterInstance } from '../types/types';
import { TableContext } from '../context/TableContext';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import { useUpdate } from '../hooks/useUpdate';
import type { PropsWithSlots } from '../types/table';
import { composeClassName } from '../utils/classNameUtils';
import { registerOutsideClick } from '@sapphire-table/core/lib/utils/ClickOutside';

export interface IFilterProps extends PropsWithSlots {
	onFilter: (params: Array<IFilterParams>) => void;
}

export const TableFilter = forwardRef<ITableFilterInstance, IFilterProps>((props, ref) => {
	const filterWidgetData = useRef<IFilterData>({
		animationClose: false,
		visible: false,
		offset: 0,
		left: 'unset',
		fixOffset: '0px',
		top: '0px',
		field: '',
		value: null,
		colWidth: 0,
		bodyWidth: 200,
		column: {} as ITableColumn,
		type: '',
		filterInnerParams: {},
		slotName: '',
	});

	const { update } = useUpdate();

	const table = useContext(TableContext) as VirtualTableType;

	const filterBodyRef = useRef<HTMLDivElement>(null);

	const handleHiddenFilter = () => {
		if (!filterWidgetData.current.visible || filterWidgetData.current.animationClose) {
			return;
		}

		filterWidgetData.current.animationClose = true;
		update();
		setTimeout(() => {
			Object.assign<IFilterData, Partial<IFilterData>>(filterWidgetData.current, {
				animationClose: false,
				visible: false,
				offset: 0,
				field: '',
				value: '',
				colWidth: 0,
				bodyWidth: 200,
				fixOffset: '0px',
				filterInnerParams: {},
				type: '',
				slotName: '',
			});
			update();
		}, 190);
	};

	/**
	 * Function to handle the display of filter dialog for a specific column.
	 *
	 * @param {IOpenFilterParams} params - Object containing parameters for opening the filter dialog.
	 * @param {string} params.filterField - The field name of the column to apply the filter.
	 * @param {number} params.offset - The horizontal offset position of the filter dialog relative to the column.
	 * @param {IFilterParams} params.filterParams - Object containing filter parameters.
	 * @param {number} params.colWidth - The width of the column.
	 * @param {ITableColumn} params.column - The column object.
	 * @param {string} params.slotName - The name of the slot to render the filter component.
	 */
	const handleShowFilter = async ({
		filterField,
		offset,
		filterParams,
		colWidth,
		column,
		slotName,
	}: IOpenFilterParams) => {
		if (filterWidgetData.current.visible) {
			// Check if the target filter is already open
			const isOpenTarget =
				filterField === filterWidgetData.current.field &&
				offset === filterWidgetData.current.offset;
			handleHiddenFilter();
			await new Promise((resolve) => {
				setTimeout(() => {
					resolve(true);
				}, 200);
			});
			// If the target filter is already open, return early
			if (isOpenTarget) {
				return;
			}
		}
		// Calculate the left position of the filter dialog
		const leftDistance = offset + (column.fixed ? table.offset.x : table.leftFixedWidth) + colWidth;
		Object.assign<IFilterData, Partial<IFilterData>>(filterWidgetData.current, {
			visible: true,
			offset,
			field: filterField,
			value: filterParams.value as string,
			colWidth,
			column: column,
			// fixOffset: column.fixed ? table.offset.x : table.leftFixedWidth + 'px',
			top: table.offset.y + 7 + 'px',
			filterInnerParams: filterParams.customData,
			type: filterParams.type,
			slotName,
			left: leftDistance + 'px',
		});
		update(() => {
			const viewportRect =
				filterBodyRef.current?.parentElement?.parentElement?.parentElement?.getClientRects()?.[0];
			if (!viewportRect) {
				return;
			}
			const rects = filterBodyRef.current?.getClientRects();
			if (rects && rects.length > 0) {
				const filterRect = rects[0];
				filterWidgetData.current.bodyWidth = filterRect.width;
				let offset = 0;
				// Check if the filter dialog overflows the viewport and adjust the position accordingly
				if (viewportRect.x > filterRect.x) {
					offset += viewportRect.x - filterRect.x + 20;
					if (!column.fixed) {
						offset += table.leftFixedWidth;
					}
				} else if (viewportRect.x + viewportRect.width < filterRect.x + filterRect.width) {
					offset -= filterRect.x + filterRect.width - viewportRect.x - viewportRect.width;
					if (!column.fixed) {
						offset -= table.rightFixedWidth;
					}
				}
				// Update the fixed offset of the filter dialog
				filterWidgetData.current.fixOffset = offset + 'px';
				update();
			}
		});
	};

	useEffect(() => {
		table.filterInstance.closeFilterDialog = handleHiddenFilter;
		table.filterInstance.confirmFilter = () => {
			props.onFilter(table.getAllFilterParams());
		};
		if (filterBodyRef.current) {
			const unRegister = registerOutsideClick(filterBodyRef.current, () => handleHiddenFilter());
			return () => unRegister();
		}
		return () => {
			//
		};
	}, []);

	useImperativeHandle(ref, () => ({
		openFilter: handleShowFilter,
		hiddenFilter: handleHiddenFilter,
	}));

	if (!filterWidgetData.current.visible) {
		return null;
	}
	return (
		<div
			className={composeClassName({
				'sapphire-table__filter-wrapper': true,
				dispose: filterWidgetData.current.animationClose,
			})}
			ref={filterBodyRef}
			style={
				{
					left: filterWidgetData.current.left,
					top: filterWidgetData.current.top,
					transform: `translateX(calc(-50% - 20px + ${filterWidgetData.current.fixOffset}))`,
					'--filter-offset': filterWidgetData.current.fixOffset,
				} as CSSProperties
			}
		>
			<div
				className={'filter-inner-body'}
				style={{
					maxHeight: table.tableHeight - table.scrollBarWidth + 'px',
				}}
			>
				{props.slots?.filterSlots?.[filterWidgetData.current.slotName]?.({
					...filterWidgetData.current,
					instance: table.filterInstance,
				})}
			</div>
		</div>
	);
});
