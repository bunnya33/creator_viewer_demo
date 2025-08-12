import { _decorator, Asset, BlockInputEvents, Button, Canvas, CCObject, Color, Component, Director, director, EditBox, EventTouch, gfx, Graphics, HorizontalTextAlignment, isValid, js, Label, Layout, Node, Overflow, Rect, Scene, size, Size, Sprite, sys, Toggle, tween, Tween, UIOpacity, UIRenderer, UITransform, v2, v3, ValueType, Vec2, Vec3, Vec4, Widget } from 'cc';
import { EDITOR } from 'cc/env';

const { ccclass, property, requireComponent } = _decorator;

let srclog = console.log;
let srcLogFunc = srclog;

export class Logger {
    static logEnable = false;
    static logSwitch() {
        this.logEnable = !this.logEnable;
        srcLogFunc = this.logEnable ? srclog : () => { };
    }

    static get log() {
        return srcLogFunc.bind(console);
    }
}

window['Logger'] = Logger;

function logPrefix() {
    const dateTime = new Date();
    return `${dateTime.getFullYear()}/${dateTime.getMonth() + 1}/${dateTime.getDate()} ${dateTime.getHours()}:${dateTime.getMinutes()}:${dateTime.getSeconds()} ${dateTime.getMilliseconds().toString().padStart(3, "0")}`;
}

/** 属性修改类型 */
enum PROP_EDIT_TYPE {
    /** 普通属性修改 */
    PROP,
    /** 结构监听 转为 Proxy */
    OBJECT,
    /** 重写func */
    FUNC_HOOK,
    /** 属性存在setter（比如  _prop 存在 名为 prop的setter） */
    SETTER,
    /** 资源、节点、或者组件类型 */
    CCOBJECT,
}

interface IPropEditRecordItem {
    type: PROP_EDIT_TYPE,
    original: TypedPropertyDescriptor<any> | Function;
    target?: any;
}

function getValueTypeName(value: ValueType): cvSupportType {
    if (value instanceof Vec3) {
        return 'Vec3';
    }
    else if (value instanceof Vec2) {
        return 'Vec2';
    }
    else if (value instanceof Vec4) {
        return 'Vec4';
    }
    else if (value instanceof Rect) {
        return 'Rect';
    }
    else if (value instanceof Size) {
        return 'Size';
    }


    return 'Object';
}

interface IPropCopy {
    value: any;
    type: cvSupportType;
    enumList?: { name: string, value: number }[];
    hasSetter: boolean;
}

export class ViewBridgeBase extends Component {
    protected _websocket: WebSocket;
    protected _connected: boolean = false;

    protected _serverAddress: string = "";

    connect(address: string) {
        try {
            this._serverAddress = address;
            this._websocket = new WebSocket(`ws://${address}`);
            this._websocket.onopen = this.onConnected.bind(this);
            this._websocket.onmessage = this.onReceiveMessage.bind(this);
            this._websocket.onclose = this.onSocketError.bind(this);
            this._websocket.onerror = this.onSocketError.bind(this);
        } catch (error) {
            console.log(error);
        }
    }

    close(mannual: boolean = false) {
        this.unschedule(this.reconnect);
        this._connected = false;
        if (this._websocket) {
            const websocket = this._websocket;

            this._websocket = undefined;
            websocket.close();
            websocket.onopen = undefined;
            websocket.onmessage = undefined;
            websocket.onclose = undefined;
            websocket.onerror = undefined;
        }
    }

    protected onSocketError() {
        console.log(`onSocketError  `);
        this.close();
        this.scheduleOnce(this.reconnect, 1);
    }

    protected reconnect() {
        this.connect(this._serverAddress);
    }

    protected onConnected() {
        Logger.log(`on websocket connect 建立连接，发送节点树数据`);
        this._connected = true;
        this.syncScene();
    }

    protected sendData(viewerData: C2S_CreatorViewerMessage) {
        if (!this._connected) return;
        this._websocket?.send(JSON.stringify(viewerData));
    }

    protected onReceiveMessage(ev: MessageEvent) {
        try {
            const data = JSON.parse(ev.data) as S2C_CreatorViewerMessage;
            const type = data.type;
            Logger.log(`receive message `, data);
            switch (type) {
                case 'change_node_active': {
                    const node = creatorViewer.allNodesMap.get(data.data.nodeUuid);
                    if (node) {
                        node.active = data.data.active;
                    }
                }
                    break;
                case 'node_parent_or_sibling_index_change': {
                    const node = creatorViewer.allNodesMap.get(data.data.nodeUuid);
                    const newParentNode = creatorViewer.allNodesMap.get(data.data.parentUuid);
                    if (node && newParentNode) {
                        newParentNode.insertChild(node, data.data.siblingIndex);
                    }
                }
                    break;
                case 'select_node': {
                    this.selectNodeByUUid(data.data);
                }
                    break;
                case 'on_tracker_prop_change': {
                    const tracker = creatorViewer.trackers.get(data.data.targetUuid);
                    if (tracker) {
                        tracker.modifyTrackProp(data.data.propName, data.data.value);
                    }
                }
                    break;
                case 'print_target_by_uuid': {
                    const tracker = creatorViewer.trackers.get(data.data.targetUuid);
                    if (tracker) {
                        console.log(tracker._target);
                    }
                }
                    break;
            }
        } catch (error) {
            console.error(error);
        }
    }

    selectNodeByUUid(uuid: string) {
        const node = creatorViewer.allNodeInfosMap.get(uuid);
        if (!node) {
            console.warn(`未找到 uuid 为 ${uuid} 的节点，选择失败`);
            return;
        }
        const trackers = node.selectNode();
        const serializeDatas: ICCObjectPropGroup[] = [];
        trackers.forEach(tracker => {
            serializeDatas.push(tracker.getSerializeData());
        })
        Logger.log(serializeDatas);
        this.sendData({ type: 'track_attrs', data: serializeDatas })
        // Logger.log(JSON.stringify(serializeDatas));
    }

    syncScene() {
        this.sendData({ type: "scene", data: [creatorViewer.sceneTree] });
    }

    onNodeDestroyed(uuid: string) {
        this.sendData({ type: "node_destroyed", data: uuid });
    }

    onNodeActiveChanged(uuid: string, active: boolean) {
        this.sendData({ type: 'node_active_change', data: { nodeUuid: uuid, active: active } });
    }

    onChildRemove(uuid: string) {
        this.sendData({ type: 'child_removed', data: uuid });
    }

    onChildAdd(parentUuid: string, childNodeInfo: INodeInfo) {
        this.sendData({ type: 'child_added', data: { parentUuid: parentUuid, childInfo: childNodeInfo } });
    }

    onChildrenOrderChange(uuid: string, childrenOrder: Record<string, number>) {
        this.sendData({ type: 'children_order_change', data: { nodeUuid: uuid, childrenOrder: childrenOrder } });
    }

    onTrackedPropValueChanged(targetUuid: string, propName: string, newValue: any) {
        this.sendData({ type: 'on_tracked_prop_change', data: { targetUuid: targetUuid, propName: propName, newValue: newValue } });
    }

    selectNodeByUuid(targetUuid : string) {
        this.sendData({ type: 'on_node_selected_by_viewer', data: { targetUuid: targetUuid}});
    }
}

export class CreatorViewerDatas {
    sceneTree: NodeInfo;
    trackers: Map<string, ViewElementTracker> = new Map();
    allNodesMap: Map<string, Node> = new Map();
    allNodeInfosMap: Map<string, NodeInfo> = new Map();

    selectedNode: NodeInfo;

    bridge: ViewBridgeBase;

    getCCObjectClassEnum: Function = getCCObjectClassEnum;
}

const VIEWER_TRACKER = 'VIEWER_TRACKER';


const creatorViewer = new CreatorViewerDatas();
Reflect.defineProperty(window, "creatorViewer", {
    value: creatorViewer
})

type CCObjectConstructor = new (...args: any[]) => CCObject;

interface ITrackerPropConfig {
    key: string;
    alias?: string;
    setFuncs?: string[];
    setterKey?: string;
}

interface ITrackerPropEnumConfig {
    key: string;
    enumDefine: Object;
}

class ViewerColor {
    constructor(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    r: number;
    g: number;
    b: number;
    a: number;
}

interface IMultiSetterInfo {
    name: string;
    /** 是否是函数  true 为 function  false  为 setter */
    isFunc: boolean;
}

interface ITrackPropConfigGroup {
    customItems?: ITrackerPropConfig[];
    replaceMap?: Record<string, string>;
    multiSetters?: Record<string, IMultiSetterInfo[]>;
}

const ReflectForceSetterProps: Map<CCObjectConstructor, ITrackPropConfigGroup> = new Map();
creatorViewer['ReflectForceSetterProps'] = ReflectForceSetterProps;

// CCObject 只处理ObjectFlag
ReflectForceSetterProps.set(CCObject,
    { customItems: [{ key: '_objFlags' }] }
);
// Node 特殊处理属性
ReflectForceSetterProps.set(Node, {
    customItems: [
        { key: "_lpos", alias: "position", setFuncs: ["setPosition", "setWorldPosition"] },
        { key: "_lscale", alias: "scale", setFuncs: ["setScale"] },
        { key: "_euler", alias: "eulerAngle", setterKey: 'eulerAngles' },
        { key: "_name" }
    ]
});

// Node 特殊处理属性
ReflectForceSetterProps.set(Sprite, {
    replaceMap: { '_useGrayscale': 'grayscale' }
});

// Node 特殊处理属性
ReflectForceSetterProps.set(UITransform, {
    multiSetters: { '_contentSize': [{ name: 'setContentSize', isFunc: true }], '_anchorPoint': [{ name: 'setAnchorPoint', isFunc: true }] },
});




const ClassEnumPropCustomDefine: Map<CCObjectConstructor, ITrackerPropEnumConfig[]> = new Map();
ClassEnumPropCustomDefine.set(UIRenderer, [{ key: '_srcBlendFactor', enumDefine: gfx.BlendFactor }, { key: '_dstBlendFactor', enumDefine: gfx.BlendFactor }]);

function NonEnumerable() {
    return function (target: any, key: string) {
        if (!target['hidden_props']) {
            target['hidden_props'] = [];
        }
        target['hidden_props'].push(key);
    };
}

function vclass() {
    return function <T extends new (...args: any[]) => any>(Ctor: T) {
        return class extends Ctor {
            constructor(...args: any[]) {
                super(...args);
                if (this['hidden_props']) {
                    this['hidden_props'].forEach(key => {
                        const descriptor = Reflect.getOwnPropertyDescriptor(this, key);
                        if (descriptor) {
                            descriptor.enumerable = false;
                            Reflect.defineProperty(this, key, descriptor);
                        }
                    })
                }
            }
        }
    }
}

/** 递归查找属性的描述器，自己找不到时，向prototype查找 */
function getPropertyDescriptor(obj: any, prop: PropertyKey): PropertyDescriptor | undefined {
    while (obj) {
        const descriptor = Reflect.getOwnPropertyDescriptor(obj, prop);
        if (descriptor) {
            return descriptor;
        }
        obj = Object.getPrototypeOf(obj);
    }
    return undefined;
}

function findCCObjectClassEnumConfig(ctor: CCObjectConstructor) {
    while (ctor) {
        if (ClassEnumPropCustomDefine.has(ctor)) {
            return ClassEnumPropCustomDefine.get(ctor);
        }

        //@ts-ignore
        ctor = Reflect.getPrototypeOf(ctor);
        if (!ctor) {
            return;
        }
    }
}

function getCCObjectClassEnum(target: CCObjectConstructor, propKey: string) {
    if (!target) return;

    const customDefine = findCCObjectClassEnumConfig(target);
    if (customDefine) {
        for (const cdefine of customDefine) {
            if (cdefine.key == propKey) {
                const enumList = [];
                let enumfilterCached = [];
                Object.keys(cdefine.enumDefine).forEach(key => {
                    if (enumfilterCached.includes(key)) return;
                    const reflectKey = cdefine.enumDefine[key];
                    enumfilterCached.push(reflectKey);
                    enumList.push({
                        name: reflectKey,
                        value: parseInt(key)
                    })
                })
                return enumList;
            }
        }
    }
    if (target['__attrs__']) {
        const enumKey = `${propKey}$_$enumList`;
        if (target['__attrs__'][enumKey]) {
            return target['__attrs__'][enumKey];
        }

        if (propKey.startsWith('_')) {
            const setterKey = propKey.substring(1);

            const setterEnumKey = `${setterKey}$_$enumList`;
            if (target['__attrs__'][setterEnumKey]) {
                return target['__attrs__'][setterEnumKey];
            }
        }

        const prototype = Object.getPrototypeOf(target['__attrs__']);
        if (prototype) {
            return getCCObjectClassEnum(prototype, propKey);
        }
    }
}

function getCCObjectClassPropTypeMatch<T extends CCObjectConstructor>(target: CCObjectConstructor, setterKey: string, propName: string, parentClass: T): CCObjectConstructor {
    if (!target) return;

    if (target['__attrs__']) {
        const setterClass = target['__attrs__'][`${setterKey}$_$ctor`];
        if (setterClass) {
            return js.isChildClassOf(setterClass, parentClass) ? setterClass : undefined;
        }

        const srcClass = target['__attrs__'][`${propName}$_$ctor`];
        if (srcClass) {
            return js.isChildClassOf(srcClass, parentClass) ? srcClass : undefined;
        }

        const prototype = Object.getPrototypeOf(target['__attrs__']);
        if (prototype) {
            return getCCObjectClassPropTypeMatch(prototype, setterKey, propName, parentClass);
        }
    }
}

/** ElementTracker */
class ViewElementTracker {
    static trackTarget(target: Node | Component) {
        if (!isValid(target)) return;

        const tracker = new ViewElementTracker(target);
        Reflect.defineProperty(target, VIEWER_TRACKER, {
            value: tracker,
            enumerable: false,
            writable: false,
            configurable: true
        });

        return tracker;
    }

    static unTrackTarget(target: Node | Component) {
        const tracker: ViewElementTracker = Reflect.get(target, VIEWER_TRACKER);
        if (!tracker) return;
        tracker.unTrack();
    }

    _target: Node | Component;

    /** 被追踪的属性记录 */
    protected _trackedPropsMap: Map<string, IPropEditRecordItem> = new Map();

    /** 被追踪对象修改的属性对应的缓存替换变量 */
    protected _targetPropsReplacer: Record<string, any> = {};
    protected _propName2KeyMap: Map<string, string> = new Map();

    protected _trackPropCopys: Map<string, IPropCopy> = new Map();

    protected _uuid: string = '';

    protected _type: 'node' | 'component' = 'node';

    protected _name: string = "";

    constructor(elementTarget: Node | Component) {
        this._target = elementTarget;
        this._uuid = elementTarget.uuid;
        this._type = elementTarget instanceof Node ? "node" : "component";
        if (elementTarget instanceof Node) {
            this._name = elementTarget.name;
        }
        else if (elementTarget instanceof Component) {
            this._name = js.getClassName(elementTarget);
        }

        creatorViewer.trackers.set(this._uuid, this);
        const preloadFunc = this._target['_onPreDestroy'];
        const self = this;
        if (preloadFunc) {
            this.recordCCObjectEdit('_onPreDestroy', PROP_EDIT_TYPE.FUNC_HOOK, preloadFunc);
            this._target['_onPreDestroy'] = function (...args) {
                self.unTrack();
                return preloadFunc.apply(self._target, args);
            }
        }

        this.analyzeTargetTrack();
    }

    /** 记录被修改的属性，用于节点反选时恢复属性被修改了监听方法之前的原始值 */
    protected recordCCObjectEdit(key: string, type: PROP_EDIT_TYPE, original: TypedPropertyDescriptor<any> | Function, target?: any) {
        this._trackedPropsMap.set(key, {
            type: type,
            original: original,
            target: target
        });
    }

    /** 记录哪些属性被追踪，用于传递给节点树端 */
    protected recordPropTrack(propKey: string, alias: string, trackKey: string, originalValue: any, hasSetter: boolean, engineClass?: CCObjectConstructor) {
        const aliasOrPropKey = alias || propKey;

        if (engineClass) {
            if (js.isChildClassOf(engineClass, Node)) {
                this._trackPropCopys.set(aliasOrPropKey, {
                    type: 'Node',
                    value: {
                        isValid: isValid(originalValue),
                        nodeName: (originalValue as Node)?.name || "None",
                        nodeUuid: (originalValue as Node)?.uuid || ""
                    } as INodeTypeData,
                    hasSetter: hasSetter
                })
            }
            else if (js.isChildClassOf(engineClass, Component)) {
                this._trackPropCopys.set(aliasOrPropKey, {
                    type: 'Component',
                    value: {
                        isValid: isValid(originalValue),
                        nodeUuid: (originalValue as Component)?.node?.uuid || "",
                        componentName: js.getClassName(engineClass),
                        nodeName: (originalValue as Component)?.node?.name || "",
                    } as IComponentTypeData,
                    hasSetter: false
                })
            }
            else if (js.isChildClassOf(engineClass, Asset)) {
                const assetValue = originalValue as Asset;

                this._trackPropCopys.set(aliasOrPropKey, {
                    type: 'Asset',
                    value: {
                        className: js.getClassName(engineClass),
                        assetName: assetValue?.name || ""
                    } as IAssetTypeData,
                    hasSetter: false
                })
            }
        }
        else if (typeof (originalValue) == "object") {
            // Logger.log(`record prop track value Type ${aliasOrPropKey} `, originalValue);
            if (originalValue instanceof ValueType) {
                if (originalValue instanceof Color) {
                    const copyObject = new ViewerColor(originalValue.r, originalValue.g, originalValue.b, originalValue.a);
                    this._trackPropCopys.set(aliasOrPropKey, {
                        type: 'Color',
                        value: copyObject,
                        hasSetter: hasSetter
                    })
                    Logger.log(JSON.stringify(copyObject));
                }
                else {
                    const copyObject = originalValue.clone();
                    this._trackPropCopys.set(aliasOrPropKey, {
                        type: getValueTypeName(originalValue),
                        value: copyObject,
                        hasSetter: hasSetter
                    })
                    Logger.log(JSON.stringify(copyObject));
                }
            }
        }
        else {
            // @ts-ignore 获取属性枚举列表如果不是枚举则为空
            const enumList = getCCObjectClassEnum(this._target.constructor, propKey);
            if (enumList) {
                this._trackPropCopys.set(aliasOrPropKey, {
                    type: 'Enum',
                    value: {
                        enumItems: enumList,
                        enumValue: originalValue
                    },
                    enumList: enumList,
                    hasSetter: hasSetter
                });
            }
            else {
                this._trackPropCopys.set(aliasOrPropKey, {
                    //@ts-ignore
                    type: typeof (originalValue),
                    value: originalValue,
                    // enumList : enumList,
                    hasSetter: hasSetter
                });
            }
        }

        this._propName2KeyMap.set(aliasOrPropKey, trackKey);
    }

    protected restoreTracker() {
        this._trackedPropsMap.forEach((prop, key) => {
            if (prop.type == PROP_EDIT_TYPE.PROP) {
                const curValue = this._target[key];
                Reflect.defineProperty(this._target, key, prop.original);
                if (typeof (curValue) == 'object') {
                    Object.keys(curValue).forEach(subKey => {
                        this._target[subKey] = curValue[subKey];
                    })
                }
                else {
                    this._target[key] = curValue;
                }
            }
            else if (prop.type == PROP_EDIT_TYPE.CCOBJECT) {
                const curValue = this._target[key];
                Reflect.defineProperty(this._target, key, prop.original);
                this._target[key] = curValue;
            }
            else if (prop.type == PROP_EDIT_TYPE.OBJECT) {
                Reflect.defineProperty(this._target, key, prop.original);
            }
            else if (prop.type == PROP_EDIT_TYPE.FUNC_HOOK) {
                if (prop.target) {
                    prop.target = prop.original;
                }
                else {
                    this._target[key] = prop.original;
                }
            }
            else if (prop.type == PROP_EDIT_TYPE.SETTER) {
                const setterDescriptor = Reflect.getOwnPropertyDescriptor(this._target, key);
                //@ts-ignore
                setterDescriptor.set = prop.original;
                Reflect.defineProperty(this._target, key, setterDescriptor);
            }
        });
        this._trackedPropsMap.clear();

        Reflect.deleteProperty(this._target, VIEWER_TRACKER);
    }

    protected onPropValueChange(aliasOrKey: string, newValue: any, engineClassType?: cvSupportType) {
        Logger.log(`on prop value change ${aliasOrKey} `, newValue);
        const trackedProp = this._trackPropCopys.get(aliasOrKey);
        if (!trackedProp) {
            console.warn(`prop  ${aliasOrKey} is not tracked`);
            return;
        }

        if (newValue instanceof ValueType) {
            if (newValue instanceof Color) {
                const color = (trackedProp.value as ViewerColor);
                color.r = newValue.r;
                color.g = newValue.g;
                color.b = newValue.b;
                color.a = newValue.a;
            }
            else {
                const value = (trackedProp.value as ValueType);
                value.set(newValue);
            }
        }
        else {
            if (engineClassType == 'Asset') {
                const value = (trackedProp.value as IAssetTypeData);
                value.assetName = newValue?.name || "";
                newValue = value;
            }
            else if (engineClassType == 'Component') {
                const value = (trackedProp.value as IComponentTypeData);
                value.isValid = isValid(newValue);
                value.nodeUuid = (newValue as Component)?.node?.uuid || "";
                value.nodeName = (newValue as Component)?.node?.name || "";
                newValue = value;
            }
            else if (engineClassType == 'Node') {
                const value = (trackedProp.value as INodeTypeData);
                value.isValid = isValid(newValue);
                value.nodeUuid = (newValue as Component)?.node?.uuid || "";
                value.nodeName = (newValue as Component)?.node?.name || "";
                newValue = value;
            }
            else {
                trackedProp.value = newValue;
            }
        }

        creatorViewer.bridge.onTrackedPropValueChanged(this._uuid, aliasOrKey, newValue);
    }

    modifyTrackProp(propName: string, value: any) {
        const trackKey = this._propName2KeyMap.get(propName);
        if (!trackKey) {
            console.warn(`modifyTrackProp error -> prop ${propName} is not in tracking`);
            return;
        }

        const tracker = this._trackedPropsMap.get(trackKey);
        if (!tracker) {
            console.warn(`modifyTrackProp error -> tracker ${trackKey} is not exist`);
            return;
        }

        if (typeof tracker.original == "function") {
            tracker.original.call(tracker.target || this._target, value);
        }
        else {
            if (Reflect.has(this._targetPropsReplacer, propName)) {
                if (typeof (this._targetPropsReplacer[propName]) == "object" && typeof (value) == 'object') {
                    Object.keys(value).forEach(key => {
                        this._targetPropsReplacer[propName][key] = value[key];
                    })
                }
                else if (typeof (this._targetPropsReplacer[propName]) == typeof (value)) {
                    this._targetPropsReplacer[propName] = value;
                }
            }
            //
            Logger.log(`value tracker change`, tracker);
        }
    }

    getSerializeData(): ICCObjectPropGroup {
        const propsArray = [];
        this._trackPropCopys.forEach((valueCopy, key) => {
            propsArray.push({
                value: valueCopy.value,
                type: valueCopy.type,
                key: key
            })
        })

        return {
            type: this._type,
            name: this._name,
            uuid: this._uuid,
            props: propsArray,
        };
    }

    getType() {
        return this._type;;
    }

    protected processPropTrack(key: string, alias?: string, setFuncs?: string[], customSetterKey?: string, multiSetters?: Record<string, IMultiSetterInfo[]>) {
        if (this._trackedPropsMap.has(key)) return;
        const srcValue = this._target[key];
        const self = this;


        let setterKeyAsset = customSetterKey;
        if (!setterKeyAsset && key.startsWith("_")) {
            setterKeyAsset = key.substring(1);
        }

        const engineClass = getCCObjectClassPropTypeMatch(this._target.constructor as CCObjectConstructor, setterKeyAsset, key, Asset) ||
            getCCObjectClassPropTypeMatch(this._target.constructor as CCObjectConstructor, setterKeyAsset, key, Node) ||
            getCCObjectClassPropTypeMatch(this._target.constructor as CCObjectConstructor, setterKeyAsset, key, Component);

        if (engineClass) {
            const propDescriptor = getPropertyDescriptor(this._target, key);
            this.recordCCObjectEdit(key, PROP_EDIT_TYPE.CCOBJECT, propDescriptor);
            this.recordPropTrack(key, alias, key, this._target[key], false, engineClass);
            this._targetPropsReplacer[key] = this._target[key];
            const self = this;
            let engineClassName: cvSupportType;
            if (js.isChildClassOf(engineClass, Asset)) {
                engineClassName = 'Asset';
            }
            else if (js.isChildClassOf(engineClass, Node)) {
                engineClassName = 'Node';
            }
            else if (js.isChildClassOf(engineClass, Component)) {
                engineClassName = 'Component';

                console.log(`Prop Track Component`);
            }

            Reflect.defineProperty(this._target, key, {
                set(value) {
                    self.onPropValueChange(alias || key, value, engineClassName);
                    // 用 Reflect.apply 来调用原始 setter
                    self._targetPropsReplacer[key] = value;
                },
                get() {
                    return self._targetPropsReplacer[key];
                }, // 保持 getter 不变
                configurable: propDescriptor.configurable,
                enumerable: propDescriptor.enumerable
            });
            return;
        }

        if (setFuncs && setFuncs.length > 0) {
            let hasSetTrackProp = false;
            for (const setFunc of setFuncs) {
                const srcFunc = this._target[setFunc];
                this._target[setFunc] = function (...args) {
                    const result = srcFunc.apply(self._target, args);
                    self.onPropValueChange(alias || key, self._target[key]);
                    return result;
                }

                this.recordCCObjectEdit(setFunc, PROP_EDIT_TYPE.FUNC_HOOK, srcFunc);
                if (!hasSetTrackProp) {
                    this.recordPropTrack(key, alias, setFunc, this._target[key], true);
                    hasSetTrackProp = true;
                }
            }

            return;
        }

        // 处理存在 _prop的变量 并且有 prop的 setter 方法，认定为同一个属性
        if (key.startsWith("_")) {
            const setterKey = customSetterKey || key.substring(1);
            const setterDescriptor = getPropertyDescriptor(this._target, setterKey);

            let hasRecordProp = false;
            if (typeof (setterDescriptor?.set) == "function") {
                const originalSetter = setterDescriptor.set;
                this.recordCCObjectEdit(setterKey, PROP_EDIT_TYPE.SETTER, originalSetter);
                this.recordPropTrack(key, alias, setterKey, this._target[key], true);
                setterDescriptor.set = function (...args) {
                    self.onPropValueChange(alias || key, args[0]);
                    originalSetter.apply(self._target, args);
                }

                Reflect.defineProperty(this._target, setterKey, setterDescriptor);
                hasRecordProp = true;
            }

            if (multiSetters && multiSetters[key]) {
                multiSetters[key].forEach(info => {
                    if (info.isFunc) {
                        const srcFunc = this._target[info.name];
                        this._target[info.name] = function (...args) {
                            const result = srcFunc.apply(self._target, args);
                            self.onPropValueChange(alias || key, self._target[key]);
                            return result;
                        }
                        this.recordCCObjectEdit(info.name, PROP_EDIT_TYPE.FUNC_HOOK, srcFunc);
                        if (!hasRecordProp) {
                            this.recordPropTrack(key, alias, setterKey, this._target[key], true);
                            hasRecordProp = true;
                        }
                    }
                    else {
                        // const multiSetterDescriptor = getPropertyDescriptor(this._target, info.name);

                        // if (typeof (multiSetterDescriptor?.set) == "function") {
                        //     const originalSetter = multiSetterDescriptor.set;
                        //     this.recordCCObjectEdit(info.name, PROP_EDIT_TYPE.SETTER, originalSetter);
                        //     if(!hasRecordProp) {
                        //         this.recordPropTrack(key, alias, info.name, this._target[key], true);
                        //         hasRecordProp = true;
                        //     }

                        //     multiSetterDescriptor.set = function (...args) {
                        //         self.onPropValueChange(alias || key, args[0]);
                        //         originalSetter.apply(self._target, args);
                        //     }

                        //     Reflect.defineProperty(this._target, setterKey, multiSetterDescriptor);
                        //     hasRecordProp = true;
                        // }
                    }
                })
            }
            if (hasRecordProp) return;
            // Logger.log(`set key ${setterKey}   `, setterDescriptor);

        }

        // Node Component Asset 当做普通变量处理
        if (typeof (srcValue) == "object") {
            if (srcValue instanceof Color) {
                const originalSet = srcValue['set'];
                this.recordCCObjectEdit(key, PROP_EDIT_TYPE.FUNC_HOOK, originalSet, srcValue);
                this.recordPropTrack(key, alias, key, this._target[key], false);
                srcValue['set'] = function (...args) {
                    self.onPropValueChange(alias || key, args[0]);
                    return originalSet.apply(srcValue, args);
                }
            }
            else if (srcValue instanceof Vec3 || srcValue instanceof Vec2 || srcValue instanceof Vec4 || srcValue instanceof Size || srcValue instanceof Rect) {
                const setterDescriptor = Reflect.getOwnPropertyDescriptor(this._target, key);
                this.recordCCObjectEdit(key, PROP_EDIT_TYPE.OBJECT, setterDescriptor);
                this.recordPropTrack(key, alias, key, this._target[key], false);
                const proxy = new Proxy(this._target[key], {
                    set(target, p, newValue, receiver) {
                        const result = Reflect.set(target, p, newValue);
                        self.onPropValueChange(alias || key, self._target[key]);
                        return result;
                    },
                });

                Reflect.defineProperty(this._target, key, {
                    value: proxy, // 保持 getter 不变
                    configurable: setterDescriptor.configurable,
                    enumerable: setterDescriptor.enumerable
                });
            }
            else {
                Logger.log(`normal object will not track key ${key}`, this._target[key]);
            }
        }
        else {
            const propDescriptor = getPropertyDescriptor(this._target, key);
            this.recordCCObjectEdit(key, PROP_EDIT_TYPE.PROP, propDescriptor);
            this.recordPropTrack(key, alias, key, this._target[key], false);
            this._targetPropsReplacer[key] = this._target[key];
            const self = this;
            Reflect.defineProperty(this._target, key, {
                set(value) {
                    self.onPropValueChange(alias || key, value);
                    // 用 Reflect.apply 来调用原始 setter
                    self._targetPropsReplacer[key] = value;
                },
                get() {
                    return self._targetPropsReplacer[key];
                }, // 保持 getter 不变
                configurable: propDescriptor.configurable,
                enumerable: propDescriptor.enumerable
            });
        }
    }

    protected analyzeTargetTrack() {
        // 强制将属性改为setter，变量的setter方法和protected属性的名称不匹配或者setter未被正确使用时，手动添加属性至此，会强制将属性添加到setter中监听
        //  需要手动修改配置 比如 node的 siblingIndex 即使有setter 但是 刷新的时候是直接赋值的 _siblingIndex，未调用 set siblingIndex
        for (const ctor of ReflectForceSetterProps.keys()) {
            if (this._target instanceof ctor) {
                const fprops = ReflectForceSetterProps.get(ctor);
                fprops.customItems?.forEach(fprop => {
                    this.processPropTrack(fprop.key, fprop.alias, fprop.setFuncs, fprop.setterKey);
                })
            }
        }

        const reflectSetter = ReflectForceSetterProps.get(this._target.constructor as CCObjectConstructor);
        let hasCustomSetterConfig = false;
        let hasReplaceSetter = false;
        let multiSetters: Record<string, IMultiSetterInfo[]>;
        Logger.log('analyzeTargetTrack', this._target);

        if (reflectSetter) {
            hasCustomSetterConfig = Reflect.has(reflectSetter, 'customItems');
            hasReplaceSetter = Reflect.has(reflectSetter, 'replaceMap');
            multiSetters = reflectSetter.multiSetters;
            Logger.log(reflectSetter, this._target);
        }

        // 如果没有特殊处理，默认全部属性都监听
        if (!hasCustomSetterConfig) {
            const valueKeys = this._target.constructor?.['__values__'] || [];
            Reflect.ownKeys(this._target).forEach(key => {
                if (!valueKeys.includes(key) || key == "node") return;
                if (hasReplaceSetter) {
                    //@ts-ignore
                    this.processPropTrack(key.toString(), reflectSetter['replaceMap'][key], undefined, reflectSetter['replaceMap'][key], multiSetters);
                }
                else {
                    this.processPropTrack(key.toString(), undefined, undefined, undefined, multiSetters);
                }
            })
        }
    }

    unTrack() {
        creatorViewer.trackers.delete(this._uuid);
        this.restoreTracker();
    }
}

@vclass()
class NodeInfo {
    static index: number = 0;
    name: string = "";
    uuid: string = "";
    children: NodeInfo[] = [];
    // activeInHierarchy : boolean = false;
    active: boolean = false;

    @NonEnumerable()
    childrenUUidMap: Map<string, NodeInfo> = new Map();

    @NonEnumerable()
    childrenNameMap: Map<string, NodeInfo> = new Map();

    @NonEnumerable()
    parent: NodeInfo;

    @NonEnumerable()
    protected _index: number = NodeInfo.index++;

    @NonEnumerable()
    siblingIndex: number = 0;

    constructor(node: Node) {
        this.siblingIndex = node.getSiblingIndex();
        node.on(Node.EventType.CHILD_REMOVED, this.onChildRemove, this);
        node.on(Node.EventType.CHILD_ADDED, this.onChildAdd, this);
        node.on(Node.EventType.CHILDREN_ORDER_CHANGED, this.onChildrenOrderChange, this);
        node.on(Node.EventType.COMPONENT_ADDED, this.onComponentAdd, this);
        node.on(Node.EventType.NODE_DESTROYED, this.onNodeDestroyed, this);
        node.on(Node.EventType.ACTIVE_CHANGED, this.onActiveChanged, this);
        creatorViewer.allNodeInfosMap.set(node.uuid, this);
        creatorViewer.allNodesMap.set(node.uuid, node);
    }

    clearListeners() {
        const node = creatorViewer.allNodesMap.get(this.uuid);
        if (!isValid(node)) return;
        node.targetOff(this);
    }

    protected onComponentAdd(component: Component) {

    }

    protected onActiveChanged(node: Node) {
        if (node.active == this.active) return;
        this.active = node.active;
        creatorViewer.bridge.onNodeActiveChanged(this.uuid, node.active);
    }

    protected onNodeDestroyed() {
        Logger.log(`on node ${this.name} destroyed`);
        if (creatorViewer.selectedNode === this) {
            this.unSelectNode();
            creatorViewer.selectedNode = undefined;
        }

        creatorViewer.bridge.onNodeDestroyed(this.uuid);
        creatorViewer.allNodeInfosMap.delete(this.uuid);
        creatorViewer.allNodesMap.delete(this.uuid);
    }

    addChildNodeInfo(nodeInfo: NodeInfo) {
        this.children.push(nodeInfo);
        this.childrenUUidMap.set(nodeInfo.uuid, nodeInfo);
        this.childrenNameMap.set(nodeInfo.name, nodeInfo);
    }

    protected onChildRemove(child: Node) {
        Logger.log(`on child removed ${child.uuid}`, this);
        const index = this.children.findIndex(nodeInfo => nodeInfo.uuid == child.uuid);
        this.childrenUUidMap.delete(child.uuid);
        this.childrenNameMap.delete(child.name);

        if (index != -1) {
            this.children.splice(index, 1);
        }
        creatorViewer.bridge.onChildRemove(child.uuid);
    }

    protected onChildAdd(child: Node) {
        // Logger.log(new Error().stack);
        Logger.log(`on child add ${child.uuid}    index : ${this._index}`, this);
        const childInfo = creatorViewer.allNodeInfosMap.get(child.uuid) || walkNode(child, this);
        this.addChildNodeInfo(childInfo);

        // setTimeout(()=>{
        //     globalInfo.bridge.onChildAdd(this.uuid, childInfo);
        // },10);
        creatorViewer.bridge.onChildAdd(this.uuid, childInfo);
    }

    onChildrenOrderChange() {
        Logger.log(`on children order change`);
        const selfNode = creatorViewer.allNodesMap.get(this.uuid);

        const childrenOrder: Record<string, number> = {};
        selfNode?.children.forEach(node => {
            if (this.childrenUUidMap.has(node.uuid)) {
                this.childrenUUidMap.get(node.uuid).siblingIndex = node.getSiblingIndex();
            }
            childrenOrder[node.uuid] = node.getSiblingIndex();
        })

        this.children.sort((a, b) => a.siblingIndex - b.siblingIndex);

        creatorViewer.bridge.onChildrenOrderChange(this.uuid, childrenOrder);
        // globalInfo.bridge.onChildrenOrderChange(this.uuid, childrenOrder);
    }

    onNodeNameChange(newName: string) {
        const oldName = this.name;
        this.name = newName;
    }

    setNodePosition(x: number, y: number, z?: number) {
        const node = creatorViewer.allNodesMap.get(this.uuid);
        if (!node) return;
        node.setPosition(x, y, z);
    }

    get path() {
        return (this.parent ? this.parent.path + "/" : "") + this.name;
    }

    get components() {
        return creatorViewer.allNodesMap.get(this.uuid)?.components || [];
    }

    selectNode() {
        creatorViewer.selectedNode?.unSelectNode();
        creatorViewer.selectedNode = this;
        const trackers: ViewElementTracker[] = [];
        trackers.push(ViewElementTracker.trackTarget(creatorViewer.allNodesMap.get(this.uuid)));
        this.components.forEach(comp => {
            trackers.push(ViewElementTracker.trackTarget(comp));
        })
        return trackers;
    }

    unSelectNode() {
        this.components.forEach(comp => {
            ViewElementTracker.unTrackTarget(comp);
        });
        ViewElementTracker.unTrackTarget(creatorViewer.allNodesMap.get(this.uuid));
    }

    getChildByPath(path: string) {
        const pathSplit = path.split('/');
        let parentNode: NodeInfo = this;
        for (const split of pathSplit) {
            if (!split) continue;

            parentNode = parentNode.childrenNameMap.get(split);
            if (!parentNode) {
                return;
            }
        }

        return parentNode;
    }
}

/**
 * 遍历节点并生成节点信息
 * @param node 节点或场景
 * @param parent 父节点信息
 * @returns 
 */
function walkNode(node: Node | Scene, parent?: NodeInfo) {
    if (creatorViewer.allNodeInfosMap.has(node.uuid)) {
        Logger.log(`walk same node`);
        return creatorViewer.allNodeInfosMap.get(node.uuid);
    }
    const nodeInfo = new NodeInfo(node);
    nodeInfo.name = node.name;
    nodeInfo.uuid = node.uuid;
    nodeInfo.parent = parent;
    nodeInfo.active = node.active;
    node.children.forEach(child => nodeInfo.addChildNodeInfo(walkNode(child, nodeInfo)));
    return nodeInfo;
}

enum FloatingActionButtonEvent {
    ON_FLOATING_ACTION_BUTTON_CLICK = "ON_FLOATING_ACTION_BUTTON_CLICK",
}

class FloatingContent extends Component {
    protected _floatingSpeed = 15;
    protected _alignSpeed = 3;
    protected _minMoveDistance = 10;

    protected _floatingContent: Node;
    protected _containerContentSize: Size;
    protected _floatingContentOffset: Vec2 = Vec2.ZERO.clone();

    protected _touchStartPosition: Vec3 = Vec3.ZERO.clone();
    protected _touchTargetPosition: Vec2 = Vec2.ZERO.clone();

    protected _isTouchingButtonMove: boolean = false;
    protected _isTouching: boolean = false;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    protected onTouchStart(event: EventTouch) {
        this._isTouchingButtonMove = false;
        this._isTouching = true;
        if (!this._floatingContent) return;
        this._touchStartPosition.set(this._floatingContent.position.clone());
    }

    protected onTouchMove(event: EventTouch) {
        let offset = event.getUILocation().clone().subtract(event.getUIStartLocation());
        this._touchTargetPosition.set(this._touchStartPosition.x + offset.x, this._touchStartPosition.y + offset.y);
        if (!this._isTouchingButtonMove) {
            if (Vec2.distance(event.getUILocation(), event.getUIStartLocation()) >= this._minMoveDistance) {
                this._isTouchingButtonMove = true;
            }
        }
        else {
            this.fixContentPosition(this._touchTargetPosition);
        }
    }

    protected onTouchEnd(event: EventTouch) {
        this._isTouchingButtonMove = false;
        this._isTouching = false;
    }

    setContainerContent(node: Node) {
        const uiTransform = node.getComponent(UITransform);
        this._containerContentSize = uiTransform.contentSize.clone();
        this.refreshContainerSize();
    }

    setFloatingContent(node: Node) {
        this._floatingContent = node;
        const offset = node.worldPosition.subtract(this.node.worldPosition);
        this._floatingContentOffset.set(offset.x, offset.y);
        this.refreshContainerSize();
    }

    protected refreshContainerSize() {
        if (!this._containerContentSize || !this._floatingContent) return;
        const uiTransform = this._floatingContent.getComponent(UITransform);
        this._containerContentSize.width -= uiTransform.width;
        this._containerContentSize.height -= uiTransform.height;
    }

    protected fixContentPosition(targetPosition: Vec2) {
        if (!this._containerContentSize) return;

        if (targetPosition.x > this._containerContentSize.width / 2) {
            targetPosition.x = this._containerContentSize.width / 2;
        }
        else if (targetPosition.x < -this._containerContentSize.width / 2) {
            targetPosition.x = -this._containerContentSize.width / 2;
        }

        if (targetPosition.y > this._containerContentSize.height / 2) {
            targetPosition.y = this._containerContentSize.height / 2;
        }
        else if (targetPosition.y < -this._containerContentSize.height / 2) {
            targetPosition.y = -this._containerContentSize.height / 2;
        }
    }

    protected update(deltaTime: number) {
        if (this._isTouchingButtonMove && this._floatingContent) {
            let pos = v2(this._floatingContent.position.x, this._floatingContent.position.y);
            pos.lerp(this._touchTargetPosition, deltaTime * this._floatingSpeed);
            this._floatingContent.setPosition(pos.x, pos.y);
        }
    }
}

class FloatingActionButton extends Component {
    static EventType = FloatingActionButtonEvent;

    protected clickCheckElapse = 0.3;
    protected _idleOpacity = 100;
    protected _floatingSpeed = 15;
    protected _alignSpeed = 3;
    protected _minMoveDistance = 10;
    protected _continuousClickTimes: number = 0;

    protected _isTouchingButtonMove: boolean = false;
    protected _isTouching: boolean = false;
    protected _isAlignMoving: boolean = false;
    protected _parentSize: Size = Size.ZERO.clone();

    protected _touchStartPosition: Vec3 = Vec3.ZERO.clone();
    protected _touchTargetPosition: Vec2 = Vec2.ZERO.clone();
    protected _opacityComp: UIOpacity;
    protected _fadingTween: Tween<UIOpacity>;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);

        this._opacityComp = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        this._opacityComp.opacity = 1;
    }

    start() {
        this.scheduleOnce(() => {
            let buttonSize = this.getComponent(UITransform).contentSize;
            let nodeSize = this.node.parent.getComponent(UITransform).contentSize;
            this._parentSize.set(nodeSize.width - buttonSize.width, nodeSize.height - buttonSize.height);
            this.checkAlign();
            this.node.setPosition(this._touchTargetPosition.x, this._touchTargetPosition.y);
            this._opacityComp.opacity = this._idleOpacity;
        })
    }

    protected onTouchTimeOut() {
        this.node.emit(FloatingActionButtonEvent.ON_FLOATING_ACTION_BUTTON_CLICK, this._continuousClickTimes);
        this._continuousClickTimes = 0;
    }

    protected onTouchStart(event: EventTouch) {
        Tween.stopAllByTarget(this._opacityComp);
        this._isTouchingButtonMove = false;
        this._isTouching = true;
        this._touchStartPosition.set(this.node.position);
        this.unschedule(this.onTouchTimeOut);
        this._continuousClickTimes++;
        this._opacityComp.opacity = 255;
    }

    protected onTouchMove(event: EventTouch) {
        let offset = event.getUILocation().clone().subtract(event.getUIStartLocation());
        this._touchTargetPosition.set(this._touchStartPosition.x + offset.x, this._touchStartPosition.y + offset.y);
        if (!this._isTouchingButtonMove) {
            if (Vec2.distance(event.getUILocation(), event.getUIStartLocation()) >= this._minMoveDistance) {
                this._isTouchingButtonMove = true;
                this._continuousClickTimes = 0;
            }
        }
        else {
            this.calTargetPosition(this._touchTargetPosition);
        }
    }

    protected calTargetPosition(targetPosition: Vec2) {
        if (targetPosition.x > this._parentSize.width / 2) {
            targetPosition.x = this._parentSize.width / 2;
        }
        else if (targetPosition.x < -this._parentSize.width / 2) {
            targetPosition.x = -this._parentSize.width / 2;
        }

        if (targetPosition.y > this._parentSize.height / 2) {
            targetPosition.y = this._parentSize.height / 2;
        }
        else if (targetPosition.y < -this._parentSize.height / 2) {
            targetPosition.y = -this._parentSize.height / 2;
        }
    }

    protected onTouchEnd(event: EventTouch) {
        if (!this._isTouchingButtonMove) {
            this.scheduleOnce(this.onTouchTimeOut, this.clickCheckElapse);
        }

        if (this._isTouchingButtonMove) {
            let offset = event.getUILocation().clone().subtract(event.getUIStartLocation());
            this.checkAlign(v3(this._touchStartPosition.x + offset.x, this._touchStartPosition.y + offset.y));
        }
        this._isTouchingButtonMove = false;
        this._isTouching = false;


        this._fadingTween = tween(this._opacityComp).delay(0.4).to(0.2, { opacity: this._idleOpacity }).start();
    }

    protected checkAlign(pos?: Vec3) {
        pos = pos || this.node.position;
        let leftPadding = pos.x + this._parentSize.width / 2;
        let rightPadding = this._parentSize.width / 2 - pos.x;
        let topPadding = this._parentSize.height / 2 - pos.y;
        let bottomPadding = pos.y + this._parentSize.height / 2;
        let targetX = 0;
        let targetY = 0;
        let xMoveSpace = 0;
        let yMoveSpace = 0;

        if (leftPadding > rightPadding) {
            xMoveSpace = rightPadding;
            targetX = this._parentSize.width / 2;
        }
        else {
            xMoveSpace = leftPadding;
            targetX = -this._parentSize.width / 2;
        }

        if (topPadding > bottomPadding) {
            yMoveSpace = bottomPadding;
            targetY = -this._parentSize.height / 2;
        }
        else {
            yMoveSpace = topPadding;
            targetY = this._parentSize.height / 2;
        }

        if (xMoveSpace > yMoveSpace) {
            this._touchTargetPosition.set(pos.x, targetY);
        }
        else {
            this._touchTargetPosition.set(targetX, pos.y);
        }

        if (!this.isAlignToTarget()) {
            this._isAlignMoving = true;
        }
    }

    protected isAlignToTarget() {
        return Math.abs(this._touchTargetPosition.x - this.node.position.x) < 2 && Math.abs(this._touchTargetPosition.y - this.node.position.y) < 2;
    }

    protected update(deltaTime: number) {
        if (this._isTouchingButtonMove) {
            let pos = v2(this.node.position.x, this.node.position.y);
            pos.lerp(this._touchTargetPosition, deltaTime * this._floatingSpeed);
            this.node.setPosition(pos.x, pos.y);
        }
        else {
            if (!this._isTouching && this._isAlignMoving) {
                let pos = v2(this.node.position.x, this.node.position.y);
                pos.lerp(this._touchTargetPosition, deltaTime * this._alignSpeed);
                this.node.setPosition(pos.x, pos.y);
                if (this.isAlignToTarget()) {
                    this._isAlignMoving = false;
                }
            }
        }
    }
}

function createEditBox(width: number, height: number, maxLength: number = 32, fontSize: number = 26, placeHolder: string = "place holder", nodeName?: string): [Node, EditBox] {
    const bgNode = createPanel(width, height, undefined, 6, 2);
    const editNode = new Node(nodeName);
    bgNode.addChild(editNode);
    const editComp = editNode.addComponent(EditBox);

    const editWidth = width - 4;
    const editHeight = height - 4;
    editNode.getComponent(UITransform).setContentSize(editWidth, editHeight);
    editComp.inputMode = EditBox.InputMode.SINGLE_LINE;
    editComp.maxLength = maxLength;
    editComp.placeholder = placeHolder;

    function adjustEditLabel(label: Label, color: Color) {
        label.overflow = Overflow.CLAMP;
        label.getComponent(UITransform).setContentSize(editWidth, editHeight);
        label.horizontalAlign = HorizontalTextAlignment.LEFT;
        label.node.setPosition(0, 0);
        label.color = color;
        label.fontSize = fontSize;
        label.lineHeight = fontSize;
    }

    editComp.scheduleOnce(() => {
        adjustEditLabel(editComp.placeholderLabel, Color.GRAY);
        adjustEditLabel(editComp.textLabel, Color.BLACK);
    })

    return [bgNode, editComp];
}

/**
 * 创建按钮 
 * @param width 按钮宽度
 * @param height 按钮高度
 * @param buttonText 按钮文本
 * @param color 背景色
 * @param borderColor 边框颜色
 * @param textColor 文本颜色
 * @param textFontSize 文本字体大小
 * @returns 
 */
function createButton(width: number, height: number, buttonText: string = "Button", color: Color = Color.WHITE, borderColor: Color = Color.BLACK, textColor: Color = Color.BLACK, textFontSize: number = 26, borderSize: number = 2) {
    const bgNode = createPanel(width, height, color, 6, borderSize, borderColor);

    const buttonComp = bgNode.addComponent(Button);
    buttonComp.transition = Button.Transition.SCALE;
    buttonComp.zoomScale = 1.1;
    const labelNode = new Node("Label");
    bgNode.addChild(labelNode);
    const labelComp = labelNode.addComponent(Label);
    labelComp.string = buttonText;
    labelComp.color = textColor;
    labelComp.fontSize = textFontSize;
    labelComp.lineHeight = textFontSize;
    labelComp.isBold = true;

    return bgNode;
}

/**
 * 绘制一个面板
 * @param width 面板宽度
 * @param height 面板高度
 * @param color 背景颜色
 * @param roundRadius 圆角半径
 * @param borderSize 边框宽度（0为没有边框）
 * @param borderColor 边框颜色
 * @returns 
 */
function createPanel(width: number, height: number, color: Color = Color.WHITE, roundRadius: number = 0, borderSize: number = 0, borderColor: Color = Color.BLACK) {
    const node = new Node();
    const graphicsComp = node.addComponent(Graphics);
    if (borderSize > 0) {
        const borderWidth = width + borderSize * 2;
        const borderHeight = height + borderSize * 2;

        graphicsComp.roundRect(-borderWidth / 2, -borderHeight / 2, borderWidth, borderHeight, roundRadius);
        graphicsComp.fillColor = borderColor;
        graphicsComp.fill();
    }
    graphicsComp.roundRect(-width / 2, -height / 2, width, height, roundRadius);
    graphicsComp.fillColor = color;
    graphicsComp.fill();

    node.getComponent(UITransform).setContentSize(width + borderSize * 2, height + borderSize * 2);

    return node;
}

/**
 * 创建一个Label
 * @param name 节点名称
 * @param fontSize 字体大小
 * @param fontColor 文本颜色
 * @param outlineWidth 描边宽度
 * @param outlineColor 描边颜色
 * @param anchorPoint 锚点
 * @returns 
 */
function createLabel(name: string, fontSize: number, fontColor: Color = Color.BLACK, outlineWidth: number = 0, outlineColor: Color = Color.BLACK, anchorPoint: Vec2 = v2(0.5, 0.5)) {
    const labelComp = new Node(name).addComponent(Label);
    labelComp.fontSize = fontSize;
    labelComp.lineHeight = fontSize;
    labelComp.color = fontColor;
    if (outlineWidth > 0) {
        labelComp.enableOutline = true;
        labelComp.outlineWidth = outlineWidth;
        labelComp.outlineColor = outlineColor;
    }
    labelComp.getComponent(UITransform).setAnchorPoint(anchorPoint);

    return labelComp;
}

function createCircleNode(name: string, radius: number, color: Color) {
    const graphicsComp = new Node(name).addComponent(Graphics);
    graphicsComp.circle(0, 0, radius);
    graphicsComp.fillColor = color;
    graphicsComp.fill();

    return graphicsComp.node;
}

/**
 * 创建一个CheckBox
 * @param text 
 * @param width 
 * @param height 
 * @param checkMarkSize 
 * @param fontSize 
 * @returns 
 */
function createCheckBox(text: string, width: number, height: number, checkMarkSize: number, fontSize: number) {
    const node = new Node();
    node.addComponent(UITransform).setContentSize(width, height);
    // node.addChild(createPanel(width, height, Color.BLUE, 6));
    const toggle = node.addComponent(Toggle);

    const toggleBg = createPanel(checkMarkSize, checkMarkSize, Color.WHITE, 6, 2, Color.BLACK);
    node.addChild(toggleBg);
    const toggleMark = createPanel(checkMarkSize - 4, checkMarkSize - 4, new Color("#005f96ff"), 6);
    toggleBg.addChild(toggleMark);
    toggleBg.setPosition(-width / 2 + checkMarkSize / 2 + 2, 0);
    toggle.checkMark = toggleMark.addComponent(Sprite);

    const label = createLabel("Label", fontSize, Color.WHITE, 2, Color.BLACK, v2(0, 0.5));
    label.string = text;
    node.addChild(label.node);
    label.node.setPosition(-width / 2 + checkMarkSize + 8, 0);

    return node;
}

function drawBorder(width: number, height: number, anchorPoint: Vec2) {
    const node = new Node();
    const uiTransform = node.addComponent(UITransform);
    const graphics = node.addComponent(Graphics);
    uiTransform.setContentSize(width, height);
    graphics.rect(-width * anchorPoint.x, -height * anchorPoint.y, width, height);
    graphics.strokeColor = Color.RED;
    graphics.lineWidth = 2;
    graphics.stroke();
    return node;
}

interface IPanelStyleConfig {
    size: Size;
    backgroundColor: Color;
    backgroundBorderWidth: number;
    backgroundRadius: number;
    padding: number;

    titleBackgroundColor: Color;
    titleHeight: number;
    titleBackgroundRadius: number;
    titleFontSize: number;

    controlsBackgroundColor: Color;
    constolsBackgroundRadius: number;

    propertyFontSize: number;
}

const PanelDefaultStyle: IPanelStyleConfig = {
    size: size(500, 200),
    backgroundColor: new Color("#ffffffff"),
    backgroundBorderWidth: 3,
    backgroundRadius: 6,
    padding: 3,

    titleBackgroundColor: new Color("#a7b6d3ff"),
    titleHeight: 35,
    titleBackgroundRadius: 6,
    titleFontSize: 14,

    controlsBackgroundColor: new Color("#d3ddefff"),
    constolsBackgroundRadius: 6,

    propertyFontSize: 14
}

enum CreatorViewerConnectedStated {
    FREE,
    CONNECTING,
    ERROR,
    KICKED,
}

enum CreatorViewerStorageKeys {
    /**  */
    CREATOR_VIEWER_TEMP_SERVER = "CREATOR_VIEWER_TEMP_SERVER",
}

function getCreatorViewerStorageData<T>(key: CreatorViewerStorageKeys, defaultValue: T) {
    const value = sys.localStorage.getItem(key);
    if (value == null) return defaultValue;
    return value;
}

const selectNodeQueue: Node[] = [];
const curSelectedNodeQueue: Node[] = [];
let curSelectedFirstItem: Node;

function walkUINodeContect(node: Node, uiLocation: Vec2): Node {
    // if(!node._uiProps?.uiTransformComp) return;

    for (let index = node.children.length - 1; index >= 0; index--) {
        const child = node.children[index];
        if (child.name == "CreatorViewerPanelNode") continue;
        if (!child.activeInHierarchy) continue;
        if (!child._uiProps?.uiTransformComp) continue;

        const subChild = walkUINodeContect(child, uiLocation);
        if (subChild) return subChild;
        if (child._uiProps?.uiTransformComp.hitTest(uiLocation)) {
            curSelectedNodeQueue.push(child);
            if (!curSelectedFirstItem) curSelectedFirstItem = child;
            if (!selectNodeQueue.includes(child)) {
                return child;
            }
        }
    }
}

function checkTouchNode(touchEvent: EventTouch, paintNode: Node) {
    curSelectedFirstItem = undefined;
    curSelectedNodeQueue.length = 0;
    const selectNode = walkUINodeContect(director.getScene(), touchEvent.getLocation());
    if (selectNode) {
        console.log(`selectNode`, selectNode);
        selectNodeQueue.push(selectNode);
        const uiTransform = selectNode.getComponent(UITransform);
        const border = drawBorder(uiTransform.width, uiTransform.height, uiTransform.anchorPoint);
        paintNode.addChild(border);
        border.setWorldPosition(selectNode.worldPosition);
        creatorViewer.bridge.selectNodeByUuid(selectNode.uuid);
    }
    else {
        selectNodeQueue.length = 0;
        if (curSelectedFirstItem) {
            console.log(`selectNode `, curSelectedFirstItem);
            selectNodeQueue.push(curSelectedFirstItem);
        }
        else {
            console.log(`selectNode none`);
        }
    }
}

class TouchCheckContent extends Component {

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);

        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouch, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouch, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouch, this);
    }

    protected onTouchStart(event: EventTouch) {
        checkTouchNode(event, this.node);
    }

    protected onTouch(event: EventTouch) {}
}


/** CreatorViewer面板（因为不引用外部的预制体及资源所以需要使用的控件和面板都手动创建） */
class CreatorViewerPanel extends Component {
    protected _titleContent: Node;
    protected _controlsContent: Node;

    protected _serverAddressEditBox: EditBox;
    protected _connectButton: Button;
    protected _cancelConnectButton: Button;
    protected _stateGraphics: Graphics;

    protected _touchCheckNode: Node;

    protected onLoad(): void {
        this.node.name = "CreatorViewerPanel";
        const maskNode = createPanel(5000, 5000, new Color(123, 123, 123, 120), 0, 0);
        maskNode.addComponent(BlockInputEvents);
        maskNode.addComponent(Button);
        maskNode.on(Button.EventType.CLICK, this.hidePanel, this);
        this.node.addChild(maskNode);
        this.createPanel(PanelDefaultStyle);
    }

    setTouchCheckNode(node: Node) {
        this._touchCheckNode = node;
        node.active = false;
    }

    protected onCheckNodeToggleChange(toggle: Toggle) {
        this._touchCheckNode.active = toggle.isChecked;
    }

    protected hidePanel() {
        this.node.active = false;
    }

    protected createPanel(style: IPanelStyleConfig) {
        const uiTransform = this.getComponent(UITransform) || this.addComponent(UITransform);
        uiTransform.setContentSize(style.size);

        const background = createPanel(style.size.width, style.size.height, style.backgroundColor, style.backgroundRadius, style.backgroundBorderWidth);
        background.addComponent(BlockInputEvents);
        this.node.addChild(background);

        this._titleContent = createPanel(style.size.width - style.padding * 2, style.titleHeight, style.titleBackgroundColor, style.titleBackgroundRadius);
        background.addChild(this._titleContent);
        this._titleContent.setPosition(0, style.size.height / 2 - style.titleHeight / 2 - style.padding);

        this._controlsContent = createPanel(style.size.width - style.padding * 2, style.size.height - style.titleHeight - style.padding * 3, style.controlsBackgroundColor, style.constolsBackgroundRadius);
        background.addChild(this._controlsContent);
        this._controlsContent.setPosition(0, -style.size.height / 2 + (style.size.height - style.titleHeight - style.padding * 3) / 2 + style.padding);
        this.createControls(style);

        this.scheduleOnce(() => {
            const floatingContent = this._titleContent.addComponent(FloatingContent);
            floatingContent.setFloatingContent(this.node);
            floatingContent.setContainerContent(this.node.parent);
        }, 0.1);
    }

    /** 创建面板控件 */
    protected createControls(style: IPanelStyleConfig) {
        const titleLabel = createLabel("TilteLabel", style.titleFontSize, Color.WHITE, 2, Color.BLACK, v2(0, 0.5));
        titleLabel.node.setPosition(-this._titleContent.getComponent(UITransform).width / 2 + 3, 0);
        titleLabel.string = "CreatorViewer 1.0";
        this._titleContent.addChild(titleLabel.node);

        const stateCircleBg = createCircleNode("Connection State", 10, Color.BLACK);
        this._titleContent.addChild(stateCircleBg);

        const stateCircle = createCircleNode("Connection State", 8, Color.GRAY);
        this._stateGraphics = stateCircle.getComponent(Graphics);
        stateCircleBg.addChild(stateCircle);


        const connectButton = createButton(60, 28, "连接", new Color('#7ED56D'), undefined, new Color("#0B4600"), 14, 2);
        this._connectButton = connectButton.getComponent(Button);
        connectButton.on(Button.EventType.CLICK, this.onClickConnect, this);
        this._controlsContent.addChild(connectButton);

        const cancelConnectButton = createButton(60, 28, "取消", new Color('#ebb66bff'), undefined, new Color("#764909ff"), 14, 2);
        this._cancelConnectButton = cancelConnectButton.getComponent(Button);
        cancelConnectButton.on(Button.EventType.CLICK, this.onClickCancel, this);
        this._cancelConnectButton.node.active = false;


        const [serverEditBoxNode, serverEditBox] = createEditBox(220, 30, 256, 16, "输入CreatorViewer服务地址");
        serverEditBox.string = getCreatorViewerStorageData(CreatorViewerStorageKeys.CREATOR_VIEWER_TEMP_SERVER, '127.0.0.1:33000');
        this._serverAddressEditBox = serverEditBox;

        const connectionLayout = new Node("ConnectionLayout").addComponent(Layout);
        connectionLayout.getComponent(UITransform).setAnchorPoint(0, 0.5);
        connectionLayout.type = Layout.Type.HORIZONTAL;
        connectionLayout.resizeMode = Layout.ResizeMode.CONTAINER;
        connectionLayout.spacingX = 5;

        const connectionLabel = createLabel("Label", style.propertyFontSize, Color.WHITE, 2, Color.BLACK, v2(0, 0.5));
        connectionLabel.string = "服务地址：";
        connectionLayout.node.addChild(connectionLabel.node);
        connectionLayout.node.addChild(serverEditBoxNode);
        connectionLayout.node.addChild(connectButton);
        connectionLayout.node.addChild(cancelConnectButton);
        connectionLayout.getComponent(UITransform).height = 30;
        const widget = connectionLayout.addComponent(Widget);
        widget.isAlignLeft = widget.isAlignTop = true;
        widget.left = 10;
        widget.top = 5;

        this._controlsContent.addChild(connectionLayout.node);

        const checkbox = createCheckBox("选择模式", 120, 32, 20, 16);
        checkbox.on(Toggle.EventType.TOGGLE, this.onCheckNodeToggleChange, this);
        checkbox.getComponent(Toggle).isChecked = false;
        this._controlsContent.addChild(checkbox);
    }

    protected changeState() {
        this._stateGraphics.fillColor = new Color("#ebb66bff");
        this._stateGraphics.fill();
    }

    protected onClickConnect() {
        creatorViewer.bridge.connect(this._serverAddressEditBox.string);
        this._connectButton.node.active = false;
        this._cancelConnectButton.node.active = true;
        this.changeState();
    }

    protected onClickCancel() {
        creatorViewer.bridge.close();
        this._connectButton.node.active = true;
        this._cancelConnectButton.node.active = false;
    }

    protected onClickDisconnect() {
        creatorViewer.bridge.close();
        this._connectButton.node.active = true;
        this._cancelConnectButton.node.active = false;
    }
}

if (!EDITOR) {
    function patchNode() {
        // 获取原始属性描述符
        const descriptor = Reflect.getOwnPropertyDescriptor(Node.prototype, 'name');
        if (descriptor && typeof descriptor.set === 'function') {
            const originalSetter = descriptor.set;

            Reflect.defineProperty(Node.prototype, 'name', {
                set(value: string) {
                    const uuid = this.uuid;
                    if (creatorViewer.allNodeInfosMap.has(uuid)) {
                        const nodeInfo = creatorViewer.allNodeInfosMap.get(uuid);
                        nodeInfo.onNodeNameChange(value);
                    }
                    // 用 Reflect.apply 来调用原始 setter
                    Reflect.apply(originalSetter, this, [value]);
                },
                get: descriptor.get, // 保持 getter 不变
                configurable: true,
                enumerable: true,
            });
        }
    }

    patchNode();

    director.on(Director.EVENT_BEFORE_SCENE_LOADING, (scene: Scene) => {
        creatorViewer.allNodeInfosMap.forEach(nodeInfo => nodeInfo.clearListeners());
        creatorViewer.allNodesMap.clear();
        creatorViewer.allNodeInfosMap.clear();
        creatorViewer.trackers.forEach(tracker => tracker.unTrack());
        creatorViewer.selectedNode = undefined;
    })

    director.on(Director.EVENT_AFTER_SCENE_LAUNCH, (scene: Scene) => {
        creatorViewer.allNodeInfosMap.forEach(nodeInfo => nodeInfo.clearListeners());
        creatorViewer.allNodesMap.clear();
        creatorViewer.allNodeInfosMap.clear();
        creatorViewer.sceneTree = walkNode(scene);
        creatorViewer.bridge.syncScene();
    })

    /** 创建前端面板（用于连接和部分客户端开关用） */
    function createCreatorViewDebugLayer() {
        // 添加到场景中
        const canvasNode = new Node("CreatorViewerPanelNode");
        creatorViewer.bridge = canvasNode.addComponent(ViewBridgeBase);
        const widget = canvasNode.addComponent(Widget);
        canvasNode.addComponent(Canvas);
        widget.isAlignBottom = widget.isAlignTop = widget.isAlignLeft = widget.isAlignRight = true;
        widget.bottom = widget.top = widget.left = widget.right = 0;
        director.addPersistRootNode(canvasNode);

        const touchCheckNode = new Node();
        const touchWidget = touchCheckNode.addComponent(Widget);
        touchWidget.isAlignBottom = touchWidget.isAlignTop = touchWidget.isAlignLeft = touchWidget.isAlignRight = true;
        touchWidget.bottom = touchWidget.top = touchWidget.left = touchWidget.right = 0;
        canvasNode.addChild(touchCheckNode);
        touchCheckNode.addComponent(TouchCheckContent);

        const floatingBar = new Node();
        floatingBar.addComponent(UITransform).setContentSize(100, 100);
        floatingBar.addComponent(FloatingActionButton);
        canvasNode.addChild(floatingBar);

        const floatingBarLabel = new Node().addComponent(Label);
        floatingBar.addChild(floatingBarLabel.node);
        floatingBarLabel.string = "👹";
        floatingBar.on(FloatingActionButton.EventType.ON_FLOATING_ACTION_BUTTON_CLICK, () => {
            panelNode.active = !panelNode.active;
        })

        const panelNode = new Node();
        panelNode.addComponent(CreatorViewerPanel).setTouchCheckNode(touchCheckNode);
        canvasNode.addChild(panelNode);
        panelNode.active = false;
    }

    createCreatorViewDebugLayer();
}