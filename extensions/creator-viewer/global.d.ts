import path from "path";

export { }

/** 枚举类型的单项 */
interface EnumItem {
    key: string;
    value: string | number;
}

declare global {
    /** 命名 cvType 支持的内置类型 */
    namespace cvType {
        interface Size {
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

    type ClientSender = (data : S2C_CreatorViewerMessage)=>void;
}