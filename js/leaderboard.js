/**
 * 排行榜类
 * 管理游戏排行榜的显示和数据存储
 */
class Leaderboard {
    /**
     * 构造函数
     * 初始化排行榜
     */
    constructor() {
        this.initLeaderboard();
    }

    /**
     * 初始化排行榜
     * 创建排行榜按钮和模态框
     */
    initLeaderboard() {
        // 添加排行榜按钮
        if (!$('#leaderboard-btn').length) {
            const leaderboardBtn = $('<button>')
                .attr('id', 'leaderboard-btn')
                .addClass('btn secondary')
                .text('排行榜')
                .insertAfter('#preview-btn');
        }

        // 先移除可能存在的旧模态框
        $('#leaderboardModal').remove();

        // 创建新的排行榜模态框
        const leaderboardModal = $(`
            <div id="leaderboardModal" class="modal">
                <div class="modal-content leaderboard-modal">
                    <div class="modal-header">
                        <h2>排行榜 - TOP 10</h2>
                        <button type="button" class="close-btn" id="leaderboard-close">&times;</button>
                    </div>
                    <div class="leaderboard-content">
                        <div class="leaderboard-list"></div>
                    </div>
                </div>
            </div>
        `).appendTo('body');

        // 立即绑定事件
        this.bindEvents();
    }

    /**
     * 绑定排行榜相关事件
     * 包括打开排行榜、关闭排行榜等交互事件
     */
    bindEvents() {
        // 绑定排行榜按钮点击事件
        $('#leaderboard-btn').off('click').on('click', () => this.showLeaderboard());

        // 绑定关闭按钮事件
        $('#leaderboard-close').off('click').on('click', (e) => {
            e.stopPropagation();
            $('#leaderboardModal').fadeOut(200);
        });

        // 点击遮罩层关闭
        $('#leaderboardModal').off('click').on('click', (e) => {
            if ($(e.target).is('#leaderboardModal')) {
                $('#leaderboardModal').fadeOut(200);
            }
        });

        // 阻止点击模态框内容时关闭
        $('.leaderboard-modal').on('click', (e) => {
            e.stopPropagation();
        });
    }

    /**
     * 显示排行榜
     * 从存储中获取成绩数据并展示
     */
    showLeaderboard() {
        const scores = gameStorage.getScores();
        const currentDeviceId = gameStorage.deviceId;
        const leaderboardList = $('.leaderboard-list');
        
        leaderboardList.empty();

        if (scores.length === 0) {
            leaderboardList.html('<p class="no-scores">暂无记录</p>');
        } else {
            const list = $('<div class="scores-list"></div>');
            
            scores.forEach((score, index) => {
                const isCurrentDevice = score.deviceId === currentDeviceId;
                const scoreDate = new Date(score.date);
                
                // 格式化完成时间
                const completionTime = `${scoreDate.getFullYear()}-${String(scoreDate.getMonth() + 1).padStart(2, '0')}-${String(scoreDate.getDate()).padStart(2, '0')} ${String(scoreDate.getHours()).padStart(2, '0')}:${String(scoreDate.getMinutes()).padStart(2, '0')}:${String(scoreDate.getSeconds()).padStart(2, '0')}`;
                
                // 计算游戏用时
                const minutes = Math.floor(score.time / 60);
                const seconds = score.time % 60;
                const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                
                const scoreItem = $(`
                    <div class="score-item ${isCurrentDevice ? 'current-device' : ''}">
                        <div class="rank-section">
                            <div class="rank">${index + 1}</div>
                        </div>
                        <div class="score-content">
                            <div class="stat-group">
                                <div class="stat-item">
                                    <span class="stat-label">用时</span>
                                    <span class="stat-value">${timeStr}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">步数</span>
                                    <span class="stat-value">${score.moves}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">完成时间</span>
                                    <span class="stat-value completion-time">${completionTime}</span>
                                </div>
                            </div>
                            ${isCurrentDevice ? '<div class="current-label">当前设备</div>' : ''}
                        </div>
                    </div>
                `);
                
                list.append(scoreItem);
            });
            
            leaderboardList.append(list);
        }

        $('#leaderboardModal').fadeIn(200);
    }

    /**
     * 添加新的游戏成绩
     * @param {Object} score - 包含游戏成绩信息的对象
     * @returns {boolean} 保存是否成功
     */
    addScore(score) {
        return gameStorage.saveScore(score);
    }
}

// 创建单例实例
const leaderboard = new Leaderboard(); 