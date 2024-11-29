class GameStorage {
    constructor() {
        this.storageKey = 'puzzle_game_data';
    }

    // 保存游戏进度
    saveGameProgress(data) {
        const gameData = {
            level: data.level,
            moves: data.moves,
            time: data.seconds,
            gridSize: data.gridSize,
            lastPlayed: new Date().getTime()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(gameData));
    }

    // 读取游戏进度
    loadGameProgress() {
        const savedData = localStorage.getItem(this.storageKey);
        return savedData ? JSON.parse(savedData) : null;
    }

    // 清除游戏进度
    clearGameProgress() {
        localStorage.removeItem(this.storageKey);
    }

    // 保存最佳成绩
    saveBestScore(difficulty, score) {
        const key = `puzzle_best_score_${difficulty}`;
        const currentBest = this.getBestScore(difficulty);
        
        if (!currentBest || score.time < currentBest.time || 
            (score.time === currentBest.time && score.moves < currentBest.moves)) {
            localStorage.setItem(key, JSON.stringify({
                moves: score.moves,
                time: score.time,
                date: new Date().getTime()
            }));
            return true;
        }
        return false;
    }

    // 获取最佳成绩
    getBestScore(difficulty) {
        const key = `puzzle_best_score_${difficulty}`;
        const savedScore = localStorage.getItem(key);
        return savedScore ? JSON.parse(savedScore) : null;
    }

    // 保存自定义图片
    saveCustomImage(imageData) {
        localStorage.setItem('puzzle_custom_image', imageData);
    }

    // 获取自定义图片
    getCustomImage() {
        return localStorage.getItem('puzzle_custom_image');
    }
}

// 导出存储管理器实例
const gameStorage = new GameStorage(); 