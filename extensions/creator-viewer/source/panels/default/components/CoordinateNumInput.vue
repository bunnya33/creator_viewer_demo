<template>
    <div class="color-bar-wrapper" :style="barWrapperStyle">
        <div class="color-bar" :style="barStyle" />
        <ElInputNumber ref="inputWrapperRef" :step="numStep" v-model="model" v-bind="$attrs" size="small" controls-position="right" @focus="onFocus" class="custom-input" />
    </div>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits, watch, onBeforeMount, onMounted, ref, onUnmounted } from 'vue'
import { ElInputNumber } from 'element-plus'

const props = defineProps<{
    modelValue: number
    color?: string
}>()

const inputWrapperRef = ref<InstanceType<typeof ElInputNumber>>(null);
const numStep = ref(0.1);

onUnmounted(()=>{
    onMouseUp();
})

onMounted((...args)=>{
    // console.log(args);
    const increaseButton = inputWrapperRef.value.$el as HTMLSpanElement;
    increaseButton.onmousedown = ()=>{
        onMouseDown();
    }

    increaseButton.onmouseup = ()=>{
        onMouseUp();
    }
    console.log(inputWrapperRef);
})



let timer = null;
let interval = 500 // 初始触发间隔（ms）

function startPressLoop() {
  timer = setTimeout(() => {
    numStep.value += 0.1
    interval = Math.max(50, interval * 0.9) // 每次减速，最低间隔50ms
    startPressLoop() // 递归调用
  }, interval)
}

function onMouseDown() {
  interval = 500
  startPressLoop()
}

function onMouseUp() {
  if (timer) {
    clearTimeout(timer)
    timer = null
    numStep.value = 0.1
  }
}

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

function onFocus(event : FocusEvent) {
    console.log(`on coordinate focus `, event);
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