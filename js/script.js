// 歌曲資料庫
const songs = [
    {
        title: "Black mamba",
        artist: "aespa",
        url: "audio/Black mamba.mp3",
        options: ["Black mamba", "That's so true", "Spicy", "魔神"]
    },
    {
        title: "魔神",
        artist: "美秀集團",
        url: "audio/魔神.mp3",
        options: ["魔神", "偷偷愛", "外面有點冷", "關於小熊"]
    },
    {
        title: "關於小熊",
        artist: "蛋堡",
        url: "audio/關於小熊.mp3",
        options: ["關於小熊", "luther", "魔神", "偷偷愛"]
    },
    {
        title: "偷偷愛",
        artist: "美秀集團",
        url: "audio/偷偷愛.mp3",
        options: ["偷偷愛", "外面有點冷", "Black mamba", "Seoul city"]
    },
    {
        title: "我沒有用，沒辦法給你想要的生活",
        artist: "怕胖團",
        url: "audio/我沒有用，沒辦法給你想要的生活.mp3",
        options: ["我沒有用，沒辦法給你想要的生活", "That's so true", "Come around me", "外面有點冷"]
    },
    {
        title: "外面有點冷",
        artist: "國蛋",
        url: "audio/外面有點冷.mp3",
        options: ["外面有點冷", "魔神", "Spicy", "luther"]
    },
    {
        title: "That's so true",
        artist: "Gracie Abrams",
        url: "audio/That’s so true .mp3",
        options: ["That's so true", "Spicy", "Seoul city", "Come around me"]
    },
    {
        title: "Spicy",
        artist: "aespa",
        url: "audio/Spicy.mp3",
        options: ["Spicy", "Black mamba", "That's so true", "Seoul city"]
    },
    {
        title: "Seoul city",
        artist: "Jennie",
        url: "audio/Seoul city.mp3",
        options: ["Seoul city", "Come around me", "luther", "Black mamba"]
    },
    {
        title: "luther",
        artist: "SZA & Kendrick Lamar",
        url: "audio/luther.mp3",
        options: ["luther", "Come around me", "Seoul city", "關於小熊"]
    },
    {
        title: "Come around me",
        artist: "Justin Bieber",
        url: "audio/Come around me.mp3",
        options: ["Come around me", "That's so true", "Spicy", "luther"]
    }
];

// 音效設定
const soundEffects = {
    correct: new Howl({
        src: ['https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'],
        volume: 0.5
    }),
    wrong: new Howl({
        src: ['https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'],
        volume: 0.5
    }),
    gameOver: new Howl({
        src: ['https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'],
        volume: 0.5
    })
};

class MusicGame {
    constructor() {
        this.currentSong = null;
        this.score = 0;
        this.timeLeft = 60; // 改為一分鐘
        this.timer = null;
        this.sound = null;
        this.isPlaying = false;
        this.progressInterval = null;
        this.playedSongs = new Set(); // 追蹤已播放的歌曲
        
        this.initElements();
        this.initEventListeners();
        this.startNewGame();
    }

    initElements() {
        this.timerElement = document.getElementById('timer');
        this.scoreElement = document.getElementById('score');
        this.playButton = document.getElementById('playButton');
        this.optionButtons = document.querySelectorAll('.option-btn');
        this.progressBar = document.querySelector('.progress-bar');
        this.gameOverModal = new bootstrap.Modal(document.getElementById('gameOverModal'));
        this.finalScoreElement = document.getElementById('finalScore');
        this.restartButton = document.getElementById('restartGame');
    }

    initEventListeners() {
        // 播放按鈕事件
        this.playButton.addEventListener('click', () => this.togglePlay());
        
        // 答案按鈕事件
        this.optionButtons.forEach(button => {
            button.addEventListener('click', (e) => this.checkAnswer(e));
        });
        
        // 重新開始按鈕事件 - 使用箭頭函數確保 this 的正確綁定
        this.restartButton.addEventListener('click', () => {
            this.gameOverModal.hide();
            // 等待 modal 完全關閉後再重新開始
            $('#gameOverModal').on('hidden.bs.modal', () => {
                this.resetGame();
                this.startNewGame();
            });
        });
        
        document.querySelector('#gameInstructionsModal .btn-primary').addEventListener('click', () => {
            // 確保模態框關閉後初始化遊戲
            const gameInstance = new MusicGame();
            console.log('遊戲已啟動！');
        });
    }

    // 新增重置遊戲狀態的方法
    resetGame() {
        // 清理所有計時器
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }

        // 停止並清理音樂
        if (this.sound) {
            try {
                this.sound.stop();
                this.sound.unload();
                this.sound = null;
            } catch (error) {
                console.error('重置遊戲時清理音樂發生錯誤:', error);
            }
        }

        // 重置所有狀態
        this.currentSong = null;
        this.score = 0;
        this.timeLeft = 60;
        this.isPlaying = false;
        this.playedSongs.clear();

        // 重置 UI
        this.playButton.disabled = false;
        this.playButton.innerHTML = '<i class="fas fa-play"></i> 播放';
        this.progressBar.style.width = '0%';
        this.updateScore();
        this.updateTimer();

        // 重置選項按鈕
        this.optionButtons.forEach(button => {
            button.classList.remove('disabled', 'correct', 'wrong');
            button.disabled = false;
        });
    }

    startNewGame() {
        // 確保遊戲狀態完全重置
        this.resetGame();
        
        // 初始化新遊戲
        this.score = 0;
        this.timeLeft = 60;
        this.playedSongs.clear();
        
        // 更新 UI
        this.updateScore();
        this.updateTimer();
        
        // 載入新歌曲
        this.loadNewSong();
        
        // 啟動計時器
        this.startTimer();
    }    loadNewSong() {
        // 先禁用播放按鈕，直到音樂載入完成
        this.playButton.disabled = true;
        
        // 清理之前的音樂資源
        if (this.sound) {
            try {
                this.sound.unload();
            } catch (error) {
                console.error('清理前一首歌時發生錯誤:', error);
            }
            this.sound = null;
        }
        
        // 清理進度條
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        // 重置播放狀態
        this.isPlaying = false;
        this.playButton.innerHTML = '<i class="fas fa-play"></i> 播放';
        this.progressBar.style.width = '0%';

        // 選擇未播放過的歌曲
        const availableSongs = songs.filter(song => !this.playedSongs.has(song.title));
        
        // 如果所有歌曲都播放過了，就重新開始
        if (availableSongs.length === 0) {
            this.playedSongs.clear();
            this.currentSong = songs[Math.floor(Math.random() * songs.length)];
        } else {
            // 從未播放的歌曲中隨機選擇
            this.currentSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
        }
        
        // 記錄這首歌已被播放
        this.playedSongs.add(this.currentSong.title);

        console.log('正在載入歌曲:', this.currentSong.url);

        // 隨機排列選項
        const shuffledOptions = this.shuffleArray([...this.currentSong.options]);
        
        // 更新選項按鈕
        this.optionButtons.forEach((button, index) => {
            button.textContent = shuffledOptions[index];
            button.classList.remove('disabled', 'correct', 'wrong');
            button.disabled = false;
        });

        // 初始化新的音樂
        this.sound = new Howl({
            src: [this.currentSong.url],
            html5: true,
            volume: 1.0,
            preload: true,
            format: ['mp3'],
            onload: () => {
                console.log('歌曲載入成功');
                // 確保音樂載入完成後啟用播放按鈕
                if (this.playButton) {
                    this.playButton.disabled = false;
                }
            },
            onloaderror: (id, error) => {
                console.error('載入歌曲時發生錯誤:', error);
                if (this.playButton) {
                    this.playButton.disabled = true;
                }
                alert('音樂載入失敗，系統將自動載入下一首歌');
                // 如果載入失敗，自動嘗試下一首歌
                setTimeout(() => this.loadNewSong(), 1000);
            },
            onplayerror: (id, error) => {
                console.error('播放歌曲時發生錯誤:', error);
                if (this.playButton) {
                    this.playButton.disabled = true;
                }
                // 如果播放出錯，嘗試重新載入
                this.reloadCurrentSong();
            },
            onplay: () => {
                console.log('開始播放歌曲');
                this.isPlaying = true;
                if (this.playButton) {
                    this.playButton.disabled = false;
                    this.playButton.innerHTML = '<i class="fas fa-pause"></i> 暫停';
                }
                this.updateProgress();
            },
            onpause: () => {
                this.isPlaying = false;
                if (this.playButton) {
                    this.playButton.disabled = false;
                    this.playButton.innerHTML = '<i class="fas fa-play"></i> 播放';
                }
            },
            onend: () => {
                console.log('歌曲播放結束');
                this.isPlaying = false;
                if (this.playButton) {
                    this.playButton.disabled = false;
                    this.playButton.innerHTML = '<i class="fas fa-play"></i> 播放';
                }
                if (this.progressInterval) {
                    clearInterval(this.progressInterval);
                }
                this.progressBar.style.width = '0%';
            }
        });

        // 開始預載音樂
        this.sound.load();
    }    togglePlay() {
        if (!this.sound || this.playButton.disabled) {
            console.error('音樂尚未準備好或按鈕已被禁用');
            return;
        }
        
        // 暫時禁用按鈕，防止重複點擊
        this.playButton.disabled = true;
        
        console.log('切換播放狀態，目前狀態:', this.isPlaying);
        
        if (this.isPlaying) {
            try {
                this.sound.pause();
                this.isPlaying = false;
                this.playButton.innerHTML = '<i class="fas fa-play"></i> 播放';
                if (this.progressInterval) {
                    clearInterval(this.progressInterval);
                }
            } catch (error) {
                console.error('暫停時發生錯誤:', error);
            } finally {
                // 確保按鈕重新啟用
                this.playButton.disabled = false;
            }
        } else {
            try {
                const playPromise = this.sound.play();
                
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('開始播放音樂');
                        this.isPlaying = true;
                        this.playButton.innerHTML = '<i class="fas fa-pause"></i> 暫停';
                        this.playButton.disabled = false;
                        this.updateProgress();
                    }).catch(error => {
                        console.error('播放失敗:', error);
                        this.playButton.disabled = false;
                        // 如果播放失敗，嘗試重新載入音樂
                        this.reloadCurrentSong();
                    });
                } else {
                    // 如果 playPromise 是 undefined，立即啟用按鈕
                    this.playButton.disabled = false;
                }
            } catch (error) {
                console.error('播放時發生錯誤:', error);
                this.playButton.disabled = false;
                this.reloadCurrentSong();
            }
        }
    }    checkAnswer(event) {
        const selectedAnswer = event.target.textContent;
        const correct = selectedAnswer === this.currentSong.title;

        // 停止當前音樂
        if (this.sound) {
            this.sound.stop();
        }

        // 禁用所有按鈕
        this.optionButtons.forEach(btn => {
            btn.classList.add('disabled');
            if (btn.textContent === this.currentSong.title) {
                btn.classList.add('correct');
            }
        });

        if (correct) {
            soundEffects.correct.play();
            this.score += 10;
            this.updateScore();
            event.target.classList.add('correct');
        } else {
            soundEffects.wrong.play();
            event.target.classList.add('wrong');
        }

        // 延遲加載下一首歌
        setTimeout(() => {
            this.loadNewSong();
            // 確保新歌曲準備好播放
            if (this.sound) {
                this.sound.once('load', () => {
                    console.log('New song loaded and ready');
                });
            }
        }, 1500);
    }

    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();

            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    updateTimer() {
        this.timerElement.textContent = this.timeLeft;
    }

    updateScore() {
        this.scoreElement.textContent = `分數: ${this.score}`;
    }

    endGame() {
        // 播放遊戲結束音效
        soundEffects.gameOver.play();

        // 停止當前音樂和清理資源
        if (this.sound) {
            try {
                this.sound.stop();
                this.sound.unload();
            } catch (error) {
                console.error('遊戲結束時停止音樂發生錯誤:', error);
            }
        }

        // 清理計時器
        if (this.timer) {
            clearInterval(this.timer);
        }
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        // 更新分數和顯示結束畫面
        this.finalScoreElement.textContent = this.score;
        this.gameOverModal.show();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    reloadCurrentSong() {
        // 先禁用播放按鈕
        if (this.playButton) {
            this.playButton.disabled = true;
        }

        // 清理現有的音樂實例
        if (this.sound) {
            try {
                this.sound.unload();
            } catch (error) {
                console.error('清理音樂時發生錯誤:', error);
            }
        }
        
        // 重置進度條
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        this.progressBar.style.width = '0%';
        
        // 建立新的音樂實例
        this.sound = new Howl({
            src: [this.currentSong.url],
            html5: true,
            volume: 1.0,
            format: ['mp3'],
            preload: true,
            onload: () => {
                console.log('重新載入歌曲成功');
                if (this.playButton) {
                    this.playButton.disabled = false;
                }
                // 自動開始播放
                this.sound.play();
            },
            onloaderror: (id, error) => {
                console.error('重新載入歌曲失敗:', error);
                if (this.playButton) {
                    this.playButton.disabled = true;
                }
                alert('音樂載入失敗，系統將自動載入下一首歌');
                // 如果重新載入失敗，嘗試載入新的歌曲
                setTimeout(() => this.loadNewSong(), 1000);
            },
            onplayerror: (id, error) => {
                console.error('重新載入後播放失敗:', error);
                if (this.playButton) {
                    this.playButton.disabled = false;
                }
                alert('播放失敗，請再試一次');
            },
            onplay: () => {
                console.log('重新載入後開始播放');
                this.isPlaying = true;
                if (this.playButton) {
                    this.playButton.disabled = false;
                    this.playButton.innerHTML = '<i class="fas fa-pause"></i> 暫停';
                }
                this.updateProgress();
            },
            onpause: () => {
                this.isPlaying = false;
                if (this.playButton) {
                    this.playButton.disabled = false;
                    this.playButton.innerHTML = '<i class="fas fa-play"></i> 播放';
                }
            },
            onend: () => {
                this.isPlaying = false;
                if (this.playButton) {
                    this.playButton.disabled = false;
                    this.playButton.innerHTML = '<i class="fas fa-play"></i> 播放';
                }
                if (this.progressInterval) {
                    clearInterval(this.progressInterval);
                }
                this.progressBar.style.width = '0%';
            }
        });
        
        // 開始預載
        this.sound.load();
    }

    updateProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        const updateProgressBar = () => {
            if (this.sound && this.sound.playing()) {
                try {
                    const seek = this.sound.seek() || 0;
                    const duration = this.sound.duration() || 1;
                    const progress = (seek / duration) * 100;
                    this.progressBar.style.width = `${Math.min(100, progress)}%`;
                } catch (error) {
                    console.error('更新進度條時發生錯誤:', error);
                    if (this.progressInterval) {
                        clearInterval(this.progressInterval);
                    }
                }
            } else if (!this.isPlaying) {
                if (this.progressInterval) {
                    clearInterval(this.progressInterval);
                }
                this.progressBar.style.width = '0%';
            }
        };

        // 立即更新一次進度條
        updateProgressBar();
        // 設定定期更新
        this.progressInterval = setInterval(updateProgressBar, 100);
    }
}

class MusicMixer {
    constructor() {
        this.songs = songs;
        this.mixedSongs = [];
        this.mixer = null;
        this.initMixer();
    }

    initMixer() {
        // 隨機選擇兩首歌
        const shuffledSongs = this.shuffleArray([...this.songs]);
        this.mixedSongs = shuffledSongs.slice(0, 2);

        console.log('混音歌曲:', this.mixedSongs.map(song => song.title));

        // 初始化混音播放器
        this.mixer = [
            new Howl({
                src: [this.mixedSongs[0].url],
                volume: 0.5,
                html5: true
            }),
            new Howl({
                src: [this.mixedSongs[1].url],
                volume: 0.5,
                html5: true
            })
        ];
    }

    playMix() {
        this.mixer.forEach(player => player.play());
    }

    stopMix() {
        this.mixer.forEach(player => player.stop());
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// 在遊戲中初始化混音功能
const musicMixer = new MusicMixer();

// 示例：播放混音
musicMixer.playMix();

// 示例：停止混音
setTimeout(() => {
    musicMixer.stopMix();
}, 10000); // 10秒後停止混音

// 當頁面載入完成後初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new MusicGame();
});
