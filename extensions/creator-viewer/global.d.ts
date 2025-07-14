import path from "path";

export { }

/** 枚举类型的单项 */
interface EnumItem {
    key: string;
    value: string | number;
}

declare global {


    /** 节点信息结构 */
    interface INodeInfo {
        /** 节点名称 */
        name: string;
        /** uuid */
        uuid: string;
        /** 子节点 */
        children: INodeInfo[];
        /** 是否激活 */
        active: boolean;
        /** 节点顺序索引 */
        siblingIndex: number;
        /** 当前在节点树种是否激活 */
        activeInHierarchy?: boolean;
        /** 父节点是否是激活状态 */
        parentActive?: boolean;
    }


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

    /** Creator Viewer 支持的属性类型 */
    type cvSupportType = "string" | "number" | "boolean" | "Vec2" | "Vec3" | "Vec4" | "Color" | "Enum" | "Size" | "Rect";

    /** 命名 cvType 支持的内置类型 */
    namespace cvType {
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


    ///////////////////////////////////////////////////////////////// Websocket Message Define
        /** 场景节点信息 */
        type ISceneData = INodeInfo[];

        /** Creator Viewer 消息定义 */
        type CreatorViewerMessage =
        | { type: 'scene'; data: ISceneData }
        | { type: 'node_remove'; data: INodeInfo };
}