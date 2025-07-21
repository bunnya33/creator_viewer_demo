<script setup lang="ts">
import { ElColorPicker, ElInput } from 'element-plus';
import { ref, watch } from 'vue';
import { ClientBridge } from '../../../CreatorViewerMiddleware';


const props = defineProps<{ modelValue: string, uuid: string, propName: string }>();

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

function hexToRgba(hex: string): { r: number; g: number; b: number; a: number } | null {
  // 去除前缀 #
  hex = hex.replace(/^#/, '');

  // 只支持 6 或 8 位十六进制
  if (!(hex.length === 6 || hex.length === 8)) return null;

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255;

  return { r, g, b, a };
}

function rgbaToHex(rgba: { r: number; g: number; b: number; a?: number }): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };

  const { r, g, b, a = 255 } = rgba;

  return (
    '#' +
    toHex(r) +
    toHex(g) +
    toHex(b) +
    (a < 255 ? toHex(a) : '')
  );
}


const colorString = ref("");
const inputColorString = ref("");

colorString.value = rgbaToHex(props.modelValue as any);
inputColorString.value = colorString.value;

watch(
    ()=>colorString,
    (newVal, oldVal) => {
        console.log('modelValue changed:', oldVal, '→', newVal);

        if (typeof (newVal) == "string") {
            inputColorString.value = newVal;
            ClientBridge.modifyTargetProp(props.uuid, props.propName, parseColorString(newVal));
        }
        else {
            ClientBridge.modifyTargetProp(props.uuid, props.propName, newVal);
        }
    }
)

function onValueChange(newVal) {
    if (typeof (newVal) == "string") {
        inputColorString.value = newVal;
        ClientBridge.modifyTargetProp(props.uuid, props.propName, hexToRgba(newVal));
    }
    else {
        ClientBridge.modifyTargetProp(props.uuid, props.propName, newVal);
    }
}

</script>

<template>
    <div class="vec-field">
        <ElColorPicker size="default" color-format="hex" @click.stop :teleported="true" :show-alpha="true" v-model="colorString"
            @active-change="onValueChange"></ElColorPicker>
        <ElInput style="max-width: 100px;" v-model="inputColorString">#ffffffff</ElInput>
    </div>
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
</style>