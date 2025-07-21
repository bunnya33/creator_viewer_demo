<script setup lang="ts">
import { ElCheckbox } from 'element-plus';
import { reactive, watch } from 'vue';
import { ClientBridge, trackersMap } from '../../../CreatorViewerMiddleware';


const props = defineProps<{  modelValue: boolean, uuid: string, propName: string }>();
const emit = defineEmits(['update:modelValue']);
const tracker = trackersMap.get(props.uuid + props.propName);

const internalValue = reactive({
    value: props.modelValue
})

watch(
    tracker,
    (newVal) => {
        internalValue.value = newVal
    },
    { deep: true }
)

watch(
    internalValue,
    (newVal) => {
        if(newVal == tracker.value) return;
        tracker.value = newVal;
        ClientBridge.modifyTargetProp(props.uuid, props.propName, newVal);
    },
    { deep: true }
)

function onInput(value: boolean) {
  ClientBridge.modifyTargetProp(props.uuid, props.propName, value);
}

</script>

<template>
    <ElCheckbox size="default" v-model="internalValue.value" v-on:change="onInput"></ElCheckbox>
</template>

<style lang="css">

</style>