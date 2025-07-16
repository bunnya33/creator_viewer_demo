<template>
    <div class="color-bar-wrapper" :style="barWrapperStyle">
        <div class="color-bar" :style="barStyle" />
        <ElInputNumber v-model="model" v-bind="$attrs" size="small" controls-position="right" class="custom-input" />
    </div>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits, watch, onBeforeMount } from 'vue'
import { ElInputNumber } from 'element-plus'

const props = defineProps<{
    modelValue: number
    color?: string
}>()

onBeforeMount(()=>{
    console.log(`onBeforeMount`);
})

const emit = defineEmits<{
    (e : 'value-change', value : number)
}>()

const model = computed({
    get: () => props.modelValue,
    set: (val) => {
        emit('value-change', val);
        console.log(`vupdate value`);
    },
})

// 动态颜色样式
const barStyle = computed(() => ({
    backgroundColor: props.color || '#409EFF',
}))

const barWrapperStyle = {
    backgroundColor: 'transparent',
}
</script>

<style scoped>
.color-bar-wrapper {
    position: relative;
    display: inline-block;
    flex: 1;
}

.color-bar {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 2px;
    width: 3px;
    border-radius: 3px 0 0 3px;
    z-index: 2;
    pointer-events: none;
}

/* 给 ElInputNumber 留出左侧空间 */
.custom-input {
    flex-grow: 1;
}
</style>