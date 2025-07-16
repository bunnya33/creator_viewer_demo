import { WebSocketServer, WebSocket, AddressInfo } from 'ws';
import * as cvMiddleward from './CreatorViewerMiddleware';
import { nextTick, ref } from 'vue';

const LISTEN_PORT = 33000;

export function startListener() {
    return tryStartListenServer(LISTEN_PORT);
}

type MessageHandler = () => void

const queue = ref<MessageHandler[]>([])
let isProcessing = false

function processQueue() {
  if (isProcessing || queue.value.length === 0) return

  isProcessing = true
  const task = queue.value.shift()

  task?.()

  nextTick(() => {
    isProcessing = false
    processQueue()
  })
}

function enqueueMessage(handler: MessageHandler) {
  queue.value.push(handler)
  processQueue()
}

let clientSocket : WebSocket;

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
                    const msObj = JSON.parse(message.toString()) as C2S_CreatorViewerMessage;
                    console.log(`in coming message  ${Date.now()}   `, message.toString());
                    // enqueueMessage(()=>{
                    //     messageHandler(msObj)
                    // })
                    messageHandler(msObj)
                })

                incomingClient.on('error', ()=>{
                    cvMiddleward.onClientDisconnect();
                    clientSocket = undefined;
                })

                incomingClient.on('close', ()=>{
                    cvMiddleward.onClientDisconnect();
                    clientSocket = undefined;
                })

                clientSocket = incomingClient;
            })

            return wss;
        } catch (error) {
            console.log(error);
        }
    }
}
let msgId = 0;
function sendMessageToClient(data : S2C_CreatorViewerMessage) {
    console.log(`send data to client `, clientSocket, data);
    if(!clientSocket) return;
    clientSocket.send(JSON.stringify(data));
}

cvMiddleward.client.sender = sendMessageToClient;


function messageHandler(messageData : C2S_CreatorViewerMessage) {
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
            enqueueMessage(() => {
                cvMiddleward.onChildrenOrderChange(messageData.data);
            })
        }
        break;
        case 'node_active_change' : {
            cvMiddleward.onNodeActiveChange(messageData.data.nodeUuid, messageData.data.active);
        }
        break;        
        case 'child_removed' : {
            cvMiddleward.onChildRemoved(messageData.data);
        }
        break;
        case 'child_added' : {
            cvMiddleward.onChildAdd(messageData.data.parentUuid, messageData.data.childInfo);
        }
        break;
        case 'track_attrs' : {
            cvMiddleward.onAttrsTrack(messageData.data);
        }
        break;
        case 'on_tracked_prop_change': {
            cvMiddleward.onTrackedPropChanged(messageData.data.targetUuid, messageData.data.propName, messageData.data.newValue);
        }
        break;
    }
}