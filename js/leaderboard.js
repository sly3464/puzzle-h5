class Leaderboard {
    constructor() {
        this.storageKey = 'puzzle_leaderboard';
        this.maxEntries = 10; // 每个难度等级保存的最大记录数
        this.initLeaderboard();
    }

    initLeaderboard() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify({
                '3': [], // 3x3难度的记录
                '4': [], // 4x4难度的记录
                '5': []  // 5x5难度的记录
            }));
        }
    }

    // 添加新记录
    addScore(difficulty, score) {
        const leaderboard = this.getLeaderboard();
        const difficultyScores = leaderboard[difficulty] || [];

        // 添加新记录
        difficultyScores.push({
            moves: score.moves,
            time: score.time,
            date: new Date().getTime(),
            playerName: score.playerName || '匿名'
        });

        // 按完成时间和步数排序
        difficultyScores.sort((a, b) => {
            if (a.time === b.time) {
                return a.moves - b.moves;
            }
            return a.time - b.time;
        });

        // 只保留前N条记录
        leaderboard[difficulty] = difficultyScores.slice(0, this.maxEntries);

        // 保存更新后的排行榜
        localStorage.setItem(this.storageKey, JSON.stringify(leaderboard));
        
        // 更新显示
        this.updateDisplay();
    }

    // 获取排行榜数据
    getLeaderboard() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || {};
    }

    // 更新排行榜显示
    updateDisplay() {
        const leaderboardElement = document.getElementById('leaderboard');
        const leaderboard = this.getLeaderboard();
        const currentDifficulty = document.querySelector('.difficulty-btn.active').dataset.size;
        
        const scores = leaderboard[currentDifficulty] || [];
        
        leaderboardElement.innerHTML = scores.map((score, index) => `
            <li class="leaderboard-item">
                <span class="rank">#${index + 1}</span>
                <span class="player">${score.playerName}</span>
                <span class="score">
                    ${Math.floor(score.time / 60)}:${(score.time % 60).toString().padStart(2, '0')}
                    (${score.moves}步)
                </span>
            </li>
        `).join('');
    }

    // 清除排行榜
    clearLeaderboard() {
        localStorage.removeItem(this.storageKey);
        this.initLeaderboard();
        this.updateDisplay();
    }
}

// 创建排行榜实例
const leaderboard = new Leaderboard();

// 监听难度选择按钮点击
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        leaderboard.updateDisplay();
    });
}); 