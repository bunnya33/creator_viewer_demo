<script setup lang="ts">
import { ElInput, ElInputNumber } from 'element-plus';
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
      <ElRow :gutter="10">
        <ElCol :span="16">
          <div class="vec-field">
            <ElInputNumber class="vec-field" size="small" v-model="props.modelValue" controls-position="right"></ElInputNumber>
            </div>
        </ElCol>
    </ElRow>
</template>

<style lang="css">
.vec-field {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
}
</style>