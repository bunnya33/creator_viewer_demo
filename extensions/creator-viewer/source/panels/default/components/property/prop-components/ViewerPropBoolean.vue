<script setup lang="ts">
import { ElCheckbox, ElInput } from 'element-plus';
import { onMounted } from 'vue';


const props = defineProps<{  modelValue: boolean }>();
const emit = defineEmits(['update:modelValue']);

onMounted(()=>{

});



function onInput(value: string) {
  emit('update:modelValue', value)
}

</script>

<template>
    <ElCheckbox size="default" v-model="props.modelValue"></ElCheckbox>
</template>

<style lang="css">

</style>