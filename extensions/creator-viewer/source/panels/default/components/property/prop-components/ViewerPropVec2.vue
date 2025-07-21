<script setup lang="ts">
import { ElCol, ElRow } from 'element-plus';
import { reactive, watch } from 'vue';
import { ClientBridge, trackersMap } from '../../../CreatorViewerMiddleware';
import CoordinateNumInput from '../../CoordinateNumInput.vue';

const props = defineProps<{ modelValue: cvType.Vec2, uuid : string, propName : string  }>();

const tracker = trackersMap.get(props.uuid + props.propName);

const internalValue = reactive({
    x: props.modelValue.x,
    y: props.modelValue.y
})

watch(
    tracker,
    (newVal) => {
        internalValue.x = newVal.x;
        internalValue.y = newVal.y;
    },
    { deep: true }
)

watch(
    internalValue,
    (newVal) => {
        console.log(`on ${props.uuid}  ${props.propName}  vec2 changed `, newVal);
        if(newVal.x == tracker.value.x && newVal.y == tracker.value.y) return;
        tracker.value.x = newVal.x;
        tracker.value.y = newVal.y;
        ClientBridge.modifyTargetProp(props.uuid, props.propName, newVal);
    },
    { deep: true }
)

</script>

<template>
    <ElRow :gutter="10">
        <ElCol :span="12">
            <div class="vec-field">
                <CoordinateNumInput v-model="internalValue.x" color="#cb2600"></CoordinateNumInput>
            </div>
        </ElCol>
        <ElCol :span="12">
            <div class="vec-field">
                <CoordinateNumInput v-model="internalValue.y" color="#67a900"></CoordinateNumInput>
            </div>
        </ElCol>
    
    </ElRow>
</template>

<style lang="css">
.vec-field {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
}

.vec-field .el-input-number {
    flex: 1;
    min-width: 0;
    width: 100%;
}
.vec-field .el-input-number .el-input-number__increase  {
    width: 16px;
}

.vec-field .el-input-number .el-input-number__decrease  {
    width: 16px;
}

/* 外部容器用于布局 */
.color-bar-wrapper {
  position: relative;
  display: inline-block;
}

/* 竖线条 */
.color-bar {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 5px;
  width: 4px;
  background-color: #f56c6c; /* 只有这条竖线有颜色 */
  border-radius: 4px;
  z-index: 2;
  pointer-events: none; /* 让它不影响点击 */
}

</style>