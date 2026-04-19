/**
 * 主应用逻辑
 * 协调音频处理器和可视化模块
 */

class AudioComparisonApp {
    constructor() {
        this.currentSample = '样本1';
        this.isLoading = false;
        this.isInitialized = false;

        // 音频文件URL模板
        this.audioUrls = {
            '样本1': {
                inEar: 'assets/audio/in-ear/样本1.wav',
                restored: 'assets/audio/restored/样本1.wav',
                gold: 'assets/audio/gold-standard/样本1.wav'
            },
            '样本2': {
                inEar: 'assets/audio/in-ear/样本2.wav',
                restored: 'assets/audio/restored/样本2.wav',
                gold: 'assets/audio/gold-standard/样本2.wav'
            },
            'sample_2': {
                inEar: 'assets/audio/in-ear/sample_2.wav',
                restored: 'assets/audio/restored/sample_2.wav',
                gold: 'assets/audio/gold-standard/sample_2.wav'
            }
        };

        // 初始化应用
        this.initialize();
    }

    /**
     * 初始化应用
     */
    async initialize() {
        console.log('初始化音频对比应用...');

        // 检查是否通过file://协议访问
        if (window.location.protocol === 'file:') {
            console.warn('当前通过file://协议访问，正在尝试加载音频文件...');
            this.showError('⚠️ 当前通过本地文件访问，正在尝试加载音频文件。如果无法加载，将自动使用模拟数据进行演示。');
        } else {
            console.log('通过HTTP协议访问，正常加载音频文件');
        }

        try {
            // 初始化音频处理器
            await window.audioProcessor.initialize();

            // 初始化可视化
            window.visualization.initializeWaveforms();
            window.visualization.initializeSpectrograms();
            // 注意：已移除量化指标部分，无需初始化对比图表
            // window.visualization.initializeComparisonCharts();

            // 设置事件监听
            this.setupEventListeners();

            // 加载默认样本
            await this.loadSample(this.currentSample);

            this.isInitialized = true;
            console.log('应用初始化完成');

        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showError('应用初始化失败，请刷新页面重试');
        }
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 样本选择
        document.getElementById('sampleSelect').addEventListener('change', (e) => {
            this.currentSample = e.target.value;
            this.loadSample(this.currentSample);
        });

        // 加载按钮
        document.getElementById('loadSampleBtn').addEventListener('click', () => {
            this.loadSample(this.currentSample);
        });

        // 重置按钮
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
        });

        // 音频播放控制
        this.setupAudioControls();
    }

    /**
     * 设置音频播放控制
     */
    setupAudioControls() {
        // 耳内音频控制
        document.getElementById('inEarPlayBtn').addEventListener('click', () => {
            const audio = document.getElementById('inEarAudio');
            audio.play();
        });

        document.getElementById('inEarPauseBtn').addEventListener('click', () => {
            const audio = document.getElementById('inEarAudio');
            audio.pause();
        });

        document.getElementById('inEarDownloadBtn').addEventListener('click', () => {
            this.downloadAudio('inEar');
        });

        // 恢复音频控制
        document.getElementById('restoredPlayBtn').addEventListener('click', () => {
            const audio = document.getElementById('restoredAudio');
            audio.play();
        });

        document.getElementById('restoredPauseBtn').addEventListener('click', () => {
            const audio = document.getElementById('restoredAudio');
            audio.pause();
        });

        document.getElementById('restoredDownloadBtn').addEventListener('click', () => {
            this.downloadAudio('restored');
        });

        // 金标准音频控制
        document.getElementById('goldPlayBtn').addEventListener('click', () => {
            const audio = document.getElementById('goldAudio');
            audio.play();
        });

        document.getElementById('goldPauseBtn').addEventListener('click', () => {
            const audio = document.getElementById('goldAudio');
            audio.pause();
        });

        document.getElementById('goldDownloadBtn').addEventListener('click', () => {
            this.downloadAudio('gold');
        });
    }

    /**
     * 加载音频样本
     * @param {string} sampleId - 样本ID
     */
    async loadSample(sampleId) {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading(true);

        try {
            console.log(`正在加载样本: ${sampleId}`);

            const urls = this.audioUrls[sampleId];
            if (!urls) {
                throw new Error(`样本 ${sampleId} 不存在`);
            }

            // 加载所有音频文件（即使失败也会继续）
            await this.loadAllAudioFiles(urls);

            // 更新波形图
            this.updateWaveforms(urls);

            // 计算并更新指标
            this.updateMetrics();

            // 更新音频信息
            this.updateAudioInfo();

            console.log(`样本加载完成: ${sampleId}`);

        } catch (error) {
            console.error(`样本加载过程中出错:`, error);
            // 即使出错，也尝试显示模拟数据
            this.showError(`音频加载遇到问题，正在显示模拟数据: ${error.message}`);

            // 确保可视化仍然工作
            this.updateSpectrograms();
            this.updateAudioInfo();
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    /**
     * 加载所有音频文件
     * @param {object} urls - 音频URL对象
     */
    async loadAllAudioFiles(urls) {
        const loadPromises = [];

        // 加载耳内音频
        if (urls.inEar) {
            loadPromises.push(
                window.audioProcessor.loadAudio(urls.inEar, 'inEar')
                    .catch(err => console.error('耳内音频加载失败:', err))
            );
        }

        // 加载恢复音频
        if (urls.restored) {
            loadPromises.push(
                window.audioProcessor.loadAudio(urls.restored, 'restored')
                    .catch(err => console.error('恢复音频加载失败:', err))
            );
        }

        // 加载金标准音频
        if (urls.gold) {
            loadPromises.push(
                window.audioProcessor.loadAudio(urls.gold, 'gold')
                    .catch(err => console.error('金标准音频加载失败:', err))
            );
        }

        // 等待所有音频加载完成
        await Promise.allSettled(loadPromises);
    }

    /**
     * 更新波形图
     * @param {object} urls - 音频URL对象
     */
    updateWaveforms(urls) {
        // 尝试从audioProcessor获取音频缓冲
        const audioBuffers = {
            'inEar': window.audioProcessor.audioBuffers?.inEar,
            'restored': window.audioProcessor.audioBuffers?.restored,
            'gold': window.audioProcessor.audioBuffers?.gold
        };

        // 更新耳内音频波形
        if (audioBuffers.inEar) {
            // 如果有音频缓冲，直接从缓冲加载
            window.visualization.loadAudioFromBuffer('inEar', audioBuffers.inEar);
        } else if (urls.inEar) {
            // 否则使用URL加载
            window.visualization.loadAudioToWaveform('inEar', urls.inEar);
        } else {
            // 都没有，使用模拟数据
            window.visualization.loadMockWaveform('inEar');
        }

        // 更新恢复音频波形
        if (audioBuffers.restored) {
            window.visualization.loadAudioFromBuffer('restored', audioBuffers.restored);
        } else if (urls.restored) {
            window.visualization.loadAudioToWaveform('restored', urls.restored);
        } else {
            window.visualization.loadMockWaveform('restored');
        }

        // 更新金标准音频波形
        if (audioBuffers.gold) {
            window.visualization.loadAudioFromBuffer('gold', audioBuffers.gold);
        } else if (urls.gold) {
            window.visualization.loadAudioToWaveform('gold', urls.gold);
        } else {
            window.visualization.loadMockWaveform('gold');
        }
    }

    /**
     * 更新音频指标
     */
    updateMetrics() {
        // 计算对比指标（仅用于日志）
        const metrics = window.audioProcessor.calculateComparisonMetrics();
        if (metrics) {
            console.log('音频指标计算完成', metrics);
        } else {
            console.warn('无法计算音频指标，将显示模拟频谱图');
        }

        // 更新频谱图（模拟数据）
        this.updateSpectrograms();
    }

    /**
     * 更新频谱图（模拟数据）
     */
    updateSpectrograms() {
        // 为不同类型生成不同的模拟频谱数据
        const simulateSpectrumData = (type) => {
            const frequencies = [];
            const magnitudes = [];

            for (let i = 0; i < 100; i++) {
                const freq = 20 * Math.pow(10, i / 100 * 3);
                frequencies.push(freq);

                // 基础频谱形状
                const base = Math.exp(-Math.pow(Math.log10(freq/1000), 2));
                let magnitude = 0;

                // 根据音频类型调整
                if (type === 'gold') {
                    magnitude = base * 0.7 + 0.1 * Math.exp(-Math.pow(Math.log10(freq/3000), 2));
                } else if (type === 'inEar') {
                    magnitude = base * 0.5 + 0.05 * Math.random();
                    magnitude *= Math.exp(-freq / 8000); // 高频衰减
                } else if (type === 'restored') {
                    magnitude = base * 0.6 + 0.08 * Math.exp(-Math.pow(Math.log10(freq/2000), 2));
                    magnitude *= Math.exp(-freq / 12000); // 较少的高频衰减
                }

                // 确保值在0-0.8之间
                magnitude = Math.max(0, Math.min(0.8, magnitude));
                magnitudes.push(magnitude);
            }

            return { frequencies, magnitudes };
        };

        // 更新各音频的频谱图
        window.visualization.updateSpectrogram('inEar', simulateSpectrumData('inEar'));
        window.visualization.updateSpectrogram('restored', simulateSpectrumData('restored'));
        window.visualization.updateSpectrogram('gold', simulateSpectrumData('gold'));
    }

    /**
     * 更新音频信息
     */
    updateAudioInfo() {
        // 获取音频处理器中的时长信息
        const audioProcessor = window.audioProcessor;

        // 更新耳内音频信息
        const inEarDuration = audioProcessor.getAudioDuration('inEar');
        const inEarSampleRate = audioProcessor.getAudioSampleRate('inEar');

        if (inEarDuration > 0) {
            // 显示实际音频数据
            document.getElementById('inEarDuration').textContent = inEarDuration.toFixed(2);
            document.getElementById('inEarSampleRate').textContent = inEarSampleRate.toLocaleString();
            console.log(`耳内音频信息: ${inEarDuration.toFixed(2)}s, ${inEarSampleRate}Hz`);
        } else {
            // 显示模拟数据（使用处理器中的lastRealDuration或默认2秒）
            const defaultDuration = audioProcessor.lastRealDuration || 2.0;
            document.getElementById('inEarDuration').textContent = defaultDuration.toFixed(2);
            document.getElementById('inEarSampleRate').textContent = '16,000';
            console.log(`耳内音频使用模拟数据: ${defaultDuration.toFixed(2)}s`);
        }

        // 更新恢复音频信息
        const restoredDuration = audioProcessor.getAudioDuration('restored');
        const restoredSampleRate = audioProcessor.getAudioSampleRate('restored');

        if (restoredDuration > 0) {
            document.getElementById('restoredDuration').textContent = restoredDuration.toFixed(2);
            document.getElementById('restoredSampleRate').textContent = restoredSampleRate.toLocaleString();
        } else {
            const defaultDuration = audioProcessor.lastRealDuration || 2.0;
            document.getElementById('restoredDuration').textContent = defaultDuration.toFixed(2);
            document.getElementById('restoredSampleRate').textContent = '16,000';
        }

        // 更新金标准音频信息
        const goldDuration = audioProcessor.getAudioDuration('gold');
        const goldSampleRate = audioProcessor.getAudioSampleRate('gold');

        if (goldDuration > 0) {
            document.getElementById('goldDuration').textContent = goldDuration.toFixed(2);
            document.getElementById('goldSampleRate').textContent = goldSampleRate.toLocaleString();
        } else {
            const defaultDuration = audioProcessor.lastRealDuration || 2.0;
            document.getElementById('goldDuration').textContent = defaultDuration.toFixed(2);
            document.getElementById('goldSampleRate').textContent = '16,000';
        }
    }

    /**
     * 下载音频文件
     * @param {string} type - 音频类型
     */
    downloadAudio(type) {
        const urls = this.audioUrls[this.currentSample];
        if (!urls) return;

        const url = urls[type.toLowerCase()];
        if (!url) return;

        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}_${this.currentSample}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * 重置应用
     */
    reset() {
        // 清理资源
        window.audioProcessor.cleanup();
        window.visualization.cleanup();

        // 重置UI
        this.resetUI();

        // 重新初始化
        setTimeout(() => {
            this.initialize();
        }, 500);
    }

    /**
     * 重置UI
     */
    resetUI() {
        // 重置音频信息
        document.getElementById('inEarDuration').textContent = '--';
        document.getElementById('inEarSampleRate').textContent = '--';
        document.getElementById('restoredDuration').textContent = '--';
        document.getElementById('restoredSampleRate').textContent = '--';
        document.getElementById('goldDuration').textContent = '--';
        document.getElementById('goldSampleRate').textContent = '--';
    }

    /**
     * 显示/隐藏加载状态
     * @param {boolean} show - 是否显示加载状态
     */
    showLoading(show) {
        const loadBtn = document.getElementById('loadSampleBtn');
        if (show) {
            loadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>加载中...';
            loadBtn.disabled = true;
            document.body.classList.add('loading');
        } else {
            loadBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>加载样本';
            loadBtn.disabled = false;
            document.body.classList.remove('loading');
        }
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误信息
     */
    showError(message) {
        const alertHtml = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        // 在主容器顶部插入错误提示
        const mainContainer = document.querySelector('main.container');
        if (mainContainer) {
            mainContainer.insertAdjacentHTML('afterbegin', alertHtml);
        }

        // 5秒后自动移除
        setTimeout(() => {
            const alert = document.querySelector('.alert-danger');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    /**
     * 显示成功信息
     * @param {string} message - 成功信息
     */
    showSuccess(message) {
        const alertHtml = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        const mainContainer = document.querySelector('main.container');
        if (mainContainer) {
            mainContainer.insertAdjacentHTML('afterbegin', alertHtml);
        }

        setTimeout(() => {
            const alert = document.querySelector('.alert-success');
            if (alert) {
                alert.remove();
            }
        }, 3000);
    }
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 检查浏览器兼容性
    if (!('AudioContext' in window || 'webkitAudioContext' in window)) {
        alert('您的浏览器不支持Web Audio API，部分功能可能无法正常使用。\n\n建议使用最新版的Chrome、Firefox或Edge浏览器。');
    }

    // 初始化应用
    window.app = new AudioComparisonApp();
});

// 全局辅助函数
window.audioComparisonApp = {
    /**
     * 手动加载样本
     * @param {string} sampleId - 样本ID
     */
    loadSample: function(sampleId) {
        if (window.app) {
            window.app.loadSample(sampleId);
        }
    },

    /**
     * 重置应用
     */
    reset: function() {
        if (window.app) {
            window.app.reset();
        }
    },

    /**
     * 获取当前状态
     */
    getStatus: function() {
        return window.app ? {
            initialized: window.app.isInitialized,
            loading: window.app.isLoading,
            currentSample: window.app.currentSample
        } : null;
    }
};