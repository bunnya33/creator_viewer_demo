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
    /** 当前在节点树种是否激活 */
    activeInHierarchy: boolean;
    /** 节点顺序索引 */
    siblingIndex: number;
    /** 节点是否是激活状态 */
    active?: boolean;
    /** 父节点是否是激活状态 */
    parentActive?: boolean;
    /** 父节点Uuid */
    parentUuid ?: string;
}

    const globalInfo : GlobalInfo;

    /** 场景节点信息 */
    type ISceneData = INodeInfo[];

    /** Creator Viewer 消息定义 */
    type CreatorViewerMessage =
    /** 场景信息 */
    { type: 'scene'; data: ISceneData }
    /** 节点移除 */
    | { type: 'node_destroyed'; data: string }
    /** 子节点顺序发生变化 */
    | { type: 'children_order_change'; data: { nodeUuid : string, childrenOrder : Record<string, number>} }
    /** 节点激活状态变化 */
    | { type: 'node_active_in_hierarchy_change'; data: { nodeUuid : string, activeInHierarchy : boolean } };
}