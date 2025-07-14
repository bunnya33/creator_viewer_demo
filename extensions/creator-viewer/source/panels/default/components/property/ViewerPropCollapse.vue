<template>
    <ElCollapse expand-icon-position="left" v-for="(item, index) in items" :key="index">
        <ViewerPropGroup :prop-data="item"></ViewerPropGroup>
    </ElCollapse>
</template>

<script setup lang="ts">
import { provide, ref } from 'vue';
import ViewerPropGroup from './ViewerPropGroup.vue';

const props = defineProps({
    items: {
        type: Array as () => Array<ICCObjectPropGroup>,
        required: true
    }
})

const propNameWidth = ref(120);
const propResizing = ref(false);

provide('propNameWidth', propNameWidth);
provide('propResizing', propResizing);

</script>

<style>

.el-collapse-item__header {
    background-color: rgb(77,77,77) !important;
    height: 35px;
    box-sizing: border-box;
}

</style>