/**
 * 游戏存储类
 * 负责管理游戏成绩的本地存储、排行榜数据的处理等功能
 */
class GameStorage {
    /**
     * 构造函数
     * 初始化存储键名和设备ID
     */
    constructor() {
        this.storageKey = 'puzzle_game_scores';  // 存储成绩的键名
        this.deviceId = this.getOrCreateDeviceId(); // 获取或创建设备唯一标识
    }

    /**
     * 获取或创建设备ID
     * @returns {string} 设备唯一标识
     */
    getOrCreateDeviceId() {
        let deviceId = localStorage.getItem('puzzle_device_id');
        if (!deviceId) {
            // 如果不存在设备ID,则创建一个新的
            // 使用时间戳和随机字符串组合生成唯一ID
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('puzzle_device_id', deviceId);
        }
        return deviceId;
    }

    /**
     * 保存游戏成绩
     * @param {Object} score - 成绩对象,包含时间和步数
     * @param {number} score.time - 完成时间
     * @param {number} score.moves - 移动步数
     * @returns {Array} 更新后的排行榜数据
     */
    saveScore(score) {
        let scores = this.getScores();
        const existingScoreIndex = scores.findIndex(s => s.deviceId === this.deviceId);

        // 构建新的成绩记录
        const newScore = {
            deviceId: this.deviceId,
            time: score.time,
            moves: score.moves,
            date: new Date().getTime()
        };

        if (existingScoreIndex !== -1) {
            // 如果已有记录，判断是否需要更新
            // 只有当新成绩更好时才更新(时间更短或时间相同但步数更少)
            const existingScore = scores[existingScoreIndex];
            if (score.time < existingScore.time || 
                (score.time === existingScore.time && score.moves < existingScore.moves)) {
                scores[existingScoreIndex] = newScore;
            }
        } else {
            scores.push(newScore);
        }

        // 按时间和步数排序
        // 优先按完成时间排序,时间相同则按步数排序
        scores.sort((a, b) => {
            if (a.time === b.time) {
                return a.moves - b.moves;
            }
            return a.time - b.time;
        });

        // 只保留前10名
        scores = scores.slice(0, 10);
        
        localStorage.setItem(this.storageKey, JSON.stringify(scores));
        return scores;
    }

    /**
     * 获取所有成绩记录
     * @returns {Array} 所有成绩记录数组
     */
    getScores() {
        const scores = localStorage.getItem(this.storageKey);
        return scores ? JSON.parse(scores) : [];
    }

    /**
     * 获取当前设备的最佳成绩
     * @returns {Object|undefined} 当前设备的最佳成绩记录,如果没有则返回undefined
     */
    getCurrentDeviceBestScore() {
        const scores = this.getScores();
        return scores.find(score => score.deviceId === this.deviceId);
    }
}

// 创建GameStorage的单例实例
const gameStorage = new GameStorage(); 