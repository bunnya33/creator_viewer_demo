import { WebSocketServer, WebSocket, AddressInfo } from 'ws';
import * as cvMiddleward from './CreatorViewerMiddleware';

const LISTEN_PORT = 33000;

export function startListener() {
    return tryStartListenServer(LISTEN_PORT);
}

async function tryStartListenServer(startPort: number, maxCheckPorts: number = startPort + 1000) {
    for (let port = startPort; port < maxCheckPorts; port++) {
        try {
            const wss = new WebSocket.Server({ port: port });
            await new Promise<void>((resolve, reject) => {
                wss.once('error', (err) => {
                    if ((err as any).code === 'EADDRINUSE') {
                        console.error(`❌ 端口 ${port} 被占用了，尝试其它端口`);

                    } else {
                        console.error('❌ WebSocket 服务器错误：', err);
                    }
                    reject();
                })
                wss.once('listening', () => {
                    console.log(`on listening ${port}`);
                    resolve();
                })
            })

            wss.on('connection', function connection(incomingClient) {
                console.log(`on client connected`);
                incomingClient.on('message', function (message) {
                    const msObj = JSON.parse(message.toString()) as CreatorViewerMessage;
                    messageHandler(msObj);
                    console.log(`in coming message`, message.toString());
                })
            })

            return wss;
        } catch (error) {
            console.log(error);
        }
    }
}


function messageHandler(messageData : CreatorViewerMessage) {
    const type = messageData.type;
    switch(type) {
        case 'scene': {
            cvMiddleward.onSceneTree(messageData.data);
        }
        break;
        case 'node_destroyed': {
            cvMiddleward.onNodeDestroyed(messageData.data);
        }
        break;
        case 'children_order_change' : {
            cvMiddleward.onChildrenOrderChange(messageData.data);
        }
        break;
        case 'node_active_in_hierarchy_change' : {
            cvMiddleward.onNodeActiveInHierarchyChange(messageData.data.nodeUuid, messageData.data.activeInHierarchy);
        }
    }
}