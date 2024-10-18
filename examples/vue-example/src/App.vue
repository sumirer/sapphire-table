<script setup lang="ts">
import SapphireTable from '@sapphire-table/sapphire-vue'
import {
  type ICellRenderCallback,
  type IExpandParams,
  type ITableConfig,
  type ITableMenuGroup,
  TableColumnFactory
} from '@sapphire-table/core'
import { markRaw, ref } from 'vue'
import TableFilterContent from '@/components/TableFilterContent.vue'
import copyIcon from './assets/copy.svg'

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
    for (let index = 0; index < 500; index++) {
      factory
        .addColumn('mock-title' + index, 'test' + index)
        .setWith(200)
        .setResize(true)
        .setSlots('testSlots')
        .setSort(true)
        .addChildColumn((childFactory) => {
          for (let _index = 0; _index < 3; _index++) {
            childFactory
              .addColumn('mock-sub-title' + index + '_' + _index, 'test' + index)
              .setWith(100)
              .setResize(true)
              .setSort(true)
              .addChildColumn((ddChildFactory) => {
                for (let _index_ = 0; _index_ < 3; _index_++) {
                  ddChildFactory
                    .addColumn(
                      'mock-sub-sub-title' + index + '_' + _index + '_' + _index_,
                      'test' + index
                    )
                    .setWith(100)
                    .setResize(true)
                    .setSort(true)
                }
              })
          }
        })
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
        for (let index = 0; index < 500; index++) {
          const obj: Record<string, any> = {}
          for (let index1 = 0; index1 < 1000; index1++) {
            obj['test' + index1] = `${mockPrefix}-mock-${index1}-${index}`
          }
          mockData.push(obj)
        }
        loading.value = false
        resolve(markRaw(mockData))
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
      if (params.data.length > 0) {
        return Promise.resolve()
      }
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
          params.data = markRaw(mockData)
          params.loading = false
          resolve()
        }, 1000)
      })
    }
  }
}

const tableCellRender: ICellRenderCallback = (row, column, rowIndex, columnIndex) => {
  if (rowIndex === 4 && columnIndex === 1) {
    return { colSpan: 3, rowSpan: 3 }
  }
  return {
    colSpan: 1,
    rowSpan: 1
  }
}

const menus: ITableMenuGroup = {
  cell: [
    {
      title: 'column = 4',
      visible: (params) => {
        return params.current?.columnIndex === 3
      },
      key: 'test column 4',
      icon: copyIcon,
      onMenuClick(params) {
        console.log('column 4 clicked', params)
      },
      children: [
        {
          title: 'test child',
          key: 'child',
          visible: true,
          onMenuClick(params) {
            console.log('child clicked', params)
          }
        },
        {
          title: 'test child 1',
          key: 'child1',
          visible: true,
          onMenuClick(params) {
            console.log('child1 clicked', params)
          }
        }
      ]
    },
    {
      title: 'test group',
      visible: (params) => {
        return !!params.current && params.current?.columnIndex >= 1
      },
      icon: copyIcon,
      key: 'test group',
      isGroup: true,
      children: [
        {
          title: 'test child',
          key: 'child',
          icon: copyIcon,
          visible: true,
          onMenuClick(params) {
            console.log('child clicked', params)
          }
        },
        {
          title: 'test child 1',
          key: 'child1',
          visible: true,
          onMenuClick(params) {
            console.log('child1 clicked', params)
          }
        }
      ]
    },
    {
      title: 'test column max than 2',
      visible: (params) => {
        return !!params.selection && params.selection.length > 2
      },
      key: 'test column max than 2',
      onMenuClick(params) {
        console.log('column max 2 clicked', params)
      }
    }
  ]
}
</script>

<template>
  <div style="width: 100%; height: 100%">
    <SapphireTable
      :columns="columns"
      :config="tableConfig"
      style="height: 800px"
      :loading="loading"
      :cell-render="tableCellRender"
      stripe
      range-selection
      :horizontal-render-fill-distance="400"
      :vertical-render-fill-distance="300"
      :menus="menus"
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
            range-selection
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
