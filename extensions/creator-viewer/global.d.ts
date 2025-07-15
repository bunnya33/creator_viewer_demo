import path from "path";

export { }

/** 枚举类型的单项 */
interface EnumItem {
    key: string;
    value: string | number;
}

declare global {
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
}