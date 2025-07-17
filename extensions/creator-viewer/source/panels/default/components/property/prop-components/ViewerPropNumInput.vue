<script setup lang="ts">
import { ElInput, ElInputNumber } from 'element-plus';
import { onMounted } from 'vue';
import { ClientBridge } from '../../../CreatorViewerMiddleware';


const props = defineProps<{  modelValue: string, uuid: string, propName: string }>();

onMounted(()=>{
    // console.log(props);
});



function onInput(value: number) {
  ClientBridge.onTargetPropChange(props.uuid, props.propName, value);
}

</script>

<template>
      <ElRow :gutter="10">
        <ElCol :span="16">
          <div class="vec-field">
            <ElInputNumber :step="0.1" class="vec-field" size="small" v-model="props.modelValue" controls-position="right" @change="onInput"></ElInputNumber>
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