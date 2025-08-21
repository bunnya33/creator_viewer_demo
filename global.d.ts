import { CreatorViewerDatas } from "./assets/CreatorViewer";
declare global {
    type NodeType = "node" | "canvas" | "camera" | "sprite" | "particle2D" | "skeleton2D" | "label" | "button" | "graphics" | "scene" | "scroll_view" | "edit_box" | "toggle" | "toggle_group" | "mask" | "transform" | "slider" | "tiled_map" | "widget" | "webview" | "video_player" | "page_view" | "rich_edit"  | "layout" | "progress_bar" | "component";
    
    /** 节点信息结构 */
    interface INodeInfo {
        /** 节点名称 */
        name: string;
        /** uuid */
        uuid: string;
        /** 子节点 */
        children: INodeInfo[];
        /** 当前节点是否是可视状态(本地维护) */
        activeInHierarchy?: boolean;
        /** 节点顺序索引 */
        siblingIndex: number;
        /** 节点是否是激活状态 */
        active: boolean;
        /** 父节点是否是激活状态 */
        parentActive?: boolean;
        /** 父节点Uuid */
        parentUuid?: string;
        /** 节点类型 */
        type : NodeType;
    }

    /** 枚举类型的单项 */
    interface EnumItem {
        name: string;
        value: string | number;
    }

        /** 命名 cvType 支持的内置类型 */
    namespace cvType {
        interface Size {
            width : number;
            height : number;
        }

        interface Rect {
            x : number;
            y : number;
            width : number;
            height : number;
        }

        interface Vec2 {
            x: number;
            y: number;
        }

        interface Vec3 {
            x: number;
            y: number;
            z: number;
        }

        interface Vec4 {
            x: number;
            y: number;
            z: number;
            w: number;
        }

        interface Color {
            r: number;
            g: number;
            b: number;
            a: number;
        }

        /** 枚举类型 */
        interface Enum {
            enumItems: EnumItem[];
            enumValue: string | number;
        }
    }


    const creatorViewer: CreatorViewerDatas;

    /** 场景节点信息 */
    type ISceneData = INodeInfo[];

    interface ICCObjectProp {
        /** 属性名称 */
        key: string;
        /** 属性类型 */
        type: cvSupportType;
        /** 值 */
        value?: any;
    }

    /** CCObject 属性组 */
    interface ICCObjectPropGroup {
        /** 属性组所属的节点或组件名称 */
        name: string;
        /** 属性组所属的Object类型 */
        type: "component" | "node";
        /** 所属对象的uuid（用于反向查找节点或组件） */
        uuid: string;
        /** CCObject 所拥有的属性 */
        props: ICCObjectProp[];
    }

    interface INodeTypeData {
        isValid : boolean;
        nodeName : string;
        nodeUuid : string;
    }

    interface IComponentTypeData {
        isValid : boolean;
        nodeUuid : string;
        componentName : string;
        nodeName : string;
    }

    interface IAssetTypeData {
        className: string;
        assetName: string;
    }

    /** Creator Viewer 支持的属性类型 */
    type cvSupportType = "string" | "number" | "boolean" | "Object" | "Vec2" | "Vec3" | "Vec4" | "Color" | "Enum" | "Size" | "Rect" | "Component" | "Node" | "Asset";

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
        /** 节点激活状态变化 */
        | { type: 'track_attrs'; data: ICCObjectPropGroup[] }
        /** 节点激活状态变化 */
        | { type: 'on_tracked_prop_change'; data: { targetUuid : string, propName : string, newValue : any }}
        /** 节点被选中 */
        | { type: 'on_node_selected_by_viewer'; data: { targetUuid : string }}
        /** 客户端存储数据 */
        | { type: 'on_client_storage_datas'; data : any[] }

    type S2C_CreatorViewerMessage =
        { type: 'change_node_active'; data: { nodeUuid: string, active: boolean } }
        | { type: 'node_parent_or_sibling_index_change'; data: { nodeUuid: string, parentUuid: string, siblingIndex: number } }
        /** 选择某个节点 */
        | { type: 'select_node'; data: string }
        | { type: 'on_tracker_prop_change', data: { targetUuid: string, propName: string, value: any } }
        | { type: 'print_target_by_uuid', data: { targetUuid: string } }
        | { type: 'pull_client_storage', data: {} };
}