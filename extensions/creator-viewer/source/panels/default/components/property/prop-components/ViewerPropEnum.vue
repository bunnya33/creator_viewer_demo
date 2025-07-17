<script setup lang="ts">
import { ElCol, ElInputNumber, ElOption, ElRow, ElSelect } from 'element-plus';
import { reactive, ref, watch } from 'vue';
import { ClientBridge } from '../../../CreatorViewerMiddleware';

const props = defineProps<{ modelValue: cvType.Enum, uuid: string, propName: string }>();
const emit = defineEmits(['update:modelValue']);

const internalValue = reactive({
  enumValue : props.modelValue.enumValue
})

watch(
    () => internalValue,
    (newVal) => {
      console.log(`on enum value change`);
        internalValue.enumValue = newVal.enumValue
        ClientBridge.onTargetPropChange(props.uuid, props.propName, newVal.enumValue);
    },
    { deep: true }
)

// setInterval(()=>{
//   console.log(internalValue);
// },5000)


</script>

<template>
  <ElSelect size="small" v-model="internalValue.enumValue" placeholder="Select">
    <ElOption v-for="item in modelValue.enumItems" :key="item.name" :label="item.name" :value="item.value" />
  </ElSelect>
</template>

<style lang="css">

</style>