<script setup lang="ts">
import { ElColorPicker, ElInput } from 'element-plus';
import { onMounted, watch } from 'vue';
import { ClientBridge } from '../../../CreatorViewerMiddleware';


const props = defineProps<{  modelValue: string,uuid : string, propName : string }>();

function parseColorString(color: string) {
  const rgbaMatch = color.match(/^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/)

  if (!rgbaMatch) return null;

  const r = parseInt(rgbaMatch[1])
  const g = parseInt(rgbaMatch[2])
  const b = parseInt(rgbaMatch[3])
  const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : undefined

  if (a !== undefined) {
    return { r, g, b, a }
  } else {
    return { r, g, b }
  }
}

watch(
  () => props.modelValue,
  (newVal, oldVal) => {
    console.log('modelValue changed:', oldVal, '→', newVal);
    if(typeof(newVal) == "string") {
      ClientBridge.onTargetPropChange(props.uuid, props.propName,parseColorString(newVal) );
    }
    else {
      ClientBridge.onTargetPropChange(props.uuid, props.propName, newVal);
    }
  }
)

function onValueChange(...args) {
  console.log(`on color value change `, args);
}

</script>

<template>
    <ElColorPicker @click.stop :teleported="true" :show-alpha="true" v-model="props.modelValue" @active-change=""></ElColorPicker>
</template>

<style lang="css">

</style>