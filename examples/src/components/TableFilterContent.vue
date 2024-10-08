<template>
  <div class="filter-content">
    <div class="filter-content__content">
      <input
        class="filter-content__input"
        :value="value"
        @input="handleInputChange"
        placeholder="请输入"
      />
    </div>
    <div class="filter-content__footer">
      <div class="filter-content__button" @click="handleMakeSure">确认</div>
      <div class="filter-content__button gray" @click="handleCancel">取消</div>
      <div class="filter-content__button" @click="handleReset">重置</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { IFilterData, IFilterInstance } from '@sapphire-table/core'
import { ref } from 'vue'

interface IProps extends IFilterData {
  instance: IFilterInstance
}

const props = defineProps<Partial<IProps>>()

const value = ref<string>(props.value || '')

const handleInputChange = (event: InputEvent) => {
  value.value = (event.target as HTMLInputElement).value || ''
}

const handleMakeSure = () => {
  props.instance?.updateFilter(props?.field as string, value.value)
  props.instance?.confirmFilter()
}

const handleCancel = () => {
  props.instance?.closeFilterDialog()
}

const handleReset = () => {
  props.instance?.resetFilter(props.field as string)
  value.value = ''
  props.instance?.closeFilterDialog()
  props.instance?.confirmFilter()
}
</script>

<style lang="scss">
.filter-content {
  width: 100%;
  padding: 10px;

  &__content {
    padding-bottom: 10px;
  }

  &__input {
    width: 100%;
    height: 28px;
  }

  &__footer {
    display: flex;
  }

  &__button {
    padding: 2px 16px;
    border-radius: 4px;
    text-align: center;
    cursor: pointer;
    background: #266fe8;
    color: #fff;
    font-size: 14px;
    line-height: 22px;

    + .filter-content__button {
      margin-left: 10px;
    }

    &.gray {
      background: #f8f8f8;
      border: 1px solid #666;
      color: #333;
    }
  }
}
</style>
