
const table = 'fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF';
const xor = 177451812;
const add = 8728348608;
const s = [11, 10, 3, 8, 4, 6];
const pow58 = [1, 58, 3364, 195112, 11316496, 656356768];

class videoSecret {
    private tr: Map<string, number>;

    constructor() {
        this.tr = new Map();
        this.init();
    }

    /**
    * @description 初始化加密tr表
    */
    private init(): void {
        for (let i = 0; i < 58; i++) {
            this.tr.set(table[i], i);
        }
    }

    /**
     * @description 用于视频解码，将bvid转化为avids
     * @param bvid 传入值为视频 vid
     * @returns 默认 0 否则为视频 id
     */
    public dec(bvid: string | undefined): number {
        if (typeof bvid === 'undefined' || !bvid) throw new Error('Invalid bvid');
        let r = 0;
        for (let i = 0; i < 6; i++) {
            const val = this.tr.get(bvid.charAt(s[i]));
            if (val === undefined) throw new Error('Invalid bvid character');
            r += val * pow58[i];
        }
        return (r - add) ^ xor;
    }

    /**
     * 
     * @description 用域视频的编码，将avid转化为bvid
     * @param avid 传入值为视频 id
     * @returns 默认 '' bvid 返回值为视频的 vid
     */
    public enc(avid: number | undefined): string {
        if (typeof avid === 'undefined' || isNaN(avid)) throw new Error('Invalid avid');
        avid = (avid ^ xor) + add;
        const r = ['C', 'V', '1', ' ', ' ', '4', ' ', '1', ' ', '7', ' ', ' '];
        for (let i = 0; i < 6; i++) {
            r[s[i]] = table[Math.floor(avid / pow58[i]) % 58];
        }
        return r.join('');
    }
}

const vSecrte: videoSecret = new videoSecret();

export default vSecrte;