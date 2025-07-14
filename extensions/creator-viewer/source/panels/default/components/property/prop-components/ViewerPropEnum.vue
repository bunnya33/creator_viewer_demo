<script setup lang="ts">
import { ElCol, ElInputNumber, ElOption, ElRow, ElSelect } from 'element-plus';
import { reactive, ref, watch } from 'vue';

const props = defineProps<{ modelValue: cvType.Enum }>();
const emit = defineEmits(['update:modelValue']);

const internalValue = reactive({
  enumValue : props.modelValue.enumValue
})

watch(
    () => props.modelValue,
    (newVal) => {
        internalValue.enumValue = newVal.enumValue
        
    },
    { deep: true }
)

// setInterval(()=>{
//   console.log(internalValue);
// },5000)


</script>

<template>
  <ElSelect size="small" v-model="internalValue.enumValue" placeholder="Select">
    <ElOption v-for="item in modelValue.enumItems" :key="item.key" :label="item.key" :value="item.value" />
  </ElSelect>
</template>

<style lang="css">

</style>