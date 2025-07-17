<template>
    <ElCollapseItem :title="props.propData.type == 'node' ? props.propData.name : props.propData.name" :name="props.propData.uuid">
        <template #title="{ isActive }">
          <div :class="['title-wrapper', { 'is-active': isActive }]">
            <ElCheckbox @click.stop class="test" v-model="checkboxModel" @change="onCheckChange"></ElCheckbox>
            {{ props.propData.type == 'node' ? 'Node' : props.propData.name }}
            <ElIcon size="large" style="right: 5px; position: absolute; top: 13px;bottom: 3px;">
              <component :is="iconMap[props.propData.type]"></component>
            </ElIcon>
          </div>
        </template>
        <div v-for="(item, index) in propData.props.filter(prop=>prop.key !== '_name' && prop.key !== '_enabled')" :key="index">
            <ViewerPropBase :vprops="{ propName : item.key, index : index}">
                <component :is="getComponent(item.type)" v-bind="typeof item.value === 'object' ? item.value : {}" v-model="item.value" :uuid="propData.uuid" :propName="item.key" />
            </ViewerPropBase>
        </div>
    </ElCollapseItem>
</template>

<script setup lang="ts">
import { Document, Menu } from '@element-plus/icons-vue';
import { ElCheckbox, ElCollapseItem, ElIcon } from 'element-plus';
import { computed, inject, provide, ref } from 'vue';
import ViewerPropBase from './prop-components/ViewerPropBase.vue';
import ViewerPropBoolean from './prop-components/ViewerPropBoolean.vue';
import ViewerPropColor from './prop-components/ViewerPropColor.vue';
import ViewerPropEnum from './prop-components/ViewerPropEnum.vue';
import ViewerPropInput from './prop-components/ViewerPropInput.vue';
import ViewerPropNumInput from './prop-components/ViewerPropNumInput.vue';
import ViewerPropVec2 from './prop-components/ViewerPropVec2.vue';
import ViewerPropVec3 from './prop-components/ViewerPropVec3.vue';
import ViewerPropVec4 from './prop-components/ViewerPropVec4.vue';
import ViewerPropSize from './prop-components/ViewerPropSize.vue';
import { ClientBridge, isTrackedNodeActive } from '../../CreatorViewerMiddleware';

const props = defineProps<{propData : ICCObjectPropGroup}>();

const isChecked = ref(false);

const checkboxModel = computed({
  get() {
    return props.propData.type === 'node' ? isTrackedNodeActive.value : isChecked.value;
  },
  set(val: boolean) {
    if (props.propData.type === 'node') {
      isTrackedNodeActive.value = val;
    } else {
      isChecked.value = val;
    }
  }
});

function onCheckChange(value : boolean) {
    if(props.propData.type == "node") {
        ClientBridge.onNodeActiveChange(props.propData.uuid, value);
    }
    else {
        for(const prop of props.propData.props) {
            if(prop.key == "_enabled") {
                isChecked.value = prop.value;
                break;
            }
        }
    }
}

isChecked.value = false;
function refreshCheckedStatus() {
    if(props.propData.type == "node") {
        isChecked.value = true;
    }
    else {
        for(const prop of props.propData.props) {
            if(prop.key == "_enabled") {
                isChecked.value = prop.value;
                break;
            }
        }
    }
}
refreshCheckedStatus();

const propNameWidth = inject('propNameWidth', ref(120));
const propResizing = inject('propResizing', ref(false));

provide('propNameWidth', propNameWidth);
provide('propResizing', propResizing);

const iconMap : Record<string, any> = {
  "node": Menu,
  "component": Document,
}

function getComponent(type: cvSupportType) {
    if(type === 'string') return ViewerPropInput;
    if(type === 'number') return ViewerPropNumInput;
    else if(type === 'Vec3') return ViewerPropVec3;
    else if(type === 'Vec2') return ViewerPropVec2;
    else if(type === 'Vec4') return ViewerPropVec4;
    else if(type === 'Color') return ViewerPropColor;
    else if(type === 'Enum') return ViewerPropEnum;
    else if(type === 'boolean') return ViewerPropBoolean;
    else if(type === 'Size') return ViewerPropSize;

    return ViewerPropInput;
}

</script>

<style lang="scss">
.property-row {
    display: flex;
    align-items: center;
    padding: 4px 0;
    position: relative;
}

.title-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 4px;
  display: inline-block;
  position: relative;
    display: inline-block;
    flex: 1;
}

.test{
    .el-checkbox__inner {
    border-color: rgb(121, 121, 121) !important;
}
}

</style>