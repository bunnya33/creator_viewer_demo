import { v2 } from "cc";
import { GlobalInfo } from "./assets/CreatorViewer";
declare global {
    /** 节点信息结构 */
    interface INodeInfo {
        /** 节点名称 */
        name: string;
        /** uuid */
        uuid: string;
        /** 子节点 */
        children: INodeInfo[];
        /** 当前节点是否是可视状态(本地维护) */
        activeInHierarchy ?: boolean;
        /** 节点顺序索引 */
        siblingIndex: number;
        /** 节点是否是激活状态 */
        active : boolean;
        /** 父节点是否是激活状态 */
        parentActive?: boolean;
        /** 父节点Uuid */
        parentUuid?: string;
    }

    const globalInfo: GlobalInfo;

    /** 场景节点信息 */
    type ISceneData = INodeInfo[];

    /** Creator Viewer 消息定义 */
    type C2S_CreatorViewerMessage =
        /** 场景信息 */
        { type: 'scene'; data: ISceneData }
        /** 节点移除 */
        | { type: 'node_destroyed'; data: string }
        /** 子节点顺序发生变化 */
        | { type: 'children_order_change'; data: { nodeUuid: string, childrenOrder: Record<string, number> } }
        /** 子节点被移除 */
        | { type: 'child_removed'; data: string }
        /** 子节点被移除 */
        | { type: 'child_added'; data: { parentUuid: string, childInfo: INodeInfo } }
                /** 节点激活状态变化 */
        | { type: 'node_active_change'; data: { nodeUuid: string, active: boolean } }


    type S2C_CreatorViewerMessage = 
        { type : 'change_node_active', data : { nodeUuid : string, active : boolean} } |
        { type : 'change_siblingIndex', data : { nodeUuid : string, active : boolean} };
}