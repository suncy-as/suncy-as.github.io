# 音频对比与恢复效果展示 - GitHub Pages版本

基于纯前端技术的音频对比与恢复效果展示网站，专为GitHub Pages静态托管优化。

## ✨ 功能特性

- 🎵 **三栏音频对比**: 耳内音频、恢复音频、金标准音频
- 📊 **专业可视化**: 波形图、频谱图、对比图表
- 🔢 **量化评估**: SNR计算、质量评分、进度条展示
- 📱 **响应式设计**: 适配手机、平板、桌面设备
- ⚡ **纯前端实现**: 无需后端服务器，GitHub Pages原生支持

## 🚀 快速部署

### 步骤1: 创建GitHub仓库
1. 登录GitHub
2. 点击右上角 "+" → "New repository"
3. 输入仓库名称，如 `InEarAudioShow`
4. 选择 "Public" 可见性
5. 点击 "Create repository"

### 步骤2: 上传文件
将 `github-pages` 目录下的所有文件上传到仓库根目录：

```bash
# 克隆仓库
git clone https://github.com/你的用户名/InEarAudioShow.git
cd InEarAudioShow

# 复制文件
cp -r path/to/github-pages/* .

# 提交更改
git add .
git commit -m "添加音频对比网站"
git push
```

### 步骤3: 启用GitHub Pages
1. 访问仓库设置
2. 选择 "Pages" 选项
3. 设置源分支为 `main` 或 `master`
4. 设置根目录为 `/`
5. 点击 "Save"

### 步骤4: 访问网站
等待几分钟后，访问：
```
https://你的用户名.github.io/InEarAudioShow/
```

## 📁 文件结构

```
.github/
└── workflows/
    └── deploy.yml          # 自动部署工作流
assets/
├── audio/                  # 音频文件目录
│   ├── in-ear/            # 耳内音频
│   ├── restored/          # 恢复音频
│   └── gold-standard/     # 金标准音频
└── images/                # 图片资源
css/
└── style.css             # 主样式表
js/
├── audio-processor.js    # 音频处理逻辑
├── visualization.js      # 可视化组件
└── app.js               # 主应用逻辑
index.html               # 主页面
.nojekyll                # 禁用Jekyll处理
README.md                # 本文件
```

## 🎮 使用指南

### 1. 添加音频文件
将您的音频文件放入对应目录：
- `assets/audio/in-ear/` - 耳内音频
- `assets/audio/restored/` - 恢复音频
- `assets/audio/gold-standard/` - 金标准音频

支持格式：WAV, MP3, OGG

### 2. 配置音频URL
在 `js/app.js` 中更新音频URL配置：

```javascript
this.audioUrls = {
    '00035': {
        inEar: 'assets/audio/in-ear/00035.wav',
        restored: 'assets/audio/restored/00035.wav',
        gold: 'assets/audio/gold-standard/00035.wav'
    }
    // 添加更多样本...
};
```

### 3. 自定义样式
修改 `css/style.css` 文件：
- 调整颜色主题
- 修改布局样式
- 添加自定义动画

## 🔧 开发指南

### 本地开发
```bash
# 使用Python启动本地服务器
python -m http.server 8000

# 或使用Live Server扩展
# 在VS Code中安装Live Server扩展
```

### 浏览器兼容性
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

### 技术栈
- **HTML5 Audio API**: 音频播放和控制
- **Wavesurfer.js**: 专业波形可视化
- **Chart.js**: 数据图表渲染
- **Bootstrap 5**: 响应式布局
- **ES6 JavaScript**: 现代JavaScript语法

## 📊 功能模块

### 音频处理器 (`audio-processor.js`)
- 音频文件加载和解析
- SNR（信噪比）计算
- 频谱特征提取
- 音频质量评估

### 可视化模块 (`visualization.js`)
- 波形图渲染
- 频谱图生成
- 对比图表显示
- 进度条更新

### 主应用 (`app.js`)
- 应用状态管理
- 用户交互处理
- 模块间协调
- 错误处理

## ⚙️ 配置选项

### 波形图配置
```javascript
WaveSurfer.create({
    waveColor: '#4A90E2',      // 波形颜色
    progressColor: '#2E5EAA',  // 进度颜色
    cursorColor: '#FF5722',    // 光标颜色
    barWidth: 2,              // 条形宽度
    height: 100               // 波形高度
});
```

### 图表配置
```javascript
new Chart(ctx, {
    type: 'line',            // 图表类型
    data: {...},            // 数据
    options: {
        responsive: true,   // 响应式
        maintainAspectRatio: false // 保持宽高比
    }
});
```

## 🚨 故障排除

### 问题1: 音频无法播放
- 检查浏览器控制台错误
- 确保音频文件格式受支持
- 检查文件路径是否正确

### 问题2: 图表不显示
- 检查Chart.js是否加载
- 确保Canvas元素存在
- 查看JavaScript控制台错误

### 问题3: GitHub Pages不更新
- 等待几分钟缓存更新
- 检查GitHub Actions状态
- 清除浏览器缓存

### 问题4: 移动端显示异常
- 检查Bootstrap响应式类
- 测试不同屏幕尺寸
- 查看CSS媒体查询

## 📈 性能优化

### 音频优化
- 压缩音频文件大小
- 使用适当的音频格式
- 实现懒加载

### 代码优化
- 压缩JavaScript和CSS
- 使用CDN加载库
- 实现代码分割

### 缓存策略
- 设置HTTP缓存头
- 使用Service Worker
- 实现离线功能

## 🔒 安全考虑

### 内容安全策略 (CSP)
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://cdn.jsdelivr.net; 
               style-src 'self' https://cdn.jsdelivr.net;">
```

### 输入验证
- 验证音频文件类型
- 限制文件大小
- 清理用户输入

## 🌐 国际化

支持多语言配置：
```javascript
const i18n = {
    'zh-CN': {
        title: '音频对比与恢复效果展示',
        // 更多翻译...
    },
    'en-US': {
        title: 'Audio Comparison & Restoration Demo',
        // 更多翻译...
    }
};
```

## 📝 许可证

本项目基于MIT许可证开源，允许自由使用、修改和分发。

## 🤝 贡献指南

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 📞 支持

如有问题或建议：
1. 创建Issue
2. 发送邮件至开发者
3. 提交Pull Request

---

**注意**: 本应用为纯前端实现，所有音频处理在浏览器中完成。
确保使用现代浏览器以获得最佳体验。