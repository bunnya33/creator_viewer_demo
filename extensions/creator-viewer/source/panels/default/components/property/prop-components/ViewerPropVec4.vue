<script setup lang="ts">
import { ElCol, ElRow } from 'element-plus';
import { reactive, watch } from 'vue';
import { ClientBridge, trackersMap } from '../../../CreatorViewerMiddleware';
import CoordinateNumInput from '../../CoordinateNumInput.vue';

const props = defineProps<{ modelValue: cvType.Vec4, uuid : string, propName : string  }>();

const tracker = trackersMap.get(props.uuid + props.propName);

const internalValue = reactive({
    x: props.modelValue.x,
    y: props.modelValue.y,
    z: props.modelValue.z,
    w: props.modelValue.w,
})

watch(
    tracker,
    (newVal) => {
        internalValue.x = newVal.x;
        internalValue.y = newVal.y;
        internalValue.z = newVal.z;
        internalValue.w = newVal.w;
    },
    { deep: true }
)

watch(
    internalValue,
    (newVal) => {
        if(newVal.x == tracker.value.x && newVal.y == tracker.value.y && newVal.z == tracker.value.z && newVal.w == tracker.value.w) return;
        tracker.value.x = newVal.x;
        tracker.value.y = newVal.y;
        tracker.value.z = newVal.z;
        tracker.value.w = newVal.w;
        ClientBridge.modifyTargetProp(props.uuid, props.propName, newVal);
    },
    { deep: true }
)

</script>

<template>
    <ElRow :gutter="10">
        <ElCol :span="6">
            <div class="vec-field">
                <CoordinateNumInput v-model="internalValue.x" color="#cb2600"></CoordinateNumInput>
            </div>
        </ElCol>
        <ElCol :span="6">
            <div class="vec-field">
                <CoordinateNumInput v-model="internalValue.y" color="#67a900"></CoordinateNumInput>
            </div>
        </ElCol>
        <ElCol :span="6">
            <div class="vec-field">
                <CoordinateNumInput v-model="internalValue.z" color="#2c7eed"></CoordinateNumInput>
            </div>
        </ElCol>
        <ElCol :span="6">
            <div class="vec-field">
                <CoordinateNumInput v-model="internalValue.w" color="#fabd2d"></CoordinateNumInput>
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
}
.vec-field .el-input-number .el-input-number__increase  {
    width: 16px;
}

.vec-field .el-input-number .el-input-number__decrease  {
    width: 16px;
}
</style>