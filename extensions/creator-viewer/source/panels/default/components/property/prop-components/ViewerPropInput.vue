<script setup lang="ts">
import { ElInput } from 'element-plus';
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
    <ElInput size="default" :autosize="{ minRows: 1, maxRows: 3 }" type="textarea" v-model="props.modelValue" @input="onInput"></ElInput>
</template>

<style lang="css">

</style>