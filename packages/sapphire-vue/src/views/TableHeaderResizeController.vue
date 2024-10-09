<template>
	<template v-for="colIndex in columnRenderRange" :key="colIndex">
		<div
			v-if="usageColumns[colIndex].column.resize"
			class="sapphire-table__resize"
			:class="[props.position]"
			@mousedown="handleResizeStart($event, colIndex)"
			@mousemove="handleResizeUpdate"
			@mouseup="handleResizeEnd"
			@mouseleave="handleResizeEnd"
			:style="{
				left:
					props.position === 'body'
						? `${
								table.leftFixedWidth.value +
								usageColumns[colIndex].renderOffset +
								usageColumns[colIndex].renderWidth -
								table.offset.value.x -
								3 +
								(resizeControl.index === colIndex ? resizeControl.resizeOffsetChange : 0)
							}px`
						: props.position === 'left'
							? `${
									usageColumns[colIndex].renderOffset +
									usageColumns[colIndex].renderWidth -
									3 +
									(resizeControl.index === colIndex ? resizeControl.resizeOffsetChange : 0)
								}px`
							: `${
									table.bodyWidth.value -
									table.rightFixedWidth.value +
									usageColumns[colIndex].renderOffset +
									usageColumns[colIndex].renderWidth -
									3 +
									(resizeControl.index === colIndex ? resizeControl.resizeOffsetChange : 0)
								}px`,
			}"
		>
			<div />
		</div>
	</template>
</template>

<script lang="ts" setup>
import { computed, inject, reactive } from 'vue';
import type { VirtualTableType } from '../hooks/useVirtualTable';
import { TABLE_PROVIDER_KEY } from '../constant/table';
import type { IColumnRenderItem } from '@sapphire-table/core';
import { ensureColumnWidthsFillSpace, updateColumnRenderInfo } from '@sapphire-table/core';
import { utils } from '@sapphire-table/core';

const props = defineProps<{ position: 'body' | 'left' | 'right' }>();

const table = inject<VirtualTableType>(TABLE_PROVIDER_KEY) as VirtualTableType;

const usageColumns = computed<Array<IColumnRenderItem>>(() =>
	props.position === 'body'
		? table.bodyColumns.value
		: props.position === 'left'
			? table.leftColumns.value
			: table.rightColumns.value
);

const columnRenderRange = computed(() => {
	const rangeIndex: Array<number> = [];
	if (props.position === 'body') {
		if (table.bodyColumns.value.length === 0) {
			return rangeIndex;
		}
		for (
			let index = table.bodyGrid.value.renderInfo.renderColumnStart;
			index <= table.bodyGrid.value.renderInfo.renderColumnEnd;
			index++
		) {
			rangeIndex.push(index);
		}
	} else if (props.position === 'left') {
		for (let index = 0; index < table.leftColumns.value.length; index++) {
			rangeIndex.push(index);
		}
	} else {
		for (let index = 0; index < table.rightColumns.value.length; index++) {
			rangeIndex.push(index);
		}
	}
	return rangeIndex;
});

const resizeControl = reactive({
	offset: '',
	visible: false,
	index: -1,
	resizeOffsetChange: 0,
});

let resizeStart = 0;

const handleResizeStart = (event: MouseEvent, colIndex: number) => {
	resizeControl.index = colIndex;
	resizeStart = event.x;
	resizeControl.resizeOffsetChange = 0;
};

const handleResizeUpdate = (event: MouseEvent) => {
	if (resizeControl.index < 0) {
		return;
	}
	const target = usageColumns.value[resizeControl.index];
	const minWidth = utils.clamp(target.column.minWidth || 20, 20, Number.MAX_SAFE_INTEGER);
	const maxWidth = target.column.maxWidth || Number.MAX_SAFE_INTEGER;
	resizeControl.resizeOffsetChange = utils.clamp(
		event.x - resizeStart,
		minWidth - target.renderWidth,
		maxWidth - target.renderWidth
	);
};

const handleResizeEnd = () => {
	if (resizeControl.index >= 0) {
		usageColumns.value[resizeControl.index].renderWidth =
			usageColumns.value[resizeControl.index].renderWidth + resizeControl.resizeOffsetChange;
		updateTableLayout();
	}
	resizeControl.index = -1;
	resizeStart = 0;
	resizeControl.resizeOffsetChange = 0;
};

const updateTableLayout = () => {
	if (props.position === 'body') {
		updateColumnRenderInfo(table.bodyGrid.value);
	} else if (props.position === 'left') {
		updateColumnRenderInfo(table.leftGrid.value);
		ensureColumnWidthsFillSpace(table.leftGrid.value);
	} else {
		updateColumnRenderInfo(table.rightGrid.value);
		ensureColumnWidthsFillSpace(table.rightGrid.value);
	}
	table.updateTableLayout();
};
</script>
