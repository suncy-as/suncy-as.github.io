'use strict';

/**
 * viz.js — 音频可视化核心
 *
 * 修复的关键 bug：
 *
 * 1. canvas 宽度初始化时机错误
 *    原代码在 DOMContentLoaded 中读 clientWidth，此时 Bootstrap
 *    响应式布局未渲染完毕，clientWidth 可能为 0，导致画布宽度=0
 *    → 改为使用 getBoundingClientRect() 并在每次绘制前同步
 *
 * 2. ctx.scale(dpr,dpr) 累积缩放
 *    resize 时多次调用 scale 会叠加，坐标系错乱
 *    → 改为每次绘制自行换算逻辑/物理像素，不依赖 transform 状态
 *
 * 3. AudioContext 必须在用户手势中创建
 *    原代码从异步 play 事件创建 AudioContext，部分浏览器拒绝
 *    → 移至播放按钮 click 事件（真正的用户手势）中调用
 *
 * 4. createMediaElementSource 只能调用一次
 *    加了 isConnected 守护，避免重复调用抛异常
 *
 * 5. 换曲时波形不刷新
 *    原代码没有重置 currentSrc，loadedmetadata 重复触发时被跳过
 *    → 加载样本时主动清空 viz.currentSrc
 *
 * 6. 频谱 canvas 尺寸同步
 *    原代码频谱动画中读 canvas.clientWidth，若初始化时为 0 则永远 0
 *    → 改为在动画帧中每次调用 _syncCanvas() 动态同步
 */

class AudioViz {
    /**
     * @param {object} cfg
     * @param {string} cfg.audioId       <audio> 元素 ID
     * @param {string} cfg.waveId        波形 canvas ID
     * @param {string} cfg.spectId       频谱 canvas ID
     * @param {string} cfg.infoPrefix    信息面板 span 前缀（inEar / restored / gold）
     * @param {object} cfg.colors        { wave: '#hex', top: '#hex', bot: '#hex' }
     */
    constructor(cfg) {
        this.audio       = document.getElementById(cfg.audioId);
        this.waveCanvas  = document.getElementById(cfg.waveId);
        this.spectCanvas = document.getElementById(cfg.spectId);
        this.prefix      = cfg.infoPrefix;
        this.colors      = cfg.colors;

        this.audioCtx    = null;
        this.analyser    = null;
        this.source      = null;
        this.rafId       = null;
        this.pcmData     = null;   // 解码后的 PCM Float32Array
        this.isConnected = false;
        this.currentSrc  = '';     // 已解码的 src，防重复解码

        // 初始占位
        this._drawMsg(this.waveCanvas,  '等待音频加载…', '#6b7280');
        this._drawMsg(this.spectCanvas, '点击播放后显示实时频谱', '#6b7280');

        // 监听事件
        this.audio.addEventListener('loadedmetadata', () => this._onMeta());
        this.audio.addEventListener('play',   () => {
            if (this.audioCtx?.state === 'suspended') this.audioCtx.resume();
            this._startSpect();
        });
        this.audio.addEventListener('pause',  () => this._stopSpect());
        this.audio.addEventListener('ended',  () => this._stopSpect());
        this.audio.addEventListener('error',  () => {
            this._drawMsg(this.waveCanvas,  '⚠ 音频加载失败', '#ef4444');
            this._drawMsg(this.spectCanvas, '⚠ 音频加载失败', '#ef4444');
        });

        // 窗口 resize → 重绘波形（频谱由 rAF 循环自动处理）
        const ro = new ResizeObserver(() => {
            if (this.pcmData) this._drawWave();
            else this._drawMsg(this.waveCanvas, '等待音频加载…', '#6b7280');
        });
        ro.observe(this.waveCanvas);
    }

    // ────────────────────────────────────────────────────────────
    //  公开方法：在用户点击播放按钮时调用（满足浏览器手势要求）
    // ────────────────────────────────────────────────────────────
    initCtx() {
        if (this.isConnected) {
            this.audioCtx?.resume();
            return;
        }
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.78;

            // createMediaElementSource 只能调一次
            this.source = this.audioCtx.createMediaElementSource(this.audio);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioCtx.destination);
            this.isConnected = true;
        } catch (e) {
            console.warn('[AudioViz] AudioContext 初始化失败:', e);
        }
    }

    // ────────────────────────────────────────────────────────────
    //  内部：loadedmetadata → fetch → decodeAudioData → 绘波形
    // ────────────────────────────────────────────────────────────
    async _onMeta() {
        const src = this.audio.currentSrc || this.audio.src;
        if (!src || src === this.currentSrc) return;
        this.currentSrc = src;

        // 先更新时长（直接从 audio 元素读）
        const dur = this.audio.duration;
        this._setInfo(isFinite(dur) ? dur.toFixed(2) : '…', '解码中…');

        this._drawMsg(this.waveCanvas, '正在解码波形…', '#94a3b8');

        try {
            const res = await fetch(src);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const ab = await res.arrayBuffer();

            // OfflineAudioContext 只用于解码，不影响播放
            const tmpCtx  = new OfflineAudioContext(1, 1, 44100);
            const decoded = await tmpCtx.decodeAudioData(ab);

            this.pcmData = decoded.getChannelData(0);
            this._drawWave();
            this._setInfo(decoded.duration.toFixed(2),
                          decoded.sampleRate.toLocaleString());
        } catch (e) {
            console.warn('[AudioViz] 波形解码失败:', e);
            this._drawMsg(this.waveCanvas, '波形解码失败\n（文件缺失或跨域限制）', '#f59e0b');
            // 信息面板降级显示
            const dur = this.audio.duration;
            this._setInfo(isFinite(dur) ? dur.toFixed(2) : '--', '--');
        }
    }

    // ────────────────────────────────────────────────────────────
    //  内部：同步 canvas 物理像素 → 返回绘图参数
    //  每次绘制前调用，保证高 DPI 清晰 + 尺寸始终正确
    // ────────────────────────────────────────────────────────────
    _sync(canvas) {
        const dpr  = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        // 只在尺寸有效时更新（避免隐藏状态下设为 0）
        if (rect.width > 0 && rect.height > 0) {
            const pw = Math.round(rect.width  * dpr);
            const ph = Math.round(rect.height * dpr);
            if (canvas.width !== pw || canvas.height !== ph) {
                canvas.width  = pw;
                canvas.height = ph;
            }
        }

        return {
            ctx: canvas.getContext('2d'),
            W:   canvas.width,          // 物理像素宽
            H:   canvas.height,         // 物理像素高
            dpr,
        };
    }

    // ────────────────────────────────────────────────────────────
    //  内部：绘制静态时域波形（min/max 柱状，每逻辑像素一列）
    // ────────────────────────────────────────────────────────────
    _drawWave() {
        if (!this.pcmData) return;
        const { ctx, W, H, dpr } = this._sync(this.waveCanvas);
        if (W === 0 || H === 0) return;

        const data = this.pcmData;
        const cols = Math.floor(W / dpr);   // 逻辑像素列数
        const step = Math.max(1, Math.floor(data.length / cols));

        ctx.clearRect(0, 0, W, H);

        // 背景
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);

        // 中心轴线
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(0, Math.floor(H / 2), W, dpr);

        // 波形渐变色
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0,   this.colors.top  + 'aa');
        grad.addColorStop(0.5, this.colors.wave);
        grad.addColorStop(1,   this.colors.bot  + 'aa');
        ctx.fillStyle = grad;

        // 每列对应一段 PCM，取 min/max 绘制矩形柱
        for (let col = 0; col < cols; col++) {
            let min = 1, max = -1;
            const base = Math.floor(col * step);
            for (let s = 0; s < step; s++) {
                const v = data[base + s] ?? 0;
                if (v < min) min = v;
                if (v > max) max = v;
            }
            // [-1, 1] → [0, H] (物理像素)
            const yTop = Math.round(((1 - max) / 2) * H);
            const yBot = Math.round(((1 - min) / 2) * H);
            const barH = Math.max(dpr, yBot - yTop);
            ctx.fillRect(col * dpr, yTop, dpr, barH);
        }
    }

    // ────────────────────────────────────────────────────────────
    //  内部：实时频谱 rAF 动画
    // ────────────────────────────────────────────────────────────
    _startSpect() {
        if (!this.analyser) return;
        this._stopSpect();

        const bufLen  = this.analyser.frequencyBinCount;
        const freqBuf = new Uint8Array(bufLen);
        const c       = this.colors;

        const frame = () => {
            this.rafId = requestAnimationFrame(frame);
            this.analyser.getByteFrequencyData(freqBuf);

            const { ctx, W, H, dpr } = this._sync(this.spectCanvas);
            if (W === 0 || H === 0) return;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#0d1117';
            ctx.fillRect(0, 0, W, H);

            // 显示前 65% 的频率 bin（主要能量区间）
            const bins = Math.floor(bufLen * 0.65);
            const bw   = W / bins;          // 每条柱的物理像素宽

            const grad = ctx.createLinearGradient(0, H, 0, 0);
            grad.addColorStop(0,   c.bot);
            grad.addColorStop(0.5, c.wave);
            grad.addColorStop(1,   c.top);
            ctx.fillStyle = grad;

            for (let i = 0; i < bins; i++) {
                const barH = (freqBuf[i] / 255) * H;
                ctx.fillRect(i * bw, H - barH, Math.max(1, bw - 1), barH);
            }

            // 频率刻度标注
            const sr  = this.audioCtx?.sampleRate ?? 44100;
            const max = sr / 2 * 0.65;
            ctx.font      = `${Math.round(10 * dpr)}px sans-serif`;
            ctx.fillStyle = 'rgba(255,255,255,0.38)';
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth   = dpr;

            [500, 1000, 2000, 4000, 8000].forEach(f => {
                if (f > max) return;
                const x = (f / max) * W;
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
                ctx.fillText(f >= 1000 ? f / 1000 + 'k' : f, x + 2 * dpr, 11 * dpr);
            });
        };

        frame();
    }

    _stopSpect() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    // ────────────────────────────────────────────────────────────
    //  内部：通用文字占位/错误绘制
    // ────────────────────────────────────────────────────────────
    _drawMsg(canvas, msg, color) {
        const { ctx, W, H, dpr } = this._sync(canvas);
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle    = color;
        ctx.font         = `${Math.round(12 * dpr)}px sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        const lines = msg.split('\n');
        const lh    = 18 * dpr;
        lines.forEach((l, i) =>
            ctx.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * lh)
        );
        ctx.textAlign    = 'start';
        ctx.textBaseline = 'alphabetic';
    }

    // ────────────────────────────────────────────────────────────
    //  内部：更新信息面板
    // ────────────────────────────────────────────────────────────
    _setInfo(duration, sampleRate) {
        const d = document.getElementById(this.prefix + 'Duration');
        const s = document.getElementById(this.prefix + 'SampleRate');
        if (d) d.textContent = duration;
        if (s) s.textContent = sampleRate;
    }
}

// ================================================================
//  页面主逻辑
// ================================================================
document.addEventListener('DOMContentLoaded', () => {

    // 三通道配置
    const CONFIGS = [
        {
            audioId    : 'inEarAudio',
            waveId     : 'inEarWaveform',
            spectId    : 'inEarSpectrogram',
            infoPrefix : 'inEar',
            playBtnId  : 'inEarPlayBtn',
            pauseBtnId : 'inEarPauseBtn',
            dlBtnId    : 'inEarDownloadBtn',
            srcFn      : s => `assets/audio/in-ear/${s}.wav`,
            colors     : { wave: '#fbbf24', top: '#f59e0b', bot: '#78350f' },
        },
        {
            audioId    : 'restoredAudio',
            waveId     : 'restoredWaveform',
            spectId    : 'restoredSpectrogram',
            infoPrefix : 'restored',
            playBtnId  : 'restoredPlayBtn',
            pauseBtnId : 'restoredPauseBtn',
            dlBtnId    : 'restoredDownloadBtn',
            srcFn      : s => `assets/audio/restored/${s}.wav`,
            colors     : { wave: '#4ade80', top: '#22c55e', bot: '#14532d' },
        },
        {
            audioId    : 'goldAudio',
            waveId     : 'goldWaveform',
            spectId    : 'goldSpectrogram',
            infoPrefix : 'gold',
            playBtnId  : 'goldPlayBtn',
            pauseBtnId : 'goldPauseBtn',
            dlBtnId    : 'goldDownloadBtn',
            srcFn      : s => `assets/audio/gold-standard/${s}.wav`,
            colors     : { wave: '#38bdf8', top: '#0ea5e9', bot: '#0c4a6e' },
        },
    ];

    // 实例化
    const vizMap = {};
    CONFIGS.forEach(cfg => { vizMap[cfg.audioId] = new AudioViz(cfg); });

    // 按钮绑定
    CONFIGS.forEach(cfg => {
        const audio = document.getElementById(cfg.audioId);
        const viz   = vizMap[cfg.audioId];

        // 播放按钮：在用户手势中初始化 AudioContext
        document.getElementById(cfg.playBtnId).addEventListener('click', () => {
            viz.initCtx();
            audio.play().catch(e => console.warn('播放失败:', e));
        });

        // 暂停
        document.getElementById(cfg.pauseBtnId).addEventListener('click', () => {
            audio.pause();
        });

        // 下载
        document.getElementById(cfg.dlBtnId).addEventListener('click', () => {
            const href = audio.currentSrc || audio.src;
            const a = Object.assign(document.createElement('a'), {
                href,
                download: href.split('/').pop(),
            });
            a.click();
        });
    });

    // 加载样本
    let currentSample = '样本1';

    function loadSample(sample) {
        currentSample = sample;
        CONFIGS.forEach(cfg => {
            const audio = document.getElementById(cfg.audioId);
            const viz   = vizMap[cfg.audioId];
            viz.currentSrc = '';      // 清空已解码标记，触发重新解码
            audio.src = cfg.srcFn(sample);
            audio.load();
        });
    }

    document.getElementById('loadSampleBtn').addEventListener('click', () => {
        loadSample(document.getElementById('sampleSelect').value);
    });

    document.getElementById('sampleSelect').addEventListener('change', e => {
        currentSample = e.target.value;
    });

    // 重置
    document.getElementById('resetBtn').addEventListener('click', () => {
        CONFIGS.forEach(cfg => {
            const audio = document.getElementById(cfg.audioId);
            audio.pause();
            audio.currentTime = 0;
        });
    });
});
