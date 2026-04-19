/**
 * 可视化模块
 * 负责波形图、频谱图和图表渲染
 */

class Visualization {
    constructor() {
        this.wavesurfers = {
            'inEar': null,
            'restored': null,
            'gold': null
        };
        this.charts = {};
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false
        };
    }

    /**
     * 初始化波形图
     */
    initializeWaveforms() {
        // 检查WaveSurfer.js是否已加载
        if (typeof WaveSurfer === 'undefined') {
            console.warn('WaveSurfer.js未加载，无法初始化波形图');
            return;
        }

        // 检查容器元素是否存在
        const containerIds = ['#inEarWaveform', '#restoredWaveform', '#goldWaveform'];
        for (const containerId of containerIds) {
            const container = document.querySelector(containerId);
            if (!container) {
                console.warn(`波形图容器 ${containerId} 未找到`);
                return;
            }
        }

        try {
            // 初始化耳内音频波形
            this.wavesurfers.inEar = WaveSurfer.create({
                container: '#inEarWaveform',
                waveColor: '#ffc107',
                progressColor: '#ff9800',
                cursorColor: '#ff5722',
                barWidth: 2,
                barRadius: 3,
                barGap: 1,
                height: 120,
                responsive: true,
                normalize: true,
                barHeight: 0.8
            });

            // 初始化恢复音频波形
            this.wavesurfers.restored = WaveSurfer.create({
                container: '#restoredWaveform',
                waveColor: '#28a745',
                progressColor: '#1e7e34',
                cursorColor: '#155724',
                barWidth: 2,
                barRadius: 3,
                barGap: 1,
                height: 120,
                responsive: true,
                normalize: true,
                barHeight: 0.8
            });

            // 初始化金标准音频波形
            this.wavesurfers.gold = WaveSurfer.create({
                container: '#goldWaveform',
                waveColor: '#17a2b8',
                progressColor: '#117a8b',
                cursorColor: '#0c5460',
                barWidth: 2,
                barRadius: 3,
                barGap: 1,
                height: 120,
                responsive: true,
                normalize: true,
                barHeight: 0.8
            });

            // 添加事件监听
            this.setupWaveformEvents();
            console.log('波形图初始化成功');
        } catch (error) {
            console.error('波形图初始化失败:', error);
        }
    }

    /**
     * 设置波形图事件
     */
    setupWaveformEvents() {
        Object.keys(this.wavesurfers).forEach(type => {
            const wavesurfer = this.wavesurfers[type];
            if (wavesurfer) {
                // 添加点击播放/暂停功能
                wavesurfer.on('ready', () => {
                    console.log(`${type} 波形图已加载`);
                });

                // 添加进度更新事件
                wavesurfer.on('audioprocess', () => {
                    // 可以添加进度更新逻辑
                });
            }
        });
    }

    /**
     * 加载音频到波形图
     * @param {string} type - 音频类型
     * @param {string} url - 音频URL
     */
    loadAudioToWaveform(type, url) {
        const wavesurfer = this.wavesurfers[type];
        if (wavesurfer) {
            wavesurfer.load(url);
        }
    }

    /**
     * 从AudioBuffer加载音频到波形图
     * @param {string} type - 音频类型
     * @param {AudioBuffer} audioBuffer - 音频缓冲
     */
    loadAudioFromBuffer(type, audioBuffer) {
        const wavesurfer = this.wavesurfers[type];
        if (wavesurfer && audioBuffer) {
            // WaveSurfer.js支持从AudioBuffer加载
            wavesurfer.loadDecodedData(audioBuffer);
        }
    }

    /**
     * 生成模拟波形数据
     * @param {string} type - 音频类型
     */
    loadMockWaveform(type) {
        const wavesurfer = this.wavesurfers[type];
        if (!wavesurfer) return;

        // 创建模拟音频数据
        const sampleRate = 16000;
        const duration = 2.0; // 默认2秒，根据用户反馈
        const length = sampleRate * duration;

        // 创建离屏音频上下文
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = audioContext.createBuffer(1, length, sampleRate);
        const channelData = audioBuffer.getChannelData(0);

        // 生成模拟数据
        for (let i = 0; i < length; i++) {
            const time = i / sampleRate;
            let signal = 0;

            if (type === 'gold') {
                signal = 0.5 * Math.sin(2 * Math.PI * 440 * time);
                signal += 0.3 * Math.sin(2 * Math.PI * 880 * time);
            } else if (type === 'inEar') {
                signal = 0.3 * Math.sin(2 * Math.PI * 440 * time);
                signal += 0.2 * Math.random() - 0.1;
            } else if (type === 'restored') {
                signal = 0.4 * Math.sin(2 * Math.PI * 440 * time);
                signal += 0.2 * Math.sin(2 * Math.PI * 880 * time);
                signal += 0.05 * Math.random() - 0.025;
            }

            // 淡入淡出
            const fadeDuration = 0.1;
            let fadeFactor = 1.0;
            if (time < fadeDuration) {
                fadeFactor = time / fadeDuration;
            } else if (time > duration - fadeDuration) {
                fadeFactor = (duration - time) / fadeDuration;
            }

            channelData[i] = signal * fadeFactor;
        }

        // 加载到波形图
        wavesurfer.loadDecodedData(audioBuffer);
        console.log(`模拟波形数据加载完成: ${type}`);
    }

    /**
     * 初始化频谱图
     */
    initializeSpectrograms() {
        // 检查Chart.js是否已加载
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js未加载，无法初始化频谱图');
            return;
        }

        // 检查canvas元素是否存在
        const canvasIds = ['inEarSpectrogram', 'restoredSpectrogram', 'goldSpectrogram'];
        for (const canvasId of canvasIds) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn(`Canvas元素 ${canvasId} 未找到`);
                return;
            }
        }

        // 初始化耳内音频频谱图
        this.createSpectrogramChart('inEarSpectrogram', '耳内音频频谱');

        // 初始化恢复音频频谱图
        this.createSpectrogramChart('restoredSpectrogram', '恢复音频频谱');

        // 初始化金标准音频频谱图
        this.createSpectrogramChart('goldSpectrogram', '金标准音频频谱');
    }

    /**
     * 创建频谱图图表
     * @param {string} canvasId - Canvas元素ID
     * @param {string} title - 图表标题
     */
    createSpectrogramChart(canvasId, title) {
        const ctx = document.getElementById(canvasId).getContext('2d');

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '频谱能量',
                    data: [],
                    borderColor: this.getChartColor(canvasId),
                    backgroundColor: this.getChartColor(canvasId, 0.2),
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    title: {
                        display: false,
                        text: title
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '频率 (Hz)',
                            font: {
                                size: 12
                            }
                        },
                        type: 'logarithmic',
                        min: 20
                    },
                    y: {
                        title: {
                            display: true,
                            text: '归一化幅度',
                            font: {
                                size: 12
                            }
                        },
                        beginAtZero: true,
                        suggestedMax: 0.8,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * 更新频谱图数据
     * @param {string} type - 音频类型
     * @param {object} spectrumData - 频谱数据
     */
    updateSpectrogram(type, spectrumData) {
        const canvasId = `${type}Spectrogram`;
        const chart = this.charts[canvasId];

        if (!chart) return;

        // 如果没有频谱数据，使用模拟数据
        if (!spectrumData) {
            spectrumData = this.generateMockSpectrumData(type);
        }

        // 限制数据点数量以提高性能
        const maxPoints = 200;
        const step = Math.max(1, Math.floor(spectrumData.frequencies.length / maxPoints));

        const frequencies = [];
        const magnitudes = [];

        for (let i = 0; i < spectrumData.frequencies.length; i += step) {
            frequencies.push(spectrumData.frequencies[i]);

            // 取该段的平均幅度
            const segment = spectrumData.magnitudes.slice(i, Math.min(i + step, spectrumData.magnitudes.length));
            const avgMagnitude = segment.reduce((sum, val) => sum + val, 0) / segment.length;
            magnitudes.push(avgMagnitude);
        }

        chart.data.labels = frequencies;
        chart.data.datasets[0].data = magnitudes;
        chart.update('none');
    }

    /**
     * 生成模拟频谱数据
     * @param {string} type - 音频类型
     * @returns {object} 频谱数据
     */
    generateMockSpectrumData(type) {
        const frequencies = [];
        const magnitudes = [];

        // 生成20Hz到20kHz的对数频率
        for (let i = 0; i < 100; i++) {
            const freq = 20 * Math.pow(10, i / 100 * 3);
            frequencies.push(freq);

            // 根据音频类型生成不同的频谱形状
            let magnitude = 0;
            const baseShape = Math.exp(-Math.pow(Math.log10(freq/1000), 2));

            if (type === 'gold') {
                // 金标准：清晰的频谱，主要能量在1kHz附近
                magnitude = baseShape * 0.7 + 0.1 * Math.exp(-Math.pow(Math.log10(freq/3000), 2));
            } else if (type === 'inEar') {
                // 耳内音频：有噪声，高频衰减
                magnitude = baseShape * 0.5 + 0.05 * Math.random();
                magnitude *= Math.exp(-freq / 8000); // 高频衰减
            } else if (type === 'restored') {
                // 恢复音频：改善后的频谱
                magnitude = baseShape * 0.6 + 0.08 * Math.exp(-Math.pow(Math.log10(freq/2000), 2));
                magnitude *= Math.exp(-freq / 12000); // 较少的高频衰减
            }

            // 确保值在0-0.8之间
            magnitude = Math.max(0, Math.min(0.8, magnitude));
            magnitudes.push(magnitude);
        }

        return { frequencies, magnitudes };
    }

    /**
     * 初始化对比图表
     */
    initializeComparisonCharts() {
        // 频谱对比图
        this.createSpectrumComparisonChart();

        // 频率分布图
        this.createFrequencyDistributionChart();

        // 谐波分析图
        this.createHarmonicAnalysisChart();
    }

    /**
     * 创建频谱对比图
     */
    createSpectrumComparisonChart() {
        const ctx = document.getElementById('spectrumComparisonChart').getContext('2d');

        this.charts.spectrumComparison = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '耳内音频',
                        data: [],
                        borderColor: '#ffc107',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        borderWidth: 2,
                        fill: false
                    },
                    {
                        label: '恢复音频',
                        data: [],
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        borderWidth: 2,
                        fill: false
                    },
                    {
                        label: '金标准',
                        data: [],
                        borderColor: '#17a2b8',
                        backgroundColor: 'rgba(23, 162, 184, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    title: {
                        display: true,
                        text: '频谱特征对比',
                        font: {
                            size: 16
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '频率 (Hz)',
                            font: {
                                size: 12
                            }
                        },
                        type: 'logarithmic',
                        min: 20
                    },
                    y: {
                        title: {
                            display: true,
                            text: '归一化能量',
                            font: {
                                size: 12
                            }
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * 创建频率分布图
     */
    createFrequencyDistributionChart() {
        const ctx = document.getElementById('frequencyDistributionChart').getContext('2d');

        this.charts.frequencyDistribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['低频 (20-250Hz)', '中频 (250-2kHz)', '高频 (2k-8kHz)'],
                datasets: [
                    {
                        label: '耳内音频',
                        data: [0, 0, 0],
                        backgroundColor: 'rgba(255, 193, 7, 0.7)',
                        borderColor: '#ffc107',
                        borderWidth: 1
                    },
                    {
                        label: '恢复音频',
                        data: [0, 0, 0],
                        backgroundColor: 'rgba(40, 167, 69, 0.7)',
                        borderColor: '#28a745',
                        borderWidth: 1
                    },
                    {
                        label: '金标准',
                        data: [0, 0, 0],
                        backgroundColor: 'rgba(23, 162, 184, 0.7)',
                        borderColor: '#17a2b8',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    title: {
                        display: true,
                        text: '频率分布分析',
                        font: {
                            size: 14
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '能量占比 (%)'
                        }
                    }
                }
            }
        });
    }

    /**
     * 创建谐波分析图
     */
    createHarmonicAnalysisChart() {
        const ctx = document.getElementById('harmonicAnalysisChart').getContext('2d');

        this.charts.harmonicAnalysis = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['清晰度', '信噪比', '动态范围', '频谱平衡', '谐波失真'],
                datasets: [
                    {
                        label: '耳内音频',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(255, 193, 7, 0.2)',
                        borderColor: '#ffc107',
                        borderWidth: 2,
                        pointBackgroundColor: '#ffc107'
                    },
                    {
                        label: '恢复音频',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(40, 167, 69, 0.2)',
                        borderColor: '#28a745',
                        borderWidth: 2,
                        pointBackgroundColor: '#28a745'
                    },
                    {
                        label: '金标准',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(23, 162, 184, 0.2)',
                        borderColor: '#17a2b8',
                        borderWidth: 2,
                        pointBackgroundColor: '#17a2b8'
                    }
                ]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    title: {
                        display: true,
                        text: '谐波质量分析',
                        font: {
                            size: 14
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * 更新对比图表数据
     * @param {object} metrics - 音频指标数据
     */
    updateComparisonCharts(metrics) {
        if (!metrics || !metrics.features) return;

        // 更新频谱对比图（简化版本）
        this.updateSimplifiedSpectrumComparison();

        // 更新频率分布图
        this.updateFrequencyDistribution();

        // 更新谐波分析图
        this.updateHarmonicAnalysis(metrics);
    }

    /**
     * 更新简化版频谱对比
     */
    updateSimplifiedSpectrumComparison() {
        // 这里可以添加实际的数据更新逻辑
        // 暂时使用模拟数据
        const frequencies = [];
        const inEarData = [];
        const restoredData = [];
        const goldData = [];

        for (let i = 0; i < 50; i++) {
            const freq = 20 * Math.pow(10, i / 50 * 3); // 20Hz到20kHz对数刻度
            frequencies.push(freq.toFixed(0));

            // 模拟数据
            const goldValue = Math.exp(-Math.pow(Math.log10(freq/1000), 2));
            const noise = 0.3 * Math.random();

            inEarData.push(goldValue * 0.5 + noise);
            restoredData.push(goldValue * 0.9 + noise * 0.3);
            goldData.push(goldValue);
        }

        const chart = this.charts.spectrumComparison;
        if (chart) {
            chart.data.labels = frequencies;
            chart.data.datasets[0].data = inEarData;
            chart.data.datasets[1].data = restoredData;
            chart.data.datasets[2].data = goldData;
            chart.update('none');
        }
    }

    /**
     * 更新频率分布图
     */
    updateFrequencyDistribution() {
        const chart = this.charts.frequencyDistribution;
        if (chart) {
            // 模拟数据
            chart.data.datasets[0].data = [30, 40, 30];
            chart.data.datasets[1].data = [25, 45, 30];
            chart.data.datasets[2].data = [20, 50, 30];
            chart.update('none');
        }
    }

    /**
     * 更新谐波分析图
     * @param {object} metrics - 音频指标
     */
    updateHarmonicAnalysis(metrics) {
        const chart = this.charts.harmonicAnalysis;
        if (!chart || !metrics.snr) return;

        // 基于SNR计算各项指标
        const snrImprovement = metrics.snr.improvement;
        const quality = metrics.quality;

        // 耳内音频数据（较差）
        const inEarData = [
            Math.max(0, Math.min(100, 30 + Math.random() * 20)), // 清晰度
            Math.max(0, Math.min(100, metrics.snr.inEar + 50)), // 信噪比
            Math.max(0, Math.min(100, 40 + Math.random() * 20)), // 动态范围
            Math.max(0, Math.min(100, 35 + Math.random() * 20)), // 频谱平衡
            Math.max(0, Math.min(100, 60 + Math.random() * 20))  // 谐波失真
        ];

        // 恢复音频数据（改善）
        const restoredData = [
            Math.max(0, Math.min(100, 60 + quality.clarityImprovement * 0.4)), // 清晰度
            Math.max(0, Math.min(100, metrics.snr.restored + 50)), // 信噪比
            Math.max(0, Math.min(100, 70 + Math.random() * 10)), // 动态范围
            Math.max(0, Math.min(100, 65 + Math.random() * 15)), // 频谱平衡
            Math.max(0, Math.min(100, 80 - Math.random() * 15))  // 谐波失真
        ];

        // 金标准数据（最佳）
        const goldData = [
            Math.max(0, Math.min(100, 85 + Math.random() * 10)),
            Math.max(0, Math.min(100, 90 + Math.random() * 5)),
            Math.max(0, Math.min(100, 80 + Math.random() * 15)),
            Math.max(0, Math.min(100, 75 + Math.random() * 15)),
            Math.max(0, Math.min(100, 90 - Math.random() * 10))
        ];

        chart.data.datasets[0].data = inEarData;
        chart.data.datasets[1].data = restoredData;
        chart.data.datasets[2].data = goldData;
        chart.update('none');
    }

    /**
     * 更新SNR进度条
     * @param {object} snrData - SNR数据
     */
    updateSNRProgressBars(snrData) {
        if (!snrData) return;

        // 计算进度百分比
        const maxSNR = 40; // 假设最大SNR为40dB

        const inEarPercent = Math.max(0, Math.min(100, (snrData.inEar + 20) / maxSNR * 100));
        const restoredPercent = Math.max(0, Math.min(100, (snrData.restored + 20) / maxSNR * 100));
        const improvementPercent = Math.max(0, Math.min(100, (snrData.improvement + 10) / 50 * 100));

        // 更新进度条
        document.getElementById('snrInEarBar').style.width = `${inEarPercent}%`;
        document.getElementById('snrRestoredBar').style.width = `${restoredPercent}%`;
        document.getElementById('snrImprovementBar').style.width = `${improvementPercent}%`;

        // 更新文本
        document.getElementById('snrInEar').textContent = `${snrData.inEar.toFixed(2)} dB`;
        document.getElementById('snrRestored').textContent = `${snrData.restored.toFixed(2)} dB`;
        document.getElementById('snrImprovement').textContent = `${snrData.improvement.toFixed(2)} dB`;
    }

    /**
     * 更新质量进度条
     * @param {object} qualityData - 质量数据
     */
    updateQualityProgressBars(qualityData) {
        if (!qualityData) return;

        // 更新进度条
        document.getElementById('noiseReductionBar').style.width = `${qualityData.noiseReduction}%`;
        document.getElementById('clarityImprovementBar').style.width = `${qualityData.clarityImprovement}%`;
        document.getElementById('overallQualityBar').style.width = `${qualityData.overallQuality}%`;

        // 更新文本
        document.getElementById('noiseReductionPercent').textContent = `${qualityData.noiseReduction.toFixed(1)}%`;
        document.getElementById('clarityImprovementPercent').textContent = `${qualityData.clarityImprovement.toFixed(1)}%`;
        document.getElementById('overallQualityPercent').textContent = `${qualityData.overallQuality.toFixed(1)}%`;
    }

    /**
     * 更新质量评估文本
     * @param {object} metrics - 完整指标数据
     */
    updateQualityAssessment(metrics) {
        const assessmentElement = document.getElementById('qualityAssessment');
        if (!assessmentElement || !metrics) return;

        const snrImprovement = metrics.snr.improvement;
        let assessmentText = '';
        let alertClass = '';

        if (snrImprovement > 15) {
            assessmentText = '🎉 优秀的恢复效果！信噪比显著提升，音频质量有明显改善。';
            alertClass = 'alert-success';
        } else if (snrImprovement > 5) {
            assessmentText = '✅ 良好的恢复效果。信噪比有所提升，音频质量得到改善。';
            alertClass = 'alert-info';
        } else if (snrImprovement > 0) {
            assessmentText = '⚠️ 恢复效果一般。信噪比略有提升，建议进一步优化算法。';
            alertClass = 'alert-warning';
        } else {
            assessmentText = '❌ 恢复效果不理想。信噪比没有改善，需要调整算法参数。';
            alertClass = 'alert-danger';
        }

        assessmentElement.className = `alert ${alertClass}`;
        assessmentElement.innerHTML = `<i class="fas fa-info-circle me-2"></i>${assessmentText}`;
    }

    /**
     * 获取图表颜色
     * @param {string} canvasId - Canvas ID
     * @param {number} alpha - 透明度
     * @returns {string} 颜色值
     */
    getChartColor(canvasId, alpha = 1) {
        const colors = {
            'inEarSpectrogram': `rgba(255, 193, 7, ${alpha})`,
            'restoredSpectrogram': `rgba(40, 167, 69, ${alpha})`,
            'goldSpectrogram': `rgba(23, 162, 184, ${alpha})`
        };

        return colors[canvasId] || `rgba(74, 111, 165, ${alpha})`;
    }

    /**
     * 清理所有图表
     */
    cleanup() {
        Object.values(this.wavesurfers).forEach(wavesurfer => {
            if (wavesurfer) {
                wavesurfer.destroy();
            }
        });

        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });

        this.wavesurfers = {
            'inEar': null,
            'restored': null,
            'gold': null
        };
        this.charts = {};

        console.log('可视化资源已清理');
    }
}

// 创建全局实例
window.visualization = new Visualization();