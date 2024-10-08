<script setup lang="ts">
import { SapphireTable } from '@sapphire-table/sapphire-vue'
import { type IExpandParams, type ITableConfig, TableColumnFactory } from '@sapphire-table/core'
import { ref } from 'vue'
import TableFilterContent from '@/components/TableFilterContent.vue'

const loading = ref(false)

const columns = new TableColumnFactory()
  .factory((factory) => {
    factory.addExpandColum(30)
    factory.addSelection()
    for (let index = 0; index < 3; index++) {
      factory
        .addColumn('mock-title' + index, 'test' + index)
        .setWith(100)
        .setFixed('right')
        .setResize(true)
        .setSort(true)
    }
    for (let index = 0; index < 3; index++) {
      factory
        .addColumn('mock-title' + index, 'test' + index)
        .setWith(100)
        .setFixed('left')
        .setResize(true)
        .setSort(true)
        .setFilter('text')
    }
    for (let index = 0; index < 1000; index++) {
      factory
        .addColumn('mock-title' + index, 'test' + index)
        .setWith(200)
        .setResize(true)
        .setSlots('testSlots')
        .setSort(true)
    }
  })
  .build()

interface IExpandData extends IExpandParams {
  pageIndex: number
  pageNumber: number
}

const tableConfig: ITableConfig<IExpandData> = {
  dataLoadMethod: (params) => {
    loading.value = true
    console.log('get table params', params)
    return new Promise<any[]>((resolve) => {
      setTimeout(() => {
        const mockPrefix = Math.random().toString()
        const mockData = []
        for (let index = 0; index < 1000; index++) {
          const obj: Record<string, any> = {}
          for (let index1 = 0; index1 < 1000; index1++) {
            obj['test' + index1] = `${mockPrefix}-mock-${index1}-${index}`
          }
          mockData.push(obj)
        }
        loading.value = false
        resolve(mockData)
      }, 1000)
    })
  },
  expandConfig: {
    expandDefaultParams: {
      data: [],
      columns: [],
      loading: false,
      pageIndex: 1,
      pageNumber: 20
    },
    dataLoadMethod(params, tableParams) {
      console.log('get expand table params', params, tableParams)
      params.loading = true
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockPrefix = Math.random().toString()
          const mockData = []
          for (let index = 0; index < 1000; index++) {
            const obj: Record<string, any> = {}
            for (let index1 = 0; index1 < 1000; index1++) {
              obj['test' + index1] = `${mockPrefix}-mock-${index1}-${index}`
            }
            mockData.push(obj)
          }
          params.columns = new TableColumnFactory()
            .factory((factory) => {
              factory.addSelection()
              for (let index = 0; index < 3; index++) {
                factory
                  .addColumn('mock-title' + index, 'test' + index)
                  .setWith(100)
                  .setFixed('right')
                  .setResize(true)
                  .setSort(true)
              }
              for (let index = 0; index < 1; index++) {
                factory
                  .addColumn('mock-title' + index, 'test' + index)
                  .setWith(100)
                  .setFixed('left')
                  .setResize(true)
                  .setSort(true)
                  .setFilter('text')
              }
              for (let index = 0; index < 10; index++) {
                factory
                  .addColumn('mock-title' + index, 'test' + index)
                  .setWith(200)
                  .setResize(true)
                  .setSlots('testSlots')
                  .setSort(true)
              }
            })
            .build()
          params.data = mockData
          params.loading = false
          resolve()
        }, 1000)
      })
    }
  }
}
</script>

<template>
  <div style="width: 100%; height: 100%">
    <SapphireTable
      :columns="columns"
      :config="tableConfig"
      style="height: 600px"
      :loading="loading"
    >
      <template #testSlots="{ formatValue }">
        {{ formatValue + '---custom' }}
      </template>
      <template #sapphireFilter="params">
        <TableFilterContent v-bind="params" />
      </template>
      <template #sapphireExpandInner="{ expandData, expandHeight, config }">
        <div :style="{ height: `${expandHeight}px`, paddingLeft: '20px', background: '#f8f8f8' }">
          <SapphireTable
            :columns="expandData.columns"
            :loading="expandData.loading"
            :config="config"
          >
            <template #testSlots="{ formatValue }">
              {{ formatValue + 'expand---custom' }}
            </template>
          </SapphireTable>
        </div>
      </template>
    </SapphireTable>
  </div>
</template>

<style lang="css">
* {
  box-sizing: border-box;
}
</style>
