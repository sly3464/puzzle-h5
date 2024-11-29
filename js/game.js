class Game {
    constructor() {
        this.currentLevel = 1;
        this.moves = 0;
        this.timer = null;
        this.seconds = 0;
        this.isPlaying = false;
        this.gridSize = 2; // 默认从2x2开始
        this.pieces = [];
        this.currentImage = 'images/default-puzzle.jpg';
        
        this.initElements();
        this.bindEvents();
        this.initModalEvents();
        
        this.createInitialPuzzle();
        
        this.previewBtn = $('#preview-btn');
        this.previewContainer = $('#preview-container');
        this.previewImage = $('#preview-image');
        
        this.overlay = $('<div class="overlay"></div>').appendTo('body');
        
        this.bindPreviewEvents();
    }

    createInitialPuzzle() {
        const img = new Image();
        img.onload = () => {
            this.createPuzzle();
        };
        img.src = this.currentImage;
    }

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

    bindEvents() {
        this.startBtn.on('click', () => {
            if (!this.isPlaying) {
                this.startGame();
                this.startBtn.text('重新开始');
            } else {
                this.resetGame();
            }
        });
        
        this.uploadBtn.on('click', () => this.imageUpload.click());
        this.imageUpload.on('change', (e) => this.handleImageUpload(e));
    }

    resetGame() {
        switch(this.currentLevel) {
            case 1:
                this.gridSize = 2;
                break;
            case 2:
                this.gridSize = 3;
                break;
            case 3:
                this.gridSize = 4;
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

    startGame() {
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
    }

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
                    boxSizing: 'border-box'
                })
                .attr('data-index', i);
            
            this.pieces.push(piece);
            this.puzzleContainer.append(piece);
        }
        
        this.shufflePuzzle();
        
        if (this.isPlaying) {
            this.initDraggable();
        }
    }

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

    initDraggable() {
        let startPosition = null;
        let startElement = null;

        $('.puzzle-piece').draggable({
            containment: this.puzzleContainer,
            zIndex: 1000,
            start: function(event, ui) {
                startPosition = ui.position;
                startElement = $(this);
                $(this).addClass('dragging');
            },
            stop: function(event, ui) {
                $(this).removeClass('dragging');
                let endElement = null;
                
                // 获取当前拖动元素的中心点
                const draggedCenter = {
                    x: ui.offset.left + $(this).width() / 2,
                    y: ui.offset.top + $(this).height() / 2
                };

                // 检查是否与其他拼图块重叠
                $('.puzzle-piece').not(this).each(function() {
                    const piece = $(this);
                    const pieceOffset = piece.offset();
                    const pieceCenter = {
                        x: pieceOffset.left + piece.width() / 2,
                        y: pieceOffset.top + piece.height() / 2
                    };

                    // 计算两个中心点之间的距离
                    const distance = Math.sqrt(
                        Math.pow(draggedCenter.x - pieceCenter.x, 2) +
                        Math.pow(draggedCenter.y - pieceCenter.y, 2)
                    );

                    // 如果距离小于拼图块宽度的一半，认为发生重叠
                    if (distance < piece.width() / 2) {
                        endElement = piece;
                        return false; // 跳出each循环
                    }
                });

                // 如果找到重叠的元素，执行交换
                if (endElement) {
                    const endPosition = endElement.position();
                    
                    // 交换位置
                    startElement.animate(endPosition, 200);
                    endElement.animate(startPosition, 200);
                    
                    // 增加移动步数
                    game.moves++;
                    game.updateDisplay();
                    
                    // 检查是否完成
                    setTimeout(() => game.checkWin(), 250);
                } else {
                    // 如果没有重叠，返回起始位置
                    startElement.animate(startPosition, 200);
                }
            }
        });
    }

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

    checkWin() {
        const isWin = $('.puzzle-piece').toArray().every((piece) => {
            const $piece = $(piece);
            const currentPos = $piece.position();
            const index = parseInt($piece.attr('data-index'));
            const correctPos = {
                left: (index % this.gridSize) * $piece.width(),
                top: Math.floor(index / this.gridSize) * $piece.height()
            };
            
            return Math.abs(currentPos.left - correctPos.left) < 5 &&
                   Math.abs(currentPos.top - correctPos.top) < 5;
        });

        if (isWin) {
            this.stopTimer();
            this.showWinModal();
        }
    }

    showWinModal() {
        const modalTitle = $('#modal-title');
        const modalMessage = $('#modal-message');
        
        if (this.currentLevel === 3) {
            modalTitle.text('恭喜通关！');
            modalMessage.html(`
                <div class="win-message">
                    <p>🎉 恭喜你完成了所有关卡！</p>
                    <div class="final-stats">
                        <p>最终用时：${this.timeDisplay.text()}</p>
                        <p>总步数：${this.moves}步</p>
                    </div>
                </div>
            `);
            
            $('#modal-next').hide();
            $('#modal-restart').text('重新挑战');
        } else {
            const nextLevel = this.currentLevel + 1;
            const nextGridSize = nextLevel === 2 ? '9' : '16';
            modalTitle.text(`第${this.currentLevel}关完成！`);
            modalMessage.html(`
                <div class="win-message">
                    <p>🎉 恭喜通过第${this.currentLevel}关！</p>
                    <div class="level-stats">
                        <p>用时：${this.timeDisplay.text()}</p>
                        <p>步数：${this.moves}步</p>
                    </div>
                    <p class="next-level-hint">准备好挑战${nextGridSize}宫格了吗？</p>
                </div>
            `);
            
            $('#modal-next').toggle(this.currentLevel < 3);
        }
        
        this.modal.css('display', 'flex');
        
        const score = {
            level: this.currentLevel,
            moves: this.moves,
            time: this.seconds
        };
        gameStorage.saveBestScore(this.gridSize, score);
        leaderboard.addScore(this.gridSize, score);
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.seconds++;
            this.updateDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateDisplay() {
        this.movesDisplay.text(this.moves);
        this.currentLevelDisplay.text(this.currentLevel);
        
        const minutes = Math.floor(this.seconds / 60);
        const remainingSeconds = this.seconds % 60;
        this.timeDisplay.text(
            `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
        );
    }

    initModalEvents() {
        $('#modal-next').on('click', () => {
            if (this.currentLevel < 3) {
                this.currentLevel++;
                this.modal.hide();
                this.startGame();
            }
        });

        $('#modal-restart').on('click', () => {
            if (this.currentLevel === 3) {
                this.currentLevel = 1;
            }
            this.modal.hide();
            this.startGame();
        });

        $('#modal-upload').on('click', () => {
            this.modal.hide();
            this.uploadBtn.click();
        });
    }

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

    hidePreview() {
        this.overlay.hide();
        this.previewContainer.hide();
    }
}

// 创建全局游戏实例
let game;
$(document).ready(() => {
    game = new Game();
}); 