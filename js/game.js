/**
 * 拼图游戏类
 * 实现了一个可交互的拼图游戏,包含多个难度等级和计时功能
 */
class Game {
    /**
     * 构造函数,初始化游戏状态和UI元素
     */
    constructor() {
        // 游戏状态相关属性
        this.currentLevel = 1;      // 当前关卡
        this.moves = 0;             // 移动步数
        this.timer = null;          // 计时器
        this.seconds = 0;           // 游戏时长(秒)
        this.isPlaying = false;     // 是否正在游戏中
        this.gridSize = 2;          // 网格大小,默认2x2
        this.pieces = [];           // 拼图块数组
        this.currentImage = 'images/default-puzzle.jpg'; // 当前拼图图片
        
        // 初始化UI元素和事件
        this.initElements();
        this.bindEvents(); 
        this.initModalEvents();
        
        // 创建初始拼图
        this.createInitialPuzzle();
        
        // 预览相关元素
        this.previewBtn = $('#preview-btn');
        this.previewContainer = $('#preview-container');
        this.previewImage = $('#preview-image');
        
        // 遮罩层
        this.overlay = $('<div class="overlay"></div>').appendTo('body');
        
        // 绑定预览事件
        this.bindPreviewEvents();
    }

    /**
     * 创建初始拼图
     * 加载默认图片并创建2x2拼图
     */
    createInitialPuzzle() {
        this.gridSize = 2; // 初始显示4宫格
        const img = new Image();
        img.onload = () => {
            this.createPuzzle();
        };
        img.src = this.currentImage;
    }

    /**
     * 初始化UI元素引用
     */
    initElements() {
        this.puzzleContainer = $('#puzzle');
        this.startBtn = $('#start-btn');
        this.uploadBtn = $('#upload-btn');
        this.imageUpload = $('#image-upload');
        this.movesDisplay = $('#moves');
        this.timeDisplay = $('#time');
        this.currentLevelDisplay = $('#current-level');
        this.modal = $('#gameModal');
    }

    /**
     * 绑定游戏主要控制按钮事件
     */
    bindEvents() {
        // 开始/重新开始按钮事件
        this.startBtn.on('click', () => {
            if (!this.isPlaying) {
                this.startGame();
                this.startBtn.text('重新开始');
                this.uploadBtn.prop('disabled', true).addClass('disabled');
            } else {
                this.resetGame();
            }
        });

        // 上传图片按钮事件
        this.uploadBtn.on('click', () => {
            if (!this.isPlaying) {
                this.imageUpload.click();
            }
        });

        // 图片上传处理事件
        this.imageUpload.on('change', (e) => {
            if (!this.isPlaying) {
                this.handleImageUpload(e);
            }
        });
    }

    /**
     * 重置游戏
     * 保持当前关卡,重置计时和步数
     */
    resetGame() {
        // 根据当前关卡设置网格大小
        switch(this.currentLevel) {
            case 1:
                this.gridSize = 2; // 4宫格
                break;
            case 2:
                this.gridSize = 3; // 9宫格
                break;
            case 3:
                this.gridSize = 4; // 16宫格
                break;
        }

        this.stopTimer();
        this.moves = 0;
        this.seconds = 0;
        this.updateDisplay();
        this.createPuzzle();
        this.initDraggable();
        this.startTimer();
    }

    /**
     * 开始新游戏
     * 根据关卡设置难度并初始化游戏
     */
    startGame() {
        // 根据关卡设置网格大小
        switch(this.currentLevel) {
            case 1:
                this.gridSize = 2; // 第一关 4宫格 (2x2)
                break;
            case 2:
                this.gridSize = 3; // 第二关 9宫格 (3x3)
                break;
            case 3:
                this.gridSize = 4; // 第三关 16宫格 (4x4)
                break;
        }

        this.isPlaying = true;
        this.moves = 0;
        this.seconds = 0;
        this.updateDisplay();
        
        if (this.timer) clearInterval(this.timer);
        
        this.createPuzzle();
        this.initDraggable();
        this.startTimer();
        this.startBtn.text('重新开始');
        this.uploadBtn.prop('disabled', true).addClass('disabled');
    }

    /**
     * 创建拼图
     * 根据当前网格大小创建拼图块
     */
    createPuzzle() {
        this.puzzleContainer.empty();
        this.pieces = [];
        
        const containerWidth = this.puzzleContainer.width();
        const pieceWidth = Math.floor(containerWidth / this.gridSize);
        
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const row = Math.floor(i / this.gridSize);
            const col = i % this.gridSize;
            
            const piece = $('<div>')
                .addClass('puzzle-piece')
                .css({
                    width: pieceWidth,
                    height: pieceWidth,
                    backgroundImage: `url(${this.currentImage})`,
                    backgroundSize: `${containerWidth}px ${containerWidth}px`,
                    backgroundPosition: `-${col * pieceWidth}px -${row * pieceWidth}px`,
                    position: 'absolute',
                    left: col * pieceWidth,
                    top: row * pieceWidth,
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxSizing: 'border-box',
                    cursor: this.isPlaying ? 'move' : 'pointer'
                })
                .attr('data-index', i);
            
            // 为每个拼图块添加点击事件
            if (!this.isPlaying) {
                piece.on('mousedown touchstart', (e) => {
                    if (!this.isPlaying) {
                        e.preventDefault();
                        this.showGameStartTip();
                    }
                });
            }
            
            this.pieces.push(piece);
            this.puzzleContainer.append(piece);
        }
        
        this.shufflePuzzle();
        
        if (this.isPlaying) {
            this.initDraggable();
        }
    }

    /**
     * 处理图片上传
     * @param {Event} e - 上传事件对象
     */
    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    this.currentImage = event.target.result;
                    this.previewImage.attr('src', this.currentImage);
                    this.createPuzzle();
                    if (!this.isPlaying) {
                        this.startBtn.text('开始游戏');
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    /**
     * 初始化拖拽功能
     * 使用jQuery UI实现拼图块的拖拽交换
     */
    initDraggable() {
        let isDragging = false;
        let startPosition = null;
        let startElement = null;

        $('.puzzle-piece').draggable({
            containment: 'parent',
            zIndex: 1000,
            start: function(event, ui) {
                if (isDragging) return false;
                
                isDragging = true;
                startPosition = $(this).position();
                startElement = $(this);
                $(this).addClass('dragging');
            },
            stop: function(event, ui) {
                const currentElement = $(this);
                currentElement.removeClass('dragging');
                
                let endElement = null;
                let minDistance = Number.MAX_VALUE;
                const currentCenter = {
                    x: ui.offset.left + currentElement.width() / 2,
                    y: ui.offset.top + currentElement.height() / 2
                };

                $('.puzzle-piece').not(currentElement).each(function() {
                    const piece = $(this);
                    const pieceOffset = piece.offset();
                    const pieceCenter = {
                        x: pieceOffset.left + piece.width() / 2,
                        y: pieceOffset.top + piece.height() / 2
                    };

                    const distance = Math.sqrt(
                        Math.pow(currentCenter.x - pieceCenter.x, 2) +
                        Math.pow(currentCenter.y - pieceCenter.y, 2)
                    );

                    if (distance < minDistance && distance < piece.width()) {
                        minDistance = distance;
                        endElement = piece;
                    }
                });

                if (endElement) {
                    const endPosition = endElement.position();
                    
                    $('.puzzle-piece').draggable('disable');
                    
                    currentElement.animate(endPosition, 200);
                    endElement.animate(startPosition, 200, () => {
                        $('.puzzle-piece').draggable('enable');
                        isDragging = false;
                        
                        game.moves++;
                        game.updateDisplay();
                        
                        setTimeout(() => {
                            console.log('Checking win after piece swap');
                            game.checkWin();
                        }, 250);
                    });
                } else {
                    currentElement.animate(startPosition, 200, () => {
                        isDragging = false;
                    });
                }
            }
        });
    }

    /**
     * 打乱拼图
     * 确保生成的拼图有解
     */
    shufflePuzzle() {
        const positions = this.pieces.map((_, index) => {
            const row = Math.floor(index / this.gridSize);
            const col = index % this.gridSize;
            const pieceWidth = this.pieces[0].width();
            return {
                left: col * pieceWidth,
                top: row * pieceWidth
            };
        });
        
        do {
            for (let i = positions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [positions[i], positions[j]] = [positions[j], positions[i]];
            }
        } while (!this.isSolvable(positions));
        
        this.pieces.forEach((piece, index) => {
            piece.css(positions[index]);
        });
    }

    /**
     * 检查拼图是否可解
     * @param {Array} positions - 拼图块位置数组
     * @returns {boolean} 是否可解
     */
    isSolvable(positions) {
        let inversions = 0;
        for (let i = 0; i < positions.length - 1; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                if (positions[i].top > positions[j].top || 
                    (positions[i].top === positions[j].top && positions[i].left > positions[j].left)) {
                    inversions++;
                }
            }
        }
        return inversions > 0 && inversions % 2 === 0;
    }

    /**
     * 检查是否完成拼图
     * 验证所有拼图块是否在正确位置
     */
    checkWin() {
        console.log('Checking win condition...');
        
        if ($('.puzzle-piece:animated').length > 0) {
            console.log('Animation in progress, skipping check');
            return;
        }

        const isWin = $('.puzzle-piece').toArray().every((piece) => {
            const $piece = $(piece);
            const currentPos = $piece.position();
            const index = parseInt($piece.attr('data-index'));
            const pieceWidth = $piece.width();
            const correctRow = Math.floor(index / this.gridSize);
            const correctCol = index % this.gridSize;
            const correctPos = {
                left: correctCol * pieceWidth,
                top: correctRow * pieceWidth
            };
            
            console.log(`Piece ${index}:`, {
                current: currentPos,
                correct: correctPos,
                diff: {
                    left: Math.abs(currentPos.left - correctPos.left),
                    top: Math.abs(currentPos.top - correctPos.top)
                }
            });
            
            return Math.abs(currentPos.left - correctPos.left) < 5 &&
                   Math.abs(currentPos.top - correctPos.top) < 5;
        });

        console.log('Win condition:', isWin);

        if (isWin) {
            console.log('Game won! Current level:', this.currentLevel);
            this.stopTimer();
            this.showWinModal();
        }
    }

    /**
     * 显示胜利弹窗
     * 根据当前关卡显示不同内容
     */
    showWinModal() {
        console.log('Showing win modal for level:', this.currentLevel);
        const modalTitle = $('#modal-title');
        const modalMessage = $('#modal-message');
        
        if (this.currentLevel === 3) {
            // 先显示第三关成绩
            modalTitle.text('第三关完成！');
            modalMessage.html(`
                <div class="win-message">
                    <p>🎉 恭喜通过最终关卡！</p>
                    <div class="level-stats">
                        <p>用时：${this.timeDisplay.text()}</p>
                        <p>步数：${this.moves}步</p>
                        <p>难度：16宫格</p>
                    </div>
                </div>
            `);
            
            // 修改按钮显示
            $('#modal-next').hide();
            $('#modal-restart').hide();
            
            // 添加关闭按钮
            const closeBtn = $('<button>')
                .addClass('btn primary')
                .text('关闭')
                .on('click', () => {
                    this.modal.hide();
                    // 显示通关成绩
                    this.showFinalWinModal();
                });
            
            $('.modal-buttons').empty().append(closeBtn);
        } else {
            // 单关完成提示
            const nextLevel = this.currentLevel + 1;
            const nextGridSize = nextLevel === 2 ? '9' : '16';
            modalTitle.text(`第${this.currentLevel}关完成！`);
            modalMessage.html(`
                <div class="win-message">
                    <p>🎉 恭喜通过第${this.currentLevel}关！</p>
                    <div class="level-stats">
                        <p>用时：${this.timeDisplay.text()}</p>
                        <p>步数：${this.moves}步</p>
                        <p>难度：${this.currentLevel === 1 ? '4' : '9'}宫格</p>
                    </div>
                    <p class="next-level-hint">准备好挑战${nextGridSize}宫格了吗？</p>
                </div>
            `);
            
            // 显示下一关和重玩按钮
            $('#modal-next').show().text('开始第' + nextLevel + '关');
            $('#modal-restart').text('重玩本关').removeClass('primary').show();
        }
        
        this.modal.css('display', 'flex');
    }

    /**
     * 显示最终胜利弹窗
     * 展示总成绩并提供重新开始选项
     */
    showFinalWinModal() {
        const modalTitle = $('#modal-title');
        const modalMessage = $('#modal-message');
        
        modalTitle.text('🏆 恭喜通关！');
        modalMessage.html(`
            <div class="win-message">
                <p class="congrats-text">太棒了！你已完成所有关卡！</p>
                <div class="final-stats">
                    <p>最终用时：${this.timeDisplay.text()}</p>
                    <p>总步数：${this.moves}步</p>
                </div>
                <p class="achievement-text">你已经是拼图大师了！</p>
            </div>
        `);
        
        // 保存成绩到排行榜
        const score = {
            time: this.seconds,
            moves: this.moves,
            level: this.currentLevel
        };
        leaderboard.addScore(score);
        
        $('.modal-buttons').empty()
            .append(`
                <button id="modal-restart" class="btn primary">重新开始</button>
                <button id="modal-change-image" class="btn secondary">换一张图片试试</button>
            `);
        
        $('#modal-restart').on('click', () => {
            this.currentLevel = 1;
            this.isPlaying = false;
            this.modal.hide();
            this.startGame();
        });
        
        $('#modal-change-image').on('click', () => {
            this.currentLevel = 1;
            this.isPlaying = false;
            this.modal.hide();
            this.uploadBtn.click();
        });
        
        this.isPlaying = false;
        this.uploadBtn.prop('disabled', false).removeClass('disabled');
        
        this.modal.css('display', 'flex');
    }

    /**
     * 启动计时器
     */
    startTimer() {
        this.timer = setInterval(() => {
            this.seconds++;
            this.updateDisplay();
        }, 1000);
    }

    /**
     * 停止计时器
     */
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * 更新显示
     * 更新步数、关卡和时间显示
     */
    updateDisplay() {
        this.movesDisplay.text(this.moves);
        this.currentLevelDisplay.text(this.currentLevel);
        
        const minutes = Math.floor(this.seconds / 60);
        const remainingSeconds = this.seconds % 60;
        this.timeDisplay.text(
            `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
        );
    }

    /**
     * 初始化模态框事件
     */
    initModalEvents() {
        $('#modal-next').on('click', () => {
            if (this.currentLevel < 3) {
                this.currentLevel++;
                this.modal.hide();
                this.startGame();
            }
        });

        $('#modal-restart').on('click', () => {
            // 如果是通关后重新开始，重置到第一关
            if (this.currentLevel === 3 && !this.isPlaying) {
                this.currentLevel = 1;
            }
            this.modal.hide();
            this.startGame();
        });
    }

    /**
     * 绑定预览相关事件
     */
    bindPreviewEvents() {
        this.previewBtn.on('click', () => {
            this.previewImage.attr('src', this.currentImage);
            this.overlay.show();
            this.previewContainer.show();
        });

        this.overlay.on('click', () => {
            this.hidePreview();
        });
        
        this.previewContainer.on('click', () => {
            this.hidePreview();
        });
    }

    /**
     * 隐藏预览
     */
    hidePreview() {
        this.overlay.hide();
        this.previewContainer.hide();
    }

    /**
     * 显示游戏开始提示
     */
    showGameStartTip() {
        // 移除可能存在的旧提示
        $('.tip-modal').remove();
        
        // 创建提示框
        const tipModal = $('<div>')
            .addClass('tip-modal')
            .html(`
                <div class="tip-content">
                    <p>请点击"开始游戏"按钮开始玩游戏</p>
                    <button class="btn primary">知道了</button>
                </div>
            `);
        
        // 添加到页面
        tipModal.appendTo('body');
        
        // 点击按钮关闭提示
        tipModal.find('button').on('click', () => {
            tipModal.remove();
            // 高亮开始游戏按钮
            this.startBtn.addClass('highlight-btn');
            setTimeout(() => {
                this.startBtn.removeClass('highlight-btn');
            }, 1500);
        });
        
        // 点击遮罩层关闭提示
        tipModal.on('click', (e) => {
            if ($(e.target).is('.tip-modal')) {
                tipModal.remove();
            }
        });
    }
}

// 创建全局游戏实例
let game;
$(document).ready(() => {
    game = new Game();
});

// 添加禁用按钮样式
$('<style>')
    .text(`
        .btn.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }
    `)
    .appendTo('head');

// 添加按钮高亮样式
$('<style>')
    .text(`
        .highlight-btn {
            animation: highlight 1.5s ease;
        }
        @keyframes highlight {
            0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(33,150,243,0.3); }
            50% { transform: scale(1.1); box-shadow: 0 6px 16px rgba(33,150,243,0.5); }
        }
    `)
    .appendTo('head');

// 确保样式已添加
if (!$('style#game-styles').length) {
    $('<style id="game-styles">')
        .text(`
            .tip-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                animation: fadeIn 0.3s ease;
            }
            .tip-content {
                background: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                animation: slideUp 0.3s ease;
            }
            .tip-content p {
                margin: 0 0 15px 0;
                font-size: 16px;
                color: #333;
            }
            .highlight-btn {
                animation: highlight 1.5s ease;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes highlight {
                0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(33,150,243,0.3); }
                50% { transform: scale(1.1); box-shadow: 0 6px 16px rgba(33,150,243,0.5); }
            }
        `)
        .appendTo('head');
} 