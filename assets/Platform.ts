import { _decorator, Component, director, instantiate, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Platform')
export class Platform extends Component {
    @property(Node)
    protected selectedNode : Node;

    @property(Prefab)
    protected testPrefab : Prefab;

    onClickSendScene() {
        globalInfo.bridge.connect();
    }

    onClickDelete() {
        this.selectedNode.destroy();
    }

    onClickEditParent() {
        const node = this.node.getChildByName("PageView");
        node.parent = undefined;
        // // const testNode = instantiate(this.testPrefab)
        // this.selectedNode.insertChild(node, 0);

        node.parent = this.selectedNode;

        // setTimeout(() => {
        //     director.loadScene('newscene');
        // }, 2000);
        // node.active= !node.active;
        // node.setSiblingIndex(Math.floor(Math.random() * 9));
    }
}


