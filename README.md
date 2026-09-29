# VoiceClean · 耳内语音复原演示

纯静态的听感演示页，托管于 GitHub Pages：<https://suncy-as.github.io>

## 内容

- **首屏**：VoiceClean 简介与实时波形主视觉
- **试听**：5 段真实耳内录音，每段可切换「耳内原始 / VoiceClean 复原 / 洁净参考」三种状态。
  播放中可随时切换，声音不会中断；支持拖动进度与循环播放。
- **场景**：6 类典型使用场景

## 文件结构

    index.html              页面
    assets/style.css        样式
    assets/app.js           播放器与实时频谱可视化
    assets/waveforms.js     预计算的波形包络与样例顺序
    assets/audio/           15 个音频片段（5 样例 × 3 状态）

## 本地预览

直接双击 `index.html` 即可；或用任意静态服务器：

    python -m http.server 8000

## 数据说明

音频取自消声室同步录制的真实耳内录音，每段约 2 秒，未做合成或拼接。
三路音轨已做等响度对齐——它们响度相同，你听到的差别来自清晰度本身。
