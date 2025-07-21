import { App, createApp } from 'vue';
import AppTemplate from './App.vue';
const panelDataMap = new WeakMap<any, App>();
/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }
module.exports = Editor.Panel.define({
    listeners: {
        show() { console.log('show'); },
        hide() { console.log('hide'); },
    },
    template: `
        <div style="height:100%">
            <div id="app" style="height:100%">
                <App style="height:100%"></App>
            </div>
        </div>
    `,
    style: ``,
    $: {
        app: '#app',
        text: '#text',
    },
    methods: {
        hello() {
        },
    },
    ready() {
        if (this.$.app) {
            const app = createApp(AppTemplate);
            app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
            app.mount(this.$.app);
            panelDataMap.set(this, app);
        }
    },
    beforeClose() { },
    close() {
        const app = panelDataMap.get(this);
        if (app) {
            app.unmount();
        }
    },
});
