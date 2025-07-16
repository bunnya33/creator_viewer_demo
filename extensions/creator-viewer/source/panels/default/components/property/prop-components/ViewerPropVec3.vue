<script setup lang="ts">
import { ElCol, ElRow } from 'element-plus';
import { inject, reactive, ref, watch } from 'vue';
import CoordinateNumInput from '../../CoordinateNumInput.vue';
import { ClientBridge, trackersMap } from '../../../CreatorViewerMiddleware';

const props = defineProps<{ modelValue: cvType.Vec3, uuid : string, propName : string  }>();
// const selectedComponentsMap : Map<string, ICCObjectPropGroup> = new Map();
// // const compsMap = ref(selectedComponentsMap);

// const compsMap = inject(/* 注入名 */ 'selectedComps', /* 值 */ ref(selectedComponentsMap));

const tracker = trackersMap.get(props.uuid + props.propName);
console.log(`find in tracker vec3 `, tracker);

const internalValue = reactive({
    x: props.modelValue.x,
    y: props.modelValue.y,
    z: props.modelValue.z,
})

watch(
    tracker,
    (newVal) => {
        internalValue.x = newVal.x
        internalValue.y = newVal.y;
        internalValue.z = newVal.z
    },
    { deep: true }
)

watch(
    internalValue,
    (newVal) => {
        console.log(`on ${props.uuid}  ${props.propName}  vec3 changed `, newVal);
        if(newVal.x == tracker.value.x && newVal.y == tracker.value.y && newVal.z == tracker.value.z) return;
        ClientBridge.onTargetPropChange(props.uuid, props.propName, newVal);
    },
    { deep: true }
)

function onValueChange(...args) {
    console.log(`on value change `, args);
}
</script>

<template>
    <ElRow :gutter="10">
        <ElCol :span="8">
            <div class="vec-field">
                <CoordinateNumInput v-model="internalValue.x" color="#cb2600" @value-change="onValueChange.bind(null, 'x')"></CoordinateNumInput>
            </div>
        </ElCol>
        <ElCol :span="8">
            <div class="vec-field">
                <CoordinateNumInput v-model="internalValue.y" color="#67a900"></CoordinateNumInput>
            </div>
        </ElCol>
        <ElCol :span="8">
            <div class="vec-field">
                <CoordinateNumInput v-model="internalValue.z" color="#2c7eed"></CoordinateNumInput>
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