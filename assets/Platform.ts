import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Platform')
export class Platform extends Component {
    start() {

    }

    update(deltaTime: number) {

    }

    onClickSendScene() {
        const ws = new WebSocket("ws://localhost:8999");
        ws.onopen = () => {
            console.log(`on websocket connect`);
            ws.send(JSON.stringify({
                data: [globalInfo.sceneTree],
                type: "scene"
            }));
        }
    }
}


