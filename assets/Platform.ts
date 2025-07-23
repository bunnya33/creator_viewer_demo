import { _decorator, Button, Component, director, instantiate, Node, Prefab, tween, v3, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Platform')
export class Platform extends Component {
    @property(Node)
    protected selectedNode : Node;

    @property(Prefab)
    protected testPrefab : Prefab;

    @property(Prefab)
    protected toucheLayer : Prefab;

    @property(Button)
    protected testButtonRef : Button;

    protected onLoad(): void {
        const node = instantiate(this.toucheLayer);
        director.addPersistRootNode(node);
    }

    onClickSendScene() {
        globalInfo.bridge.connect();
    }

    onClickDelete() {
        this.selectedNode.destroy();
    }

    onClickEditParent() {
        const node = this.node.getChildByName("PageView");
        // node.parent = undefined;
        // // // const testNode = instantiate(this.testPrefab)
        // this.selectedNode.insertChild(node, 0);
        tween(node).to(3,{ position : v3(100, 0, 1) }).start();
        
        // node.parent = this.selectedNode;

        // setTimeout(() => {
        //     director.loadScene('newscene');
        // }, 2000);
        // node.active= !node.active;
        // node.setSiblingIndex(Math.floor(Math.random() * 9));
    }
}


