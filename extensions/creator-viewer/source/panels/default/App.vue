<script setup lang="ts">
import { ElButton, ElCheckbox, ElInput, ElNotification, ElText, ElTree, FilterNodeMethodFunction, TabsPaneContext, TreeInstance, TreeNode } from 'element-plus';
import { nextTick, onMounted, provide, ref, watch } from 'vue';
import ElCssLoader from './../../ElCSSLoader';
import ViewerPropCollapse from './components/property/ViewerPropCollapse.vue';
import { ClientBridge, nodeTreeData, trackPropGroupDatas, refreshNodeActiveStatus, treeRef } from './CreatorViewerMiddleware';
import { startListener } from './WSHandler';
import { AddressInfo } from 'ws';
import { Filter } from '@element-plus/icons-vue';


const root = ref<HTMLElement>();
const expandNodes = ref<string[]>([]);

const listeningPort = ref("等待监听端口...");
onMounted(async () => {
    ElCssLoader(root.value);

    const wss = await startListener();
    listeningPort.value = `已经开启监听端口${(wss.address() as AddressInfo).port}`;
})


function handleClick(pane: TabsPaneContext, event) {
    // console.log(args);
    ElNotification({
        type: "success",
        message: "做咩啊？",
        title: pane.paneName as string
    })
}


const handleNodeClick = (data) => {
    console.log(data);
    console.log(treeRef.value.getNode(data.uuid))
    ClientBridge.onNodeSelect(data.uuid);
}

const onHandleNodeCheckedChange = (checked: any, data: INodeInfo) => {
    console.log(`on checked`, checked, data);
    ClientBridge.onNodeActiveChange(data.uuid, checked);
    refreshNodeActiveStatus(data, data.parentActive);
}

function allowDropCheck(draggingNode, dropNode, type): boolean {
    if (dropNode.data.name == "platform") return false;
    return true;
}

function allowDragCheck(draggingNode): boolean {
    if (draggingNode.data.name == "platform") return false;
    return true;
}

function onHandleNodeExpand(nodeInfo: INodeInfo) {
    console.log(`on node expand change`, nodeInfo);
    expandNodes.value.push(nodeInfo.uuid);
}

function onHandleNodeCollapse(nodeInfo: INodeInfo) {
    console.log(`on node collapse change`, nodeInfo);
    const index = expandNodes.value.indexOf(nodeInfo.uuid);
    index != -1 && expandNodes.value.splice(index, 1);
}

function onHandleNodeDrop(drapNode) {
    const nodeInfo = drapNode;

    const newNode = treeRef.value.getNode(nodeInfo.data.uuid);
    const newParent = newNode.parent;
    nextTick(()=>{
        ClientBridge.onNodeParentOrSiblingIndexChange(newNode.data.uuid, newParent.data.uuid, newParent.childNodes.indexOf(newNode));
    })
}

function onClickExpandAll() {
    expandNodes.value.length = 0;
    treeRef.value?.store._getAllNodes().forEach((node) => {
        if(!expandNodes.value.includes(node.data.uuid)) expandNodes.value.push(node.data.uuid);
        node.expand();
    })
}

function onClickShowData() {
    console.log(`tree ref `, treeRef);
    console.log(`nodeTreeData `, nodeTreeData);
}


interface Tree {
  [key: string]: any
}

const filterText = ref('')

watch(filterText, (val) => {
  treeRef.value!.filter(val)
})

const filterNode: FilterNodeMethodFunction = (value: string, data: Tree) => {
  if (!value) return true
  console.log(data);
  return data.name.includes(value)
}

const defaultProps = {
    children: 'children',
    label: 'name',
}

// 暂定类型 Vec3 Vec4 Vec2 Color Number String Enum

// const testData = `[{"type":"node","name":"2025_gd_zkyk_icon","uuid":"7bjZGs3RBBLYqUMgltnsjS","props":[{"value":0,"type":"number","key":"_objFlags"},{"value":{"x":343.851,"y":0,"z":0},"type":"Vec3","key":"position"},{"value":{"x":1,"y":1,"z":1},"type":"Vec3","key":"scale"},{"value":{"x":0,"y":0,"z":0},"type":"Vec3","key":"eulerAngle"},{"value":"2025_gd_zkyk_icon","type":"string","key":"_name"}]},{"type":"component","name":"cc.UITransform","uuid":"3e4QgA2CBEsrUMpH3XEy9/","props":[{"value":59392,"type":"number","key":"_objFlags"},{"value":"","type":"string","key":"_name"},{"value":true,"type":"boolean","key":"_enabled"},{"value":{"width":215.5800018310547,"height":73.4000015258789},"type":"Object","key":"_contentSize"},{"value":{"x":0.21277483320476115,"y":0.49046320506284113},"type":"Vec2","key":"_anchorPoint"}]},{"type":"component","name":"sp.Skeleton","uuid":"bfS0roGB1Ox6ak0fHxwgXF","props":[{"value":59392,"type":"number","key":"_objFlags"},{"value":"","type":"string","key":"_name"},{"value":true,"type":"boolean","key":"_enabled"},{"value":{"enumItems":[{"key":"ZERO","value":0},{"key":"ONE","value":1},{"key":"SRC_ALPHA","value":2},{"key":"DST_ALPHA","value":3},{"key":"ONE_MINUS_SRC_ALPHA","value":4},{"key":"ONE_MINUS_DST_ALPHA","value":5},{"key":"SRC_COLOR","value":6},{"key":"DST_COLOR","value":7},{"key":"ONE_MINUS_SRC_COLOR","value":8},{"key":"ONE_MINUS_DST_COLOR","value":9},{"key":"SRC_ALPHA_SATURATE","value":10},{"key":"CONSTANT_COLOR","value":11},{"key":"ONE_MINUS_CONSTANT_COLOR","value":12},{"key":"CONSTANT_ALPHA","value":13},{"key":"ONE_MINUS_CONSTANT_ALPHA","value":14},{"key":0,"value":null},{"key":1,"value":null},{"key":2,"value":null},{"key":3,"value":null},{"key":4,"value":null},{"key":5,"value":null},{"key":6,"value":null},{"key":7,"value":null},{"key":8,"value":null},{"key":9,"value":null},{"key":10,"value":null},{"key":11,"value":null},{"key":12,"value":null},{"key":13,"value":null},{"key":14,"value":null}],"enumValue":2},"type":"Enum","key":"_srcBlendFactor"},{"value":{"enumItems":[{"key":"ZERO","value":0},{"key":"ONE","value":1},{"key":"SRC_ALPHA","value":2},{"key":"DST_ALPHA","value":3},{"key":"ONE_MINUS_SRC_ALPHA","value":4},{"key":"ONE_MINUS_DST_ALPHA","value":5},{"key":"SRC_COLOR","value":6},{"key":"DST_COLOR","value":7},{"key":"ONE_MINUS_SRC_COLOR","value":8},{"key":"ONE_MINUS_DST_COLOR","value":9},{"key":"SRC_ALPHA_SATURATE","value":10},{"key":"CONSTANT_COLOR","value":11},{"key":"ONE_MINUS_CONSTANT_COLOR","value":12},{"key":"CONSTANT_ALPHA","value":13},{"key":"ONE_MINUS_CONSTANT_ALPHA","value":14},{"key":0,"value":null},{"key":1,"value":null},{"key":2,"value":null},{"key":3,"value":null},{"key":4,"value":null},{"key":5,"value":null},{"key":6,"value":null},{"key":7,"value":null},{"key":8,"value":null},{"key":9,"value":null},{"key":10,"value":null},{"key":11,"value":null},{"key":12,"value":null},{"key":13,"value":null},{"key":14,"value":null}],"enumValue":4},"type":"Enum","key":"_dstBlendFactor"},{"value":{"r":255,"g":255,"b":255,"a":255},"type":"Color","key":"_color"},{"value":"default","type":"string","key":"defaultSkin"},{"value":"","type":"string","key":"defaultAnimation"},{"value":false,"type":"boolean","key":"_premultipliedAlpha"},{"value":1,"type":"number","key":"_timeScale"},{"value":0,"type":"number","key":"_preCacheMode"},{"value":0,"type":"number","key":"_cacheMode"},{"value":false,"type":"boolean","key":"_useTint"},{"value":false,"type":"boolean","key":"_debugMesh"},{"value":false,"type":"boolean","key":"_debugBones"},{"value":false,"type":"boolean","key":"_debugSlots"},{"value":false,"type":"boolean","key":"_enableBatch"},{"value":true,"type":"boolean","key":"loop"}]}]`;
// console.log(testData);
const propTestData: ICCObjectPropGroup[] = [];

const selectedComponentsMap: Map<string, ICCObjectPropGroup> = new Map();

propTestData.forEach(group => {
    selectedComponentsMap.set(group.name, group);
})

const comps = ref(propTestData)
const compsMap = ref(selectedComponentsMap);

provide(/* 注入名 */ 'selectedComps', /* 值 */ compsMap);

window['propTestData'] = comps;

</script>

<template style="height: 100%;">
    <div style="height: 100%; box-shadow: var(--el-border-color-light) 0px 0px 10px">
        <ElText>{{ listeningPort }}</ElText>
        <ElButton @click="onClickExpandAll">展开所有</ElButton>
        <ElButton @click="onClickShowData">显示数据</ElButton>
        <ElInput :prefix-icon="Filter" v-model="filterText" class="w-60 mb-2" placeholder="输入节点名称" />
        <el-splitter layout="vertical">
            <el-splitter-panel>
                <div class="demo-panel">
                    <div ref="root">
                        <ElTree ref="treeRef" style="width: 100%;" :data="nodeTreeData" :props="defaultProps"
                            :show-checkbox="false" :check-strictly="true" :indent="18" :highlight-current="true"
                            :defaultExpandAll="false" :check-on-click-node="false" :check-on-click-leaf="false"
                            :auto-expand-parent="false" :draggable="true" node-key="uuid" @node-click="handleNodeClick"
                            :allow-drop="allowDropCheck" :allowDrag="allowDragCheck"
                            @node-expand="onHandleNodeExpand" @node-collapse="onHandleNodeCollapse" @node-drop="onHandleNodeDrop"
                            :default-expanded-keys="expandNodes" :filter-node-method="filterNode">

                            <template #default="{ node, data }">
                                <ElCheckbox v-model="data.active" @click.stop
                                    @change="onHandleNodeCheckedChange($event, data)"
                                    :class="data.activeInHierarchy ? 'checkbox-active' : 'checkbox-inactive'" />
                                <span :style="{ color: !data.activeInHierarchy ? 'gray' : 'white' }">
                                    {{ node.label }}
                                </span>
                            </template>
                        </ElTree>
                    </div>

                </div>
            </el-splitter-panel>
            <el-splitter-panel>
                <div class="demo-panel">
                    <ViewerPropCollapse :items="trackPropGroupDatas" />
                </div>
            </el-splitter-panel>
        </el-splitter>
    </div>
</template>

<style>
.demo-tabs>.el-tabs__content {
    padding: 32px;
    color: #6b778c;
    font-size: 32px;
    font-weight: 600;
}

.demo-panel {
    align-items: center;
    justify-content: center;
    height: 100%;
}

.checkbox-active {
    --el-checkbox-checked-bg-color: #409EFF;
    /* 蓝色 */
    --el-checkbox-checked-input-border-color: #409EFF;
}

.checkbox-inactive {
    --el-checkbox-checked-bg-color: #888888;
    /* 灰色 */
    --el-checkbox-checked-input-border-color: #888888;
}
</style>