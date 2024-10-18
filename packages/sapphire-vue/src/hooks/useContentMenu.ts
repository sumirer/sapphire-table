import { reactive, ref } from 'vue';
import type {
	CellInfo,
	IColumnRenderItem,
	IMenuContentBlock,
	IRowRenderItem,
	CellPositionData,
} from '@sapphire-table/core';

interface IContextRecord {
	x: number;
	y: number;
	selection: Array<Pick<CellInfo, 'cellRow' | 'cellCol'>>;
	position: CellPositionData;
	current?: { rowIndex: number; columnIndex: number; position: CellPositionData };
	columnData?: IColumnRenderItem;
	rowData?: IRowRenderItem;
}

export const useContentMenu = () => {
	const position = reactive<IContextRecord>({
		x: 0,
		y: 0,
		selection: [],
		position: null,
		current: undefined,
	});

	const menuRef = ref<HTMLElement>();

	const menuContent = ref<IMenuContentBlock[]>([]);

	const menuVisible = ref(false);

	const showMenuContent = (menu: IMenuContentBlock[], positionData: IContextRecord) => {
		Object.assign(position, positionData);
		menuContent.value = menu;
		menuVisible.value = true;
	};

	const hiddenMenuContent = () => {
		menuVisible.value = false;
		position.current = undefined;
		position.columnData = undefined;
		position.rowData = undefined;
		position.selection = [];
		position.position = null;
		menuContent.value = [];
		position.position = null;
	};

	return {
		showMenuContent,
		hiddenMenuContent,
		menuRef,
		position,
		menuContent,
		menuVisible,
	};
};

export type ContentMenuType = ReturnType<typeof useContentMenu>;
