import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import ElementPlus from 'unplugin-element-plus/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
    plugins : [
        vue(),
        ElementPlus({
            useSource : false
        }),
        AutoImport({
            resolvers: [ElementPlusResolver()],
          }),
          Components({
            resolvers: [ElementPlusResolver()],
          }),
    ],
    build : {
        minify : true,
        sourcemap : true,
        rollupOptions : {
            preserveEntrySignatures: "allow-extension",
            input : {
                "main" : "source/main.ts",
                "panels/default" : "source/panels/default/index.ts"
            },
            output : {
                format: "cjs",
                assetFileNames : (chunkInfo)=>{
                    return chunkInfo.name as string;
                },
                entryFileNames: (chunkInfo)=>{
                    return `${chunkInfo.name}.js`;
                } ,

            },
            external : [ 'fs' , 'os', 'path', 'ws' ]
        }
    }
})