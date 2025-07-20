<script setup lang="ts">
import { ElInputNumber } from 'element-plus';
import { onMounted, reactive, Ref, watch } from 'vue';
import { ClientBridge, trackersMap } from '../../../CreatorViewerMiddleware';


const props = defineProps<{  modelValue: number, uuid: string, propName: string }>();

const tracker = trackersMap.get(props.uuid + props.propName) as Ref<number>;

const internalValue = reactive({
    value: props.modelValue,
})

watch(
    tracker,
    (newVal) => {
        internalValue.value = props.modelValue;
    },
    { deep: true }
)

watch(
    internalValue,
    (newVal) => {
        console.log(`on ${props.uuid}  ${props.propName}  vec2 changed `, newVal);
        if(newVal.value == tracker.value) return;
        tracker.value = newVal.value;
        ClientBridge.modifyTargetProp(props.uuid, props.propName, newVal.value);
    },
    { deep: true }
)


onMounted(()=>{
    // console.log(props);
});



function onInput(value: number) {
  ClientBridge.modifyTargetProp(props.uuid, props.propName, value);
}

</script>

<template>
      <ElRow :gutter="10">
        <ElCol :span="16">
          <div class="vec-field">
            <ElInputNumber :step="0.1" class="vec-field" size="small" v-model="internalValue.value" controls-position="right" @change="onInput"></ElInputNumber>
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
</style>