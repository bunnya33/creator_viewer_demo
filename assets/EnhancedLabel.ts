import { _decorator, Label } from 'cc';
const { ccclass, property } = _decorator;

function truncateString(inputString: string, maxLength: number, replaceString: string = "......"): string {
    let length = 0;
    let outputString = '';

    for (let i = 0; i < inputString.length; i++) {
        const character = inputString[i];

        if (/[\u4e00-\u9fff]/.test(character)) {
            length += 2;
        }
        else {
            length += 1;
        }

        if (length <= maxLength) {
            outputString += character;
        } else {
            break;
        }
    }

    if (length > maxLength) {
        outputString += replaceString;
    }

    return outputString;
}

/** 增强文本 */
@ccclass('EnhancedLabel')
export class EnhancedLabel extends Label {
    @property
    protected _maxTruncateLength : number = 0;

    @property({ visible : true, tooltip : "最大截断字符（0为不截断）"})
    get maxTruncateLength() {
        return this._maxTruncateLength;
    }

    set maxTruncateLength(value : number) {
        this._maxTruncateLength = Math.ceil(value);
        this.setText(this._sourceText);
    }

    @property
    protected _truncateReplaceText : string = "...";

    @property({ visible : true, tooltip : "达到截断字符后的替换字符串"})
    get truncateReplaceText() {
        return this._truncateReplaceText;
    }

    set truncateReplaceText(value : string) {
        this._truncateReplaceText = value;
        this.setText(this._sourceText);
    }

    @property
    protected _sourceText : string = '';

    @property({ visible : true })
    protected _showWithLocalization : boolean = true;


    get string (): string {
        return this._string;
    }

    /** 
     * @deprecated 弃用此种用法，改用setText设置文本
     */
    private set string (value) {
        if (value === null || value === undefined) {
            value = '';
        } else {
            value = value.toString();
        }
        this._sourceText = value;
        if(this._maxTruncateLength > 0) {
            value = truncateString(value, this._maxTruncateLength, this._truncateReplaceText);
        }

        if (this._string === value) {
            return;
        }

        this._string = value;
        this.markForUpdateRenderData();
    }

    setText(text : string | number, ...args : any[]) {
        this.string = text.toString();
    }

    setScore(score : number, withSymbol : boolean = false, prefix : string = "", suffixes : string = "") {
        this.setText(prefix + score + suffixes);
    }
}


