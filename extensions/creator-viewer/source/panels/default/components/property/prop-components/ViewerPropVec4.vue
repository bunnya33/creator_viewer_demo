<script setup lang="ts">
import { ElCol, ElInputNumber, ElRow } from 'element-plus';
import { reactive, watch } from 'vue';
import CoordinateNumInput from '../../CoordinateNumInput.vue';

const props = defineProps<{ modelValue: cvType.Vec4 }>();
const emit = defineEmits(['update:modelValue'])

const internalValue = reactive({
    x: props.modelValue.x,
    y: props.modelValue.y,
    z: props.modelValue.z,
    w: props.modelValue.w,
})

watch(
    () => props.modelValue,
    (newVal) => {
        internalValue.x = newVal.x
        internalValue.y = newVal.y
        internalValue.z = newVal.z
        internalValue.w = newVal.w
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