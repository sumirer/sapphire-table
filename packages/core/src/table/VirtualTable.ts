import { VirtualGrid } from './VirtualGrid';
import type { IExpandParams, IRowRenderItem, ITableColumn } from '../types/types';
import { deepClone } from '../utils/utils';
import { observer } from '../observer/Observer';

export class VirtualTable {
	public bodyColumns: Array<ITableColumn> = [];

	public leftFixedColumns: Array<ITableColumn> = [];

	public rightFixedColumns: Array<ITableColumn> = [];

	public bodyGrid = new VirtualGrid();

	public leftFixedGrid = new VirtualGrid();

	public rightFixedGrid = new VirtualGrid();

	public rowData: IRowRenderItem[] = [];

	public rowHeight = observer(0);

	public updateTableColumn(columns: Array<ITableColumn>) {
		columns.forEach((col) => {
			if (col.fixed === 'right') {
				this.rightFixedColumns.push(col);
			} else if (col.fixed === 'left') {
				this.leftFixedColumns.push(col);
			} else {
				this.bodyColumns.push(col);
			}
		});
		this.updateGridData();
		this.updateTableLayout();
	}

	private updateGridData() {
		this.bodyGrid.initGridCellRenderInfo(this.bodyColumns);
		this.leftFixedGrid.initGridCellRenderInfo(this.leftFixedColumns);
		this.rightFixedGrid.initGridCellRenderInfo(this.rightFixedColumns);
	}

	public updateTableData(dataList: Array<any>, expandData: IExpandParams, presetHeight: number) {
		let offset = 0;
		this.rowData = dataList.map((item) => {
			const addOffset = offset;
			offset += presetHeight;
			return {
				expand: false,
				selection: false,
				expandHeight: 0,
				formatCache: {},
				renderOffset: addOffset,
				renderRowHeight: presetHeight,
				rowData: item,
				rowHeight: presetHeight,
				expandInnerData: deepClone(expandData),
			};
		});
		this.updateAllGridRowData();
		this.updateTableLayout();
		this.updateRowHeight();
	}

	public updateAllGridRowData() {
		this.bodyGrid.gridRows.replace(this.rowData);
		this.leftFixedGrid.gridRows.replace(this.rowData);
		this.rightFixedGrid.gridRows.replace(this.rowData);
	}

	public updateScrollOffset(x: number, y: number) {
		this.leftFixedGrid.updateWindowOffset(0, y);
		this.rightFixedGrid.updateWindowOffset(0, y);
		this.bodyGrid.updateWindowOffset(x, y);
	}

	public updateTableLayout() {
		this.leftFixedGrid.requestLayoutUpdate();
		this.bodyGrid.requestLayoutUpdate();
		this.rightFixedGrid.requestLayoutUpdate();
		this.bodyGrid.testColumnWidth();
	}

	public updateRowHeight() {
		let totalHeight = 0;
		this.rowData.forEach((value) => {
			value.renderOffset = totalHeight;
			totalHeight += value.renderRowHeight + value.expandHeight;
		});
		this.rowHeight.replace(totalHeight);
		this.updateAllGridRowData();
	}

	public getRenderRowIndexByIndexOrSearch = (
		indexOrSearchCallback: number | ((data: any) => boolean)
	) => {
		let findData: IRowRenderItem | undefined = undefined;
		let dataIndex = 0;
		if (typeof indexOrSearchCallback === 'number') {
			findData = this.rowData[indexOrSearchCallback];
			dataIndex = indexOrSearchCallback;
		} else {
			for (let index = 0; index < this.rowData.length; index++) {
				const renderRowItem = this.rowData[index];
				if (indexOrSearchCallback(renderRowItem.rowData)) {
					findData = renderRowItem;
					dataIndex = index;
				}
			}
		}
		return {
			index: dataIndex,
			renderInfo: findData,
		};
	};
}
