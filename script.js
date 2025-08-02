document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const gameContainer = document.querySelector('.game-container');
  const puzzleDiv = document.querySelector('.puzzle');
  const answerDiv = document.querySelector('.answer');
  const checkBtn = document.getElementById('checkBtn');
  const resultDiv = document.getElementById('result');
  const hintP = document.querySelector('.hint p'); // 獲取提示的 <p> 元素

  // ======================================================================
  // 1. 建立題庫 (您可以自由新增、修改或刪除)
  // ======================================================================
  const questions = [
    { word: 'machinery', hint: 'A machine or device for moving or processing things.' },
    { word: 'javascript', hint: 'A popular programming language for the web.' },
    { word: 'developer', hint: 'A person who creates computer software.' },
    { word: 'interface', hint: 'A point where two systems, subjects, or organizations meet and interact.' },
    { word: 'network', hint: 'A group or system of interconnected people or things.' },
    { word: 'database', hint: 'An organized collection of structured information.' },
    { word: 'security', hint: 'The state of being free from danger or threat.' },
    { word: 'algorithm', hint: 'A process or set of rules to be followed in calculations.' },
    { word: 'variable', hint: 'A named storage location in a program.' },
    { word: 'function', hint: 'A block of code designed to perform a particular task.' }
  ];

  // --- Game State ---
  let currentQuestionIndex = 0; // 2. 追蹤目前在哪一題
  let draggedLetter = null;

  // --- Functions ---

  function shuffleWord(wordToShuffle) {
    const letters = wordToShuffle.split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters;
  }
  
  function getRandomColor() {
    const colors = ['#f7b7b7', '#b7d7f7', '#f7d7b7', '#d7f7b7', '#f7f7b7'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function moveLetterToAnswer(letter) {
    if (!letter) return;
    answerDiv.appendChild(letter);
    updateLetterListeners(letter, 'answer');
  }

  function moveLetterToPuzzle(letter) {
    if (!letter) return;
    puzzleDiv.appendChild(letter);
    updateLetterListeners(letter, 'puzzle');
  }

  function updateLetterListeners(letter, location) {
    letter.removeEventListener('click', handlePuzzleLetterClick);
    letter.removeEventListener('click', handleAnswerLetterClick);
    if (location === 'puzzle') {
      letter.addEventListener('click', handlePuzzleLetterClick);
      letter.setAttribute('draggable', 'true');
    } else {
      letter.addEventListener('click', handleAnswerLetterClick);
      letter.setAttribute('draggable', 'true');
    }
  }
  
  // --- Event Handlers ---

  function handlePuzzleLetterClick(event) {
    moveLetterToAnswer(event.target);
  }

  function handleAnswerLetterClick(event) {
    moveLetterToPuzzle(event.target);
  }

  function handleDragStart(event) {
    draggedLetter = event.target;
    event.dataTransfer.setData('text/plain', draggedLetter.textContent);
  }

  /**
   * 4. 檢查答案與處理遊戲進程
   */
  function checkAnswer() {
    const currentWord = questions[currentQuestionIndex].word;
    const answerLetters = Array.from(answerDiv.children).map(letter => letter.textContent).join('');
    
    if (answerLetters === currentWord) {
      resultDiv.textContent = 'Correct!';
      resultDiv.style.color = 'green';
      
      currentQuestionIndex++; // 移至下一題
      
      setTimeout(() => {
        if (currentQuestionIndex < questions.length) {
          loadQuestion(); // 如果還有題目，載入下一題
        } else {
          showGameCompletion(); // 如果全部答完，顯示結束畫面
        }
      }, 1500); // 延遲 1.5 秒讓玩家看到 "Correct!"

    } else {
      resultDiv.textContent = 'Try Again!';
      resultDiv.style.color = 'red';
      
      // 答錯時，延遲一下再重置當前題目
      setTimeout(() => {
        // 只重置當前題目，而不是整個遊戲
        loadQuestion(); 
      }, 1200);
    }
  }
  
  /**
   * 3. 載入特定關卡的題目和提示
   */
  function loadQuestion() {
    // 清空上個關卡的狀態
    puzzleDiv.innerHTML = '';
    answerDiv.innerHTML = '';
    resultDiv.textContent = '';
    resultDiv.classList.remove('red', 'green');
    
    // 獲取當前題目資料
    const currentQuestion = questions[currentQuestionIndex];
    const shuffledLetters = shuffleWord(currentQuestion.word);
    
    // 更新提示文字
    hintP.textContent = `Hint: ${currentQuestion.hint}`;
    
    // 建立新的字母方塊
    shuffledLetters.forEach(letterText => {
      const letterDiv = document.createElement('div');
      letterDiv.classList.add('letter');
      letterDiv.textContent = letterText;
      letterDiv.style.backgroundColor = getRandomColor();
      letterDiv.addEventListener('dragstart', handleDragStart);
      updateLetterListeners(letterDiv, 'puzzle');
      puzzleDiv.appendChild(letterDiv);
    });
  }
  
  /**
   * 當所有題目都回答完畢時呼叫
   */
  function showGameCompletion() {
    gameContainer.innerHTML = `
      <h1>Congratulations!</h1>
      <p style="font-size: 20px; color: #333;">You have completed all the word puzzles!</p>
      <button onclick="location.reload()">Play Again</button>
    `;
  }

  // --- Event Listener Setup ---
  answerDiv.addEventListener('dragover', (event) => event.preventDefault());
  answerDiv.addEventListener('drop', (event) => {
    event.preventDefault();
    if (draggedLetter && draggedLetter.parentElement !== answerDiv) {
      moveLetterToAnswer(draggedLetter);
      draggedLetter = null;
    }
  });

  puzzleDiv.addEventListener('dragover', (event) => event.preventDefault());
  puzzleDiv.addEventListener('drop', (event) => {
    event.preventDefault();
    if (draggedLetter && draggedLetter.parentElement !== puzzleDiv) {
      moveLetterToPuzzle(draggedLetter);
      draggedLetter = null;
    }
  });

  checkBtn.addEventListener('click', checkAnswer);

  // --- Start the Game ---
  loadQuestion(); // 初始載入第一題
});
