import { ElTree } from "element-plus";
import { ref } from "vue";

export const treeRef = ref<InstanceType<typeof ElTree>>();
export const nodeTreeData = ref<INodeInfo[]>([]);
export const unExpandNodes = ref<string[]>([]);

export function onNodeDestroyed(uuid: string) {
    const node = treeRef.value.getNode(uuid);
    node && treeRef.value.remove(node);
}

export function onNodeActiveInHierarchyChange(uuid: string, activeInHierarchy : boolean) {
    const node = treeRef.value.getNode(uuid);
    const nodeData = node.data as INodeInfo;
    nodeData.activeInHierarchy = activeInHierarchy;
    refreshNodeActiveStatus(nodeData, nodeData.parentActive);
}

export function onSceneTree(sceneData: ISceneData) {
    unExpandNodes.value.length = 0;
    nodeTreeData.value.length = 0;
    console.log(nodeTreeData);
    refreshNodeActiveStatus(sceneData[0], sceneData[0].activeInHierarchy);
    nodeTreeData.value.push(...sceneData);
}

export function onChildrenOrderChange(data: {nodeUuid: string;childrenOrder: Record<string, number>}) {
    const node = treeRef.value.getNode(data.nodeUuid);
    if(!node) return;
    const nodeInfo = node.data as INodeInfo;
    const newOrderChildren = [...nodeInfo.children.sort((a, b)=>{
        if(!Reflect.has(data.childrenOrder, a.uuid) ||!Reflect.has(data.childrenOrder, b.uuid))  return -1;
        return data.childrenOrder[a.uuid] - data.childrenOrder[b.uuid];
    })]


    treeRef.value.updateKeyChildren(data.nodeUuid, newOrderChildren);

    // nodeInfo.children = [...nodeInfo.children].sort((a, b)=>{
    //     if(!Reflect.has(data.childrenOrder, a.uuid) ||!Reflect.has(data.childrenOrder, b.uuid))  return -1;
    //     return data.childrenOrder[a.uuid] - data.childrenOrder[b.uuid];
    // });
    // console.log(`onChildrenOrderChange Result `,nodeInfo.children);
}

////////////////////////////////////////// 辅助函数
export function refreshNodeActiveStatus(node: INodeInfo, parentActive: boolean) {
    node.parentActive = parentActive;
    node.active = node.activeInHierarchy && parentActive;
    node.children.forEach(child => {
        refreshNodeActiveStatus(child, node.active);
    })
}
