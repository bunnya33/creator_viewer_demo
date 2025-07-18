<template>
    <div class="property-row">
        <div style="padding-left: 20px;max-width: 40%;">
            <ElText truncated :style="{ width: propNameWidth + 'px', marginleft:'3px' }"> {{ vprops.propName.startsWith("_") ? vprops.propName.substring(1) : vprops.propName }}</ElText>
        </div>
        <div class="resize-handle" @mousedown="startResize" @mouseleave="!propResizing && (hoveringIndex = null)"
            @mouseenter=" !propResizing && (hoveringIndex = vprops.index)">
            <span class="resize-indicator" :class="{ visible: hoveringIndex === vprops.index }">⋮</span>
        </div>
        <div class="property-value">
            <slot></slot>
        </div>
    </div>

</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, ref } from 'vue';

const propNameWidth = inject('propNameWidth', ref(120));
const propResizing = inject('propResizing', ref(false));
const hoveringIndex = ref<number | null>(null)

const props = defineProps<{ vprops : { propName : string; index : number;}}>();

let startX = 0;
let startLabelWidth = 0;

onBeforeUnmount(() => stopResize())

function startResize(e: MouseEvent) {
    propResizing.value = true
    startX = e.clientX
    startLabelWidth = propNameWidth.value
    document.addEventListener('mousemove', onResize)
    document.addEventListener('mouseup', stopResize)
}

function onResize(e: MouseEvent) {
    if (!propResizing.value) return
    propNameWidth.value = Math.max(60, startLabelWidth + (e.clientX - startX));
}

function stopResize() {
    propResizing.value = false
    hoveringIndex.value = null
    document.removeEventListener('mousemove', onResize)
    document.removeEventListener('mouseup', stopResize)
}

</script>

<style scoped>
.property-editor {
    display: flex;
    flex-direction: column;
}

.property-row {
    display: flex;
    align-items: center;
    padding: 4px 0;
    position: relative;
    /* height: 25px; */
}

.property-value {
    flex: 1;
    padding: 4px 8px;
}

.resize-handle {
    width: 8px;
    min-width: 8px;
    cursor: col-resize;
    background-color: transparent;
    height: 100%;
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
}
</style>