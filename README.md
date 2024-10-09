# sapphire-table

### A user-friendly and high-performance virtual table
![NPM Version](https://img.shields.io/npm/v/%40sapphire-table%2Fsapphire-vue)
![npm bundle size](https://img.shields.io/bundlephobia/min/%40sapphire-table%2Fsapphire-vue)

## Documentation

// TODO

## Introduction

// TODO

## Install

Vue3.x
```bash
yarn add @sapphire-table/core

yarn add @sapphire-table/sapphire-vue 
```

React17+

```bash
//TODO
```

## Quick Start

Vue3.x

```vue
<script lang="ts">
  import { SapphireTable } from '@sapphire-table/sapphire-vue'
  // import style file
  import '@sapphire-table/sapphire-vue/lib/style.css';
  import { ref } from 'vue'
  import { type IExpandParams, type ITableConfig, TableColumnFactory } from '@sapphire-table/core'

  const loading = ref(false)
  const data = ref([])
  // create column data
  const columns = new TableColumnFactory()
    .factory((factory) => {
      //...
    });
</script>

<template>
  <SapphireTable
    :columns="columns"
    :data="data"
    style="height: 600px"
    :loading="loading"
></SapphireTable>
</template>

```