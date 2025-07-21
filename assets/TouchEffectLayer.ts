import { _decorator, Component, EventTouch, instantiate, Node, Prefab, UITransform, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TouchEffectLayer')
export class TouchEffectLayer extends Component {
    @property({ visible: true, type: Prefab })
    protected _touchingEffectPrefab: Prefab;

    protected _uiTransform: UITransform;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_START, this.onLayerTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onLayerTouchCancel, this);
        this.node.on(Node.EventType.TOUCH_END, this.onLayerTouchCancel, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onLayerTouchCancel, this);

        this._uiTransform = this.node.getComponent(UITransform);
    }
    protected onLayerTouchCancel(event: EventTouch) {
        event.preventSwallow = true;

    }

    protected onLayerTouchStart(event: EventTouch) {
        event.preventSwallow = true;
        const node = instantiate(this._touchingEffectPrefab);
        this.node.addChild(node);

        node.setPosition(this._uiTransform.convertToNodeSpaceAR(v3(event.getUILocation().x, event.getUILocation().y, 1)));

        this.scheduleOnce(() => {
            node.destroy();
        },5);
    }
}


