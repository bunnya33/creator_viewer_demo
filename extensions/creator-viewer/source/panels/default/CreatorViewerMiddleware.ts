import { ElTree } from "element-plus";
import { prototype } from "events";
import { ref } from "vue";
import { WebSocket } from 'ws';

export const treeRef = ref<InstanceType<typeof ElTree>>();
export const nodeTreeData = ref<INodeInfo[]>([]);
export const unExpandNodes = ref<string[]>([]);
export const client: { sender?: ClientSender } = {};


export function onNodeDestroyed(uuid: string) {
    const node = treeRef.value.getNode(uuid);
    node && treeRef.value.remove(node);
}

export function onNodeActiveChange(uuid: string, active: boolean) {
    const node = treeRef.value.getNode(uuid);
    if (!node) return;
    const nodeData = node.data as INodeInfo;
    nodeData.active = active;
    refreshNodeActiveStatus(nodeData, nodeData.parentActive);
}

export function onSceneTree(sceneData: ISceneData) {
    unExpandNodes.value.length = 0;
    nodeTreeData.value.length = 0;
    console.log(nodeTreeData);
    refreshNodeActiveStatus(sceneData[0], sceneData[0].active);
    nodeTreeData.value.push(...sceneData);
}

export function onChildrenOrderChange(data: { nodeUuid: string; childrenOrder: Record<string, number> }) {
    const node = treeRef.value.getNode(data.nodeUuid);
    if (!node) return;
    const nodeInfo = node.data as INodeInfo;
    const newOrderChildren = [...nodeInfo.children.sort((a, b) => {
        if (!Reflect.has(data.childrenOrder, a.uuid) || !Reflect.has(data.childrenOrder, b.uuid)) return -1;
        return data.childrenOrder[a.uuid] - data.childrenOrder[b.uuid];
    })]


    treeRef.value.updateKeyChildren(data.nodeUuid, newOrderChildren);
}

export function onChildRemoved(uuid: string) {
    const node = treeRef.value.getNode(uuid);
    if (!node) return;
    treeRef.value.remove(node);
}

export function onChildAdd(parentUuid: string, nodeInfo: INodeInfo) {
    const parentNode = treeRef.value.getNode(parentUuid);
    if (!parentNode) return;
    const parentInfo = parentNode.data as INodeInfo;
    refreshNodeActiveStatus(nodeInfo, parentInfo.active);
    parentInfo.children.push(nodeInfo);
}

//////////////////////////////////////// Message 2 Client
export class ClientBridge {
    /** 节点激活状态修改 */
    static onNodeActiveChange(nodeUuid: string, active: boolean) {
        client.sender({ type: 'change_node_active', data: { nodeUuid, active } });
    }
}

////////////////////////////////////////// 辅助函数
export function refreshNodeActiveStatus(node: INodeInfo, parentActiveInHierarchy: boolean) {
    node.parentActive = parentActiveInHierarchy;
    node.activeInHierarchy = node.active && parentActiveInHierarchy;
    node.children.forEach(child => {
        refreshNodeActiveStatus(child, node.activeInHierarchy);
    })
}
