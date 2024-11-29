import { audioManager } from './audio.js';

class Game {
    constructor() {
        this.currentLevel = 1;
        this.moves = 0;
        this.timer = null;
        this.seconds = 0;
        this.isPlaying = false;
        this.gridSize = 3; // 默认3x3
        this.pieces = [];
        this.currentImage = null;
        
        this.initElements();
        this.bindEvents();
        this.initModalEvents();
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
            audioManager.play('click');
            if (this.currentImage) {
                this.startGame();
            } else {
                alert('请先上传图片！');
                this.uploadBtn.click();
            }
        });

        this.uploadBtn.on('click', () => {
            audioManager.play('click');
            this.imageUpload.click();
        });

        this.imageUpload.on('change', (e) => this.handleImageUpload(e));
    }

    initModalEvents() {
        $('#modal-next').on('click', () => {
            this.currentLevel++;
            this.modal.hide();
            this.startGame();
        });

        $('#modal-restart').on('click', () => {
            this.modal.hide();
            this.startGame();
        });

        $('#modal-upload').on('click', () => {
            this.modal.hide();
            this.uploadBtn.click();
        });
    }

    startGame() {
        this.isPlaying = true;
        this.moves = 0;
        this.seconds = 0;
        this.updateDisplay();
        
        this.createPuzzle();
        this.startTimer();
        
        audioManager.play('start');
        this.startBtn.text('重新开始');
    }

    createPuzzle() {
        this.puzzleContainer.empty();
        const containerWidth = 300;
        const pieceWidth = containerWidth / this.gridSize;
        
        // 创建拼图块
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
                    backgroundPosition: `-${col * pieceWidth}px -${row * pieceWidth}px`
                })
                .attr('data-index', i);
            
            this.pieces.push(piece);
            this.puzzleContainer.append(piece);
        }

        this.shufflePuzzle();
        this.initDraggable();
    }

    initDraggable() {
        $('.puzzle-piece').draggable({
            containment: this.puzzleContainer,
            zIndex: 1000,
            start: (e, ui) => {
                audioManager.play('drag');
                $(e.target).addClass('dragging');
            },
            stop: (e, ui) => {
                audioManager.play('drop');
                $(e.target).removeClass('dragging');
                this.moves++;
                this.updateDisplay();
                this.checkWin();
            }
        }).droppable({
            accept: '.puzzle-piece',
            drop: (e, ui) => {
                const dragged = ui.draggable;
                const dropped = $(e.target);
                
                if (!dragged.is(dropped)) {
                    const draggedPos = dragged.position();
                    const droppedPos = dropped.position();
                    
                    dragged.css(droppedPos);
                    dropped.css(draggedPos);
                    
                    // 交换索引
                    const tempIndex = dragged.attr('data-index');
                    dragged.attr('data-index', dropped.attr('data-index'));
                    dropped.attr('data-index', tempIndex);
                }
            }
        });
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.currentImage = event.target.result;
                this.startGame();
            };
            reader.readAsDataURL(file);
        }
    }

    shufflePuzzle() {
        const pieces = this.pieces.slice();
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }
        
        pieces.forEach((piece, index) => {
            this.puzzleContainer.append(piece);
        });
    }

    checkWin() {
        const isWin = $('.puzzle-piece').toArray().every((piece, index) => {
            return $(piece).attr('data-index') === index.toString();
        });

        if (isWin) {
            audioManager.play('complete');
            this.stopTimer();
            this.showWinModal();
        }
    }

    showWinModal() {
        const modalTitle = $('#modal-title');
        const modalMessage = $('#modal-message');
        
        modalTitle.text('恭喜过关！');
        modalMessage.text(`用时：${this.timeDisplay.text()}，步数：${this.moves}`);
        this.modal.css('display', 'flex');
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
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
        
        const minutes = Math.floor(this.seconds / 60);
        const remainingSeconds = this.seconds % 60;
        this.timeDisplay.text(
            `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
        );
        
        this.currentLevelDisplay.text(this.currentLevel);
    }
}

// 创建游戏实例
$(document).ready(() => {
    const game = new Game();
}); 