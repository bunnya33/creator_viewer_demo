<script setup lang="ts">
import { ElColorPicker, ElInput } from 'element-plus';
import { onMounted } from 'vue';


const props = defineProps<{  modelValue: string }>();
const emit = defineEmits(['update:modelValue']);

onMounted(()=>{
    // console.log(props);
});



function onInput(value: string) {
  emit('update:modelValue', value)
}

</script>

<template>
    <ElColorPicker @click.stop :teleported="true" :show-alpha="true" v-model="props.modelValue"></ElColorPicker>
</template>

<style lang="css">

</style>