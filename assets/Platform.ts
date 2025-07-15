import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Platform')
export class Platform extends Component {
    @property(Node)
    protected selectedNode : Node;

    onClickSendScene() {
        globalInfo.bridge.connect();
    }

    onClickDelete() {
        this.selectedNode.destroy();
    }

    onClickEditParent() {
        const node = this.node.getChildByName("PageView");
        node.active= !node.active;
        // node.setSiblingIndex(Math.floor(Math.random() * 9));
    }
}


