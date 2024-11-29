class AudioManager {
    constructor() {
        this.sounds = {
            start: new Audio('audio/start.mp3'),
            complete: new Audio('audio/complete.mp3'),
            drag: new Audio('audio/drag.mp3'),
            drop: new Audio('audio/drop.mp3'),
            click: new Audio('audio/click.mp3')
        };
        
        // 预加载所有音效
        for (let sound in this.sounds) {
            this.sounds[sound].load();
        }
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            // 重置音频播放位置并播放
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => console.log('音频播放失败:', e));
        }
    }

    // 设置音量
    setVolume(volume) {
        for (let sound in this.sounds) {
            this.sounds[sound].volume = volume;
        }
    }
}

// 导出音频管理器实例
export const audioManager = new AudioManager(); 