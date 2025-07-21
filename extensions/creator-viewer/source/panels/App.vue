<script setup lang="ts">
import { onMounted } from 'vue';
import Viewer from './default/Viewer.vue';
import ElCssLoader from '../ElCSSLoader';

onMounted(()=>{
    //@ts-ignore
    ElCssLoader(document.querySelector('dock-frame')?.shadowRoot?.querySelector('panel-frame')?.shadowRoot);
})

</script>

<template style="height: 100%;">
    <Viewer></Viewer>
</template>