import { readFileSync } from "fs-extra";
import { join } from "path";
import 'element-plus/theme-chalk/dark/css-vars.css'

export default function ElCssLoader(node : HTMLElement | undefined) {
    if(!node) return;
    const fontBuffer = readFileSync(join(__dirname, '../fonts/fira.ttf'));
    const base64Font = fontBuffer.toString('base64');
    let css = readFileSync(join(__dirname, "./../default.css"), "utf8") + `
    @font-face {
      font-family: 'Fira';
      src: url(data:font/truetype;charset=utf-8;base64,${base64Font}) format('truetype');
      font-weight: normal;
      font-style: normal;
    }

    div {
      font-family: 'Fira' !important;
    }
    `;

    let style = document.createElement('style');
    style.textContent = css;
    node.appendChild(style);

    style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    document.documentElement.classList.add('dark');
}