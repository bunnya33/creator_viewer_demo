<script setup lang="ts">
import { ElCol, ElRow } from 'element-plus';
import { inject, ref, watch } from 'vue';
import CoordinateNumInput from '../../CoordinateNumInput.vue';

const props = defineProps<{ modelValue: cvType.Vec3, uuid : string, propName : string  }>();
const selectedComponentsMap : Map<string, ICCObjectPropGroup> = new Map();
// const compsMap = ref(selectedComponentsMap);

const compsMap = inject(/* 注入名 */ 'selectedComps', /* 值 */ ref(selectedComponentsMap));

// 内部变动 -> 通知外部
watch(
  props.modelValue,
  (val) => {
    const prop = compsMap.value.get(props.uuid);
    console.log(compsMap);
    if(prop) {
        // console.log(prop);
        const propRefIndex = prop.props.findIndex((obj)=>obj.key == props.propName);
        if(propRefIndex != -1) {
            prop.props[propRefIndex].value.x = val.x;
            prop.props[propRefIndex].value.y = val.y;
            prop.props[propRefIndex].value.y = val.y;
        }
    }
  },
  { deep: true }
)
</script>

<template>
    <ElRow :gutter="10">
        <ElCol :span="8">
            <div class="vec-field">
                <CoordinateNumInput v-model="modelValue.x" color="#cb2600"></CoordinateNumInput>
            </div>
        </ElCol>
        <ElCol :span="8">
            <div class="vec-field">
                <CoordinateNumInput v-model="modelValue.y" color="#67a900"></CoordinateNumInput>
            </div>
        </ElCol>
        <ElCol :span="8">
            <div class="vec-field">
                <CoordinateNumInput v-model="modelValue.z" color="#2c7eed"></CoordinateNumInput>
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