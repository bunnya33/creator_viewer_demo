import path from "path";

export { }

declare global {
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