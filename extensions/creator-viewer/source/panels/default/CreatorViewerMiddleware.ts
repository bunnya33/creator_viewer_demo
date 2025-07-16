import { ElTree } from "element-plus";
import { nextTick, Ref, ref } from "vue";

export const treeRef = ref<InstanceType<typeof ElTree>>();
export const nodeTreeData = ref<INodeInfo[]>([]);
export const unExpandNodes = ref<string[]>([]);
export const client: { sender?: ClientSender } = {};
export const trackPropGroupDatas = ref<ICCObjectPropGroup[]>([]);
export const trackersMap: Map<string, Ref<any>> = new Map();
export const isTrackedNodeActive = ref(true);

let trackedNodeUuid = "";

window['nodeTreeData'] = nodeTreeData;

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
    if(uuid == trackedNodeUuid) {
        console.log(`isTrackedNodeActive.value = ${active}`);
        isTrackedNodeActive.value = active;
    }
}

function cleanTrackers() {
    trackPropGroupDatas.value.length = 0;
    trackersMap.clear();
}

function cleanNodeTree() {
    unExpandNodes.value.length = 0;
    nodeTreeData.value.length = 0;
}

export function onClientDisconnect() {
    cleanNodeTree();
    cleanTrackers();
}

export function onSceneTree(sceneData: ISceneData) {
    cleanNodeTree();
    console.log(nodeTreeData);
    refreshNodeActiveStatus(sceneData[0], sceneData[0].active);
    nextTick(() => {
        nodeTreeData.value.push(...sceneData);
    })
}

export function onChildrenOrderChange(data: { nodeUuid: string; childrenOrder: Record<string, number> }) {
    const node = treeRef.value.getNode(data.nodeUuid);
    if (!node) return;
    const nodeInfo = node.data as INodeInfo;
    const newOrderChildren = [...nodeInfo.children.sort((a, b) => {
        if (!Reflect.has(data.childrenOrder, a.uuid) || !Reflect.has(data.childrenOrder, b.uuid)) return -1;
        return data.childrenOrder[a.uuid] - data.childrenOrder[b.uuid];
    })];

    treeRef.value.updateKeyChildren(data.nodeUuid, newOrderChildren);
}

export function onChildRemoved(uuid: string) {
    const node = treeRef.value.getNode(uuid);
    if (!node) return;
    const parent = node.parent;
    parent.removeChild(node);
    // treeRef.value.remove(node);
    // console.log(treeRef.value.getNode(uuid));
    // console.log(`parent data : `, [...parent.data.children]);
}

export function onChildAdd(parentUuid: string, nodeInfo: INodeInfo) {
    const parentNode = treeRef.value.getNode(parentUuid);
    if (!parentNode) return;
    const parentInfo = parentNode.data as INodeInfo;
    refreshNodeActiveStatus(nodeInfo, parentInfo.active);
    parentInfo.children.push(nodeInfo);
}

export function onAttrsTrack(groups: ICCObjectPropGroup[]) {
    trackPropGroupDatas.value.length = 0;
    trackersMap.clear();
    groups.forEach(prop => {
        if(prop.type == 'node') {
            trackedNodeUuid = prop.uuid;
                const node = treeRef.value.getNode(prop.uuid);
                if (!node) return;
                const nodeData = node.data as INodeInfo;
                isTrackedNodeActive.value = nodeData.active;
        }
        prop.props.forEach(propObj => {
            trackersMap.set(prop.uuid + propObj.key, ref(propObj.value));
        })
    })
    nextTick(() => {
        trackPropGroupDatas.value.push(...groups);
    })
    // const parentNode = treeRef.value.getNode(parentUuid);
    // if (!parentNode) return;
    // const parentInfo = parentNode.data as INodeInfo;
    // refreshNodeActiveStatus(nodeInfo, parentInfo.active);
    // parentInfo.children.push(nodeInfo);
}

export function onTrackedPropChanged(targetUuid: string, propName: string, newValue: any) {
    const trackerProp = trackersMap.get(targetUuid + propName);
    if (trackerProp) {
        trackerProp.value = newValue;
    }
}

//////////////////////////////////////// Message 2 Client
export class ClientBridge {
    /** 节点激活状态修改 */
    static onNodeActiveChange(nodeUuid: string, active: boolean) {
        client.sender?.({ type: 'change_node_active', data: { nodeUuid, active } });
    }

    static onNodeParentOrSiblingIndexChange(nodeUuid: string, parentUuid: string, siblingIndex: number) {
        client.sender?.({ type: 'node_parent_or_sibling_index_change', data: { nodeUuid, parentUuid, siblingIndex } });
    }

    static onNodeSelect(nodeUuid: string) {
        client.sender?.({ type: 'select_node', data: nodeUuid });
    }

    static onTargetPropChange(targetUuid: string, propName: string, newValue: any) {
        client.sender?.({ type: 'on_tracker_prop_change', data: { targetUuid, propName, value: newValue } })
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
