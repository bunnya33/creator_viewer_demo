<script setup lang="ts">
import { ElCheckbox, ElInput } from 'element-plus';
import { onMounted } from 'vue';
import { ClientBridge } from '../../../CreatorViewerMiddleware';


const props = defineProps<{  modelValue: boolean, uuid: string, propName: string }>();
const emit = defineEmits(['update:modelValue']);

onMounted(()=>{

});



function onInput(value: boolean) {
  ClientBridge.onTargetPropChange(props.uuid, props.propName, value);
}

</script>

<template>
    <ElCheckbox size="default" v-model="props.modelValue" v-on:change="onInput"></ElCheckbox>
</template>

<style lang="css">

</style>