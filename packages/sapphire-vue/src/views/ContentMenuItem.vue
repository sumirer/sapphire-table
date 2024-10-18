<template>
	<div class="sapphire-table__content-menu-item" @click="handleMenuClick">
		<div v-if="props.menu.icon" class="sapphire-table__content-menu-icon">
			<img :src="props.menu.icon" alt="" />
		</div>
		<div class="sapphire-table__content-menu-label">{{ props.menu.title }}</div>
		<div class="sapphire-table__content-menu-description">{{ props.menu.description }}</div>
		<div class="sapphire-table__content-menu-expand" v-if="props.menu.children">
			<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="600" height="600">
				<path
					d="M675.11699 539.183194l-271.900268 271.91116a38.453744 38.453744 0 0 1-54.380251-54.383222l244.710141-244.723014-244.710141-244.719054a38.453744 38.453744 0 0 1 54.380251-54.383222l271.900268 271.91116a38.455724 38.455724 0 0 1 0 54.386192z"
					fill="#3B3F51"
				></path>
			</svg>
		</div>
		<div
			class="sapphire-table__content-menu-expand-wrapper sapphire-table__content-menu-body"
			v-if="props.menu.children"
		>
			<ContentMenuItem
				v-for="menu in props.menu.children"
				:menu="menu"
				:key="menu.key"
				:on-menu-click="props.onMenuClick"
			/>
		</div>
	</div>
</template>

<script lang="ts" setup>
import type { IMenuContentBlock } from '@sapphire-table/core';
import { inject } from 'vue';
import { TABLE_PROVIDER_CONTENT_MENU_KEY } from '../constant/table';
import type { ContentMenuType } from '../hooks/useContentMenu';

const props = defineProps<{
	menu: IMenuContentBlock;
	onMenuClick: (menu: IMenuContentBlock) => void;
}>();

const contentMenu = inject(TABLE_PROVIDER_CONTENT_MENU_KEY) as ContentMenuType;
const handleMenuClick = (event: MouseEvent) => {
	event.stopPropagation();
	props.onMenuClick?.(props.menu);
	if (!props.menu.isGroup) {
		contentMenu.hiddenMenuContent();
	}
};
</script>
