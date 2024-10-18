<template>
	<div
		class="sapphire-table__content-menu-mask"
		v-show="contentMenu.menuVisible.value"
		@click="contentMenu.hiddenMenuContent"
	>
		<div
			class="sapphire-table__content-menu-body"
			:style="{
				left: contentMenu.position.x + 'px',
				top: contentMenu.position.y + 'px',
			}"
		>
			<ContentMenuItem
				v-for="menu in contentMenu.menuContent.value"
				:menu="menu"
				:key="menu.key"
				:on-menu-click="props.onMenuClick"
			>
			</ContentMenuItem>
			<div class="sapphire-table__content-menu-actions">
				<!-- Actions -->
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { inject } from 'vue';
import { TABLE_PROVIDER_CONTENT_MENU_KEY } from '../constant/table';
import type { ContentMenuType } from '../hooks/useContentMenu';
import ContentMenuItem from './ContentMenuItem.vue';
import type { IMenuContentBlock } from '@sapphire-table/core';

const props = defineProps<{
	onMenuClick: (menu: IMenuContentBlock) => void;
}>();

const contentMenu = inject(TABLE_PROVIDER_CONTENT_MENU_KEY) as ContentMenuType;
</script>
