class PuzzleGame {
    constructor() {
        this.currentLevel = 1;
        this.maxLevel = 3;
        this.levelConfig = {
            1: { size: 2, name: "初级 4宫格" },
            2: { size: 3, name: "中级 9宫格" },
            3: { size: 4, name: "高级 16宫格" }
        };
        this.size = this.levelConfig[this.currentLevel].size;
        this.pieces = [];
        this.moves = 0;
        this.timer = null;
        this.seconds = 0;
        this.isPlaying = false;
        this.currentImage = null;
        this.levelTimes = {
            1: 0,
            2: 0,
            3: 0
        };
        this.totalTime = 0;
        
        this.initElements();
        this.initEventListeners();
    }
    
    initElements() {
        this.$puzzleContainer = $('#puzzle');
        this.$startBtn = $('#start-btn');
        this.$uploadBtn = $('#upload-btn');
        this.$imageUpload = $('#image-upload');
        this.$movesDisplay = $('#moves');
        this.$timeDisplay = $('#time');
        this.$levelDisplay = $('#current-level');
        this.$modal = $('#gameModal');
        this.$modalTitle = $('#modal-title');
        this.$modalMessage = $('#modal-message');
        this.$modalNext = $('#modal-next');
        this.$modalRestart = $('#modal-restart');
        this.$modalUpload = $('#modal-upload');
    }
    
    initEventListeners() {
        this.$startBtn.on('click', () => this.startGame());
        $('#upload-btn').click(() => {
            $('#image-upload').click();
        });
        
        $('#image-upload').on('change', (e) => {
            this.handleImageUpload(e);
        });
        
        this.$modalNext.on('click', () => {
            this.hideModal();
            this.startNextLevel();
        });
        
        this.$modalRestart.on('click', () => {
            this.hideModal();
            this.resetGame();
        });
        
        this.$modalUpload.on('click', () => {
            this.hideModal();
            this.$imageUpload.click();
        });
    }

    showModal(title, message, buttons = ['next']) {
        this.$modalTitle.text(title);
        this.$modalMessage.text(message);
        
        this.$modalNext.hide();
        this.$modalRestart.hide();
        this.$modalUpload.hide();
        
        buttons.forEach(button => {
            switch(button) {
                case 'next':
                    this.$modalNext.show();
                    break;
                case 'restart':
                    this.$modalRestart.show();
                    break;
                case 'upload':
                    this.$modalUpload.show();
                    break;
            }
        });
        
        this.$modal.css('display', 'flex');
    }

    hideModal() {
        this.$modal.hide();
    }

    startNextLevel() {
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            this.size = this.levelConfig[this.currentLevel].size;
            this.$levelDisplay.text(this.currentLevel);
            this.moves = 0;
            this.seconds = 0;
            this.updateDisplay();
            this.createPuzzlePieces();
            this.startTimer();
            
            setTimeout(() => {
                this.shufflePieces();
            }, 1000);
        }
    }

    resetGame() {
        this.currentLevel = 1;
        this.size = this.levelConfig[this.currentLevel].size;
        this.$levelDisplay.text(this.currentLevel);
        this.moves = 0;
        this.seconds = 0;
        this.levelTimes = {1: 0, 2: 0, 3: 0};
        this.totalTime = 0;
        this.updateDisplay();
        this.startGame();
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.match('image.*')) {
                alert('请选择图片文件！');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.currentImage = img;
                    this.$imageUpload.val('');
                    this.resetGame();
                };
                img.onerror = () => {
                    alert('图片加载失败，请重试！');
                };
                img.src = e.target.result;
            };

            reader.onerror = () => {
                alert('图片读取失败，请重试！');
            };

            try {
                reader.readAsDataURL(file);
            } catch (error) {
                alert('图片处理失败，请重试！');
            }
        }
    }

    startGame() {
        if (!this.currentImage) {
            alert('请先上传图片！');
            return;
        }
        
        this.isPlaying = true;
        this.moves = 0;
        this.seconds = 0;
        this.updateDisplay();
        
        this.showMessage(`第 ${this.currentLevel} 关：${this.levelConfig[this.currentLevel].name}`, 2000);
        
        this.createPuzzlePieces();
        setTimeout(() => {
            this.shufflePieces();
        }, 1000);
        
        this.startTimer();
    }

    checkWin() {
        let isWin = true;
        this.$puzzleContainer.children().each((index, piece) => {
            if ($(piece).data('index') !== index) {
                isWin = false;
                return false;
            }
        });
        
        if (isWin) {
            clearInterval(this.timer);
            this.isPlaying = false;
            
            this.levelTimes[this.currentLevel] = this.seconds;
            
            this.totalTime = Object.values(this.levelTimes).reduce((a, b) => a + b, 0);
            
            this.$puzzleContainer.children().each(function() {
                $(this).css('transition', 'transform 0.5s')
                    .css('transform', 'scale(1.02)');
            });
            
            setTimeout(() => {
                this.$puzzleContainer.children().css('transform', 'scale(1)');
                
                if (this.currentLevel < this.maxLevel) {
                    this.showModal(
                        `第 ${this.currentLevel} 关完成！`,
                        `本关用时：${this.formatTime(this.seconds)}\n步数：${this.moves}\n准备好挑战下一关了吗？`,
                        ['next']
                    );
                } else {
                    const message = `
                        恭喜你完成所有关卡！
                        
                        第一关用时：${this.formatTime(this.levelTimes[1])}
                        第二关用时：${this.formatTime(this.levelTimes[2])}
                        第三关用时：${this.formatTime(this.levelTimes[3])}
                        
                        总用时：${this.formatTime(this.totalTime)}
                        
                        是否要重新挑战？
                    `.trim();
                    
                    this.showModal(
                        '恭喜通关！',
                        message,
                        ['restart', 'upload']
                    );
                }
            }, 600);
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    createPuzzlePieces() {
        this.$puzzleContainer.empty();
        this.pieces = [];
        
        const pieceSize = 100 / this.size;
        
        for (let i = 0; i < this.size * this.size; i++) {
            const $piece = $('<div>')
                .addClass('puzzle-piece')
                .data('index', i);
            
            const row = Math.floor(i / this.size);
            const col = i % this.size;
            
            $piece.css({
                backgroundImage: `url(${this.currentImage.src})`,
                backgroundSize: `${this.size * 100}%`,
                backgroundPosition: `${-col * 100}% ${-row * 100}%`,
                width: `${pieceSize}%`,
                height: `${pieceSize}%`,
                position: 'absolute',
                left: `${col * pieceSize}%`,
                top: `${row * pieceSize}%`
            });
            
            this.initDraggable($piece);
            this.$puzzleContainer.append($piece);
            this.pieces.push(i);
        }
    }
    
    initDraggable($piece) {
        $piece.draggable({
            containment: this.$puzzleContainer,
            zIndex: 1000,
            start: (event, ui) => {
                $(ui.helper).addClass('dragging');
            },
            stop: (event, ui) => {
                $(ui.helper).removeClass('dragging');
                const index = $(ui.helper).data('index');
                const row = Math.floor(index / this.size);
                const col = index % this.size;
                const pieceSize = 100 / this.size;
                
                $(ui.helper).css({
                    left: `${col * pieceSize}%`,
                    top: `${row * pieceSize}%`
                });
            }
        }).droppable({
            accept: '.puzzle-piece',
            tolerance: 'pointer',
            drop: (event, ui) => {
                const $dragged = $(ui.draggable);
                const $target = $(event.target);
                
                if ($dragged.is($target)) return;
                
                const draggedIndex = $dragged.data('index');
                const targetIndex = $target.data('index');
                
                const pieceSize = 100 / this.size;
                const draggedRow = Math.floor(draggedIndex / this.size);
                const draggedCol = draggedIndex % this.size;
                const targetRow = Math.floor(targetIndex / this.size);
                const targetCol = targetIndex % this.size;
                
                $dragged.css({
                    left: `${targetCol * pieceSize}%`,
                    top: `${targetRow * pieceSize}%`
                }).data('index', targetIndex);
                
                $target.css({
                    left: `${draggedCol * pieceSize}%`,
                    top: `${draggedRow * pieceSize}%`
                }).data('index', draggedIndex);
                
                this.moves++;
                this.updateDisplay();
                this.checkWin();
            }
        });
    }
    
    shufflePieces() {
        for (let i = 0; i < 50; i++) {
            const pieceSize = 100 / this.size;
            const $pieces = this.$puzzleContainer.children().toArray();
            
            const index1 = Math.floor(Math.random() * $pieces.length);
            const index2 = Math.floor(Math.random() * $pieces.length);
            
            const $piece1 = $($pieces[index1]);
            const $piece2 = $($pieces[index2]);
            
            const index1Data = $piece1.data('index');
            const index2Data = $piece2.data('index');
            
            const pos1 = {
                left: `${(index1Data % this.size) * pieceSize}%`,
                top: `${Math.floor(index1Data / this.size) * pieceSize}%`
            };
            
            const pos2 = {
                left: `${(index2Data % this.size) * pieceSize}%`,
                top: `${Math.floor(index2Data / this.size) * pieceSize}%`
            };
            
            $piece1.css(pos2).data('index', index2Data);
            $piece2.css(pos1).data('index', index1Data);
        }
    }
    
    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.timer = setInterval(() => {
            this.seconds++;
            this.updateDisplay();
        }, 1000);
    }
    
    updateDisplay() {
        this.$movesDisplay.text(this.moves);
        const minutes = Math.floor(this.seconds / 60);
        const remainingSeconds = this.seconds % 60;
        this.$timeDisplay.text(
            `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
        );
    }
    
    showMessage(text, duration = 2000) {
        $('.game-message').remove();
        
        const $message = $('<div>')
            .addClass('game-message')
            .text(text)
            .css({
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '5px',
                fontSize: '18px',
                zIndex: 1001,
                opacity: 0
            })
            .appendTo('body');

        $message.animate({ opacity: 1 }, 300);

        setTimeout(() => {
            $message.animate({ opacity: 0 }, 300, function() {
                $(this).remove();
            });
        }, duration);
    }
}

$(document).ready(() => {
    window.game = new PuzzleGame();
}); 