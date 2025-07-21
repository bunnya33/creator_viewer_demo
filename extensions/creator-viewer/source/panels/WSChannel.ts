import { RawData, WebSocket, WebSocketServer } from "ws";


/** WebSocket 监听端口 */
const WS_LISTEN_SERVER_PORT = 33000;
/** WebSocket 监听端口最大值（如果有端口被占用，会继续向后重试到此值） */
const WS_LISTEN_SERVER_PORT_MAX = WS_LISTEN_SERVER_PORT + 1000;

export default class WSChannel implements IViewerChannel<number> {

    protected _websocketServer: WebSocketServer;
    protected _listenPort = 0;
    protected _messageHandler : (messageData : C2S_CreatorViewerMessage)=>void;
    protected _disconnectCallBack : ()=>void;

    protected _startResolver : (value : [boolean, number])=>void;

    protected _curClient : WebSocket;

    tryStartListener(): Promise<[boolean, number]> {
        return new Promise(async resolve => {
            this._startResolver = resolve;
            this.startListenPort(WS_LISTEN_SERVER_PORT);
        })
    }

    protected startListenPort(port : number) {
        if(port > WS_LISTEN_SERVER_PORT_MAX) {
            this._startResolver([false, -1]);
            return;
        }
        this._websocketServer = new WebSocketServer({ port : port });
        this._websocketServer.once('error', this.onServerError.bind(this));
        this._websocketServer.once('listening', this.onServerListening.bind(this));
        this._websocketServer.on('connection', this.onClientConnect.bind(this));
        this._listenPort = port;
    }

    protected onServerListening() {
        this._startResolver([true, this._listenPort]);
    }

    protected onServerError(error : Error) {
        if ((error as any).code === 'EADDRINUSE') {
            console.error(`❌ 端口 ${this._listenPort} 被占用了，尝试其它端口`);

        } else {
            console.error('❌ WebSocket 服务器错误：', error);
        }
        this.startListenPort(this._listenPort + 1);
    }

    protected onClientConnect(incomingClient : WebSocket) {
        this.closeClient();
        this._curClient = incomingClient;
        incomingClient.on('message', this.onReceiveMessage.bind(this));
        incomingClient.on('error', this.onClientError.bind(this));
        incomingClient.on('close', this.onClientClose.bind(this));
    }

    protected onReceiveMessage(message : RawData) {
        try{
            const msObj = JSON.parse(message.toString()) as C2S_CreatorViewerMessage;
            this._messageHandler?.(msObj);
        }
        catch(err) {
            console.log(` on receive message error `, err);
        }
    }

    protected closeClient() {
        if(!this._curClient) return;
        const client = this._curClient;
        this._curClient = undefined;
        client.off('message', this.onReceiveMessage.bind(this));
        client.off('error', this.onClientError.bind(this));
        client.off('close', this.onClientClose.bind(this));
        client.close();
    }

    protected onClientError() {
        this.closeClient();
        this._disconnectCallBack?.();
    }

    protected onClientClose() {
        this.closeClient();
        this._disconnectCallBack?.();
    }

    setMessageHandler(handler: (messageData: C2S_CreatorViewerMessage) => void, disconnectCallBack : ()=>void): void {
        this._messageHandler = handler;
        this._disconnectCallBack = disconnectCallBack;
    }

    closeChannel(): void {
        this._websocketServer?.close();
    }

    send(messageData: S2C_CreatorViewerMessage): void {
        this._curClient?.send(JSON.stringify(messageData));
    }
}