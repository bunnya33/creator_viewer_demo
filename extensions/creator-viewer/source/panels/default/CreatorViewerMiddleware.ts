import { ElTree } from "element-plus";
import { nextTick, Ref, ref } from "vue";
import { ViewerChannel } from "../ViewerChannel";

export const treeRef = ref<InstanceType<typeof ElTree>>();
export const propCollapseActiveNames = ref<string[]>([]);
export const nodeTreeData = ref<INodeInfo[]>([]);
export const unExpandNodes = ref<string[]>([]);
export const trackPropGroupDatas = ref<ICCObjectPropGroup[]>([]);
export const trackersMap: Map<string, Ref<any>> = new Map();
export const isTrackedNodeActive = ref(true);

export const viewerChannel = new ViewerChannel();
viewerChannel.setMessageHandler(messageHandler, onClientDisconnect);

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

function onClientDisconnect() {
    cleanNodeTree();
    cleanTrackers();
}

export function onSceneTree(sceneData: ISceneData) {
    cleanNodeTree();
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
    const activeNames : string[] = [];
    propCollapseActiveNames.value.length = 0;
    groups.forEach(prop => {
        if(prop.type == 'node') {
            trackedNodeUuid = prop.uuid;
                const node = treeRef.value.getNode(prop.uuid);
                if (!node) return;
                const nodeData = node.data as INodeInfo;
                isTrackedNodeActive.value = nodeData.active;
        }

        propCollapseActiveNames.value.push(prop.uuid);
        prop.props.forEach(propObj => {
            trackersMap.set(prop.uuid + propObj.key, ref(propObj.value));
        })
    })

    nextTick(() => {
        trackPropGroupDatas.value.push(...groups);
    })
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
    static setNodeActive(nodeUuid: string, active: boolean) {
        viewerChannel.send({ type: 'change_node_active', data: { nodeUuid, active } });
    }

    static setNodeParentOrSiblingIndex(nodeUuid: string, parentUuid: string, siblingIndex: number) {
        viewerChannel.send({ type: 'node_parent_or_sibling_index_change', data: { nodeUuid, parentUuid, siblingIndex } });
    }

    static selectNode(nodeUuid: string) {
        viewerChannel.send({ type: 'select_node', data: nodeUuid });
    }

    static modifyTargetProp(targetUuid: string, propName: string, newValue: any) {
        viewerChannel.send({ type: 'on_tracker_prop_change', data: { targetUuid, propName, value: newValue } })
    }
}

type MessageHandler = () => void

const queue = ref<MessageHandler[]>([])
let isProcessing = false

function processQueue() {
  if (isProcessing || queue.value.length === 0) return

  isProcessing = true
  const task = queue.value.shift()

  task?.()

  nextTick(() => {
    isProcessing = false
    processQueue()
  })
}

function enqueueMessage(handler: MessageHandler) {
  queue.value.push(handler)
  processQueue()
}

function messageHandler(messageData : C2S_CreatorViewerMessage) {
    const type = messageData.type;
    switch(type) {
        case 'scene': {
            onSceneTree(messageData.data);
        }
        break;
        case 'node_destroyed': {
            onNodeDestroyed(messageData.data);
        }
        break;
        case 'children_order_change' : {
            enqueueMessage(() => {
                onChildrenOrderChange(messageData.data);
            })
        }
        break;
        case 'node_active_change' : {
            onNodeActiveChange(messageData.data.nodeUuid, messageData.data.active);
        }
        break;        
        case 'child_removed' : {
            onChildRemoved(messageData.data);
        }
        break;
        case 'child_added' : {
            onChildAdd(messageData.data.parentUuid, messageData.data.childInfo);
        }
        break;
        case 'track_attrs' : {
            onAttrsTrack(messageData.data);
        }
        break;
        case 'on_tracked_prop_change': {
            onTrackedPropChanged(messageData.data.targetUuid, messageData.data.propName, messageData.data.newValue);
        }
        break;
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
