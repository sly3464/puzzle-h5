class GameStorage {
    constructor() {
        this.storageKey = 'puzzle_game_scores';
        this.deviceId = this.getOrCreateDeviceId();
    }

    // 获取或创建设备ID
    getOrCreateDeviceId() {
        let deviceId = localStorage.getItem('puzzle_device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('puzzle_device_id', deviceId);
        }
        return deviceId;
    }

    // 保存成绩
    saveScore(score) {
        let scores = this.getScores();
        const existingScoreIndex = scores.findIndex(s => s.deviceId === this.deviceId);

        const newScore = {
            deviceId: this.deviceId,
            time: score.time,
            moves: score.moves,
            date: new Date().getTime()
        };

        if (existingScoreIndex !== -1) {
            // 如果已有记录，判断是否需要更新
            const existingScore = scores[existingScoreIndex];
            if (score.time < existingScore.time || 
                (score.time === existingScore.time && score.moves < existingScore.moves)) {
                scores[existingScoreIndex] = newScore;
            }
        } else {
            scores.push(newScore);
        }

        // 按时间和步数排序
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

    // 获取所有成绩
    getScores() {
        const scores = localStorage.getItem(this.storageKey);
        return scores ? JSON.parse(scores) : [];
    }

    // 获取当前设备的最佳成绩
    getCurrentDeviceBestScore() {
        const scores = this.getScores();
        return scores.find(score => score.deviceId === this.deviceId);
    }
}

const gameStorage = new GameStorage(); 