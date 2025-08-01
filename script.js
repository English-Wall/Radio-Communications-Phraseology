// Puzzle word (can be replaced with any word you want)
const word = 'engine';

// 隨機生成顏色
function getRandomColor() {
  const colors = ['#f7b7b7', '#b7d7f7', '#f7d7b7', '#d7f7b7', '#f7f7b7'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Shuffle the word to create a puzzle
function shuffleWord(word) {
  const letters = word.split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters;
}

// Create the puzzle
function createPuzzle() {
  const shuffledLetters = shuffleWord(word);
  const puzzleDiv = document.querySelector('.puzzle');
  puzzleDiv.innerHTML = ''; // Clear existing letters

  shuffledLetters.forEach(letter => {
    const letterDiv = document.createElement('div');
    letterDiv.classList.add('letter');
    letterDiv.textContent = letter;
    letterDiv.setAttribute('draggable', 'true');
    letterDiv.style.backgroundColor = getRandomColor(); // 設置隨機顏色
    letterDiv.addEventListener('dragstart', dragStart);
    puzzleDiv.appendChild(letterDiv);
  });
}

// Handle drag start event
let draggedLetter = null;
function dragStart(event) {
  draggedLetter = event.target;
  event.dataTransfer.setData('text/plain', draggedLetter.textContent);
}

// Allow dropping letters into the answer area
const answerDiv = document.querySelector('.answer');
answerDiv.addEventListener('dragover', function(event) {
  event.preventDefault();
});

answerDiv.addEventListener('drop', function(event) {
  event.preventDefault();
  if (draggedLetter) {
    answerDiv.appendChild(draggedLetter); // 把字母放到答案區域
    draggedLetter.style.opacity = 1;
    draggedLetter.removeAttribute('draggable'); // 移除拖放屬性
    draggedLetter = null;
  }
});

// Check the answer
function checkAnswer() {
  const answerLetters = Array.from(answerDiv.children).map(letter => letter.textContent);
  const resultDiv = document.getElementById('result');
  
  if (answerLetters.join('') === word) {
    resultDiv.textContent = 'Correct!';
    resultDiv.style.color = 'green';
  } else {
    resultDiv.textContent = 'Try Again!';
    resultDiv.style.color = 'red';
  }
}

// Initialize the game
createPuzzle();

// Add event listener for the check button
document.getElementById('checkBtn').addEventListener('click', checkAnswer);
