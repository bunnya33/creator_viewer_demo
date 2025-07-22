import path from "path";

export { }

/** 枚举类型的单项 */
interface EnumItem {
    name: string;
    value: string | number;
}

declare global {
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

    type ClientSender = (data : S2C_CreatorViewerMessage)=>void;

    interface IViewerMiddleWare {

    }

        /** 抽象出的ViewerChannel接口，Channel可以是WebSocket，也可以是Electron的ipc，或者是Web端同意上下文的直接传递，也可以是浏览器插件的Port  */
    interface IViewerChannel<T> {
        /**
         * 尝试启动监听,异步函数，返回[是否成功，端口号]
         */
        tryStartListener() : Promise<[boolean, T]>;
        /**
         * 设置消息处理Handler
         * @param handler 消息处理的函数
         * @param disconnectCallBack 客户端断线回调
         */
        setMessageHandler(handler : (messageData : C2S_CreatorViewerMessage)=>void, disconnectCallBack : ()=>void):void;
        /** 关闭通道 */
        closeChannel() : void;
        /** 发送数据到前端 */
        send(messageData : S2C_CreatorViewerMessage) : void;
    }
}