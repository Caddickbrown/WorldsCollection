// Island School Quiz — Teach the Class
// Self-contained DOM-based minigame. No Three.js required.

import { getDifficulty, recordCompletion } from './job_progression.js';

export class SchoolMinigame {
  constructor() {
    this._active = false;
    this._container = null;
    this._score = 0;
    this._questionIndex = 0;
    this._timeLeft = 30;
    this._answered = false;
    this._frameId = null;
    this._lastTime = null;
    this._gameOver = false;
    this._keyHandler = null;
    this._correctCount = 0;

    // CAD-435: Full question bank — shuffled at start so repeats are rare
    this._questionBank = [
      { q: 'What does Mabel bake every morning?', opts: ['Pies', 'Bread', 'Cakes'], answer: 1 },
      { q: 'What animal lives near the farm?', opts: ['Lions', 'Sheep', 'Dolphins'], answer: 1 },
      { q: 'What does Lena tend at the lighthouse?', opts: ['The light', 'The fish', 'The garden'], answer: 0 },
      { q: 'Where does Rosa work?', opts: ['The bakery', 'The dock', 'The library'], answer: 2 },
      { q: 'What time does Jack go fishing?', opts: ['5am', '10am', '2pm'], answer: 0 },
      { q: 'What colour is the café roof?', opts: ['Red', 'Dark brown', 'Blue'], answer: 1 },
      { q: 'What does Jin study in the forest?', opts: ['Birds', 'Plants', 'Rocks'], answer: 1 },
      { q: 'Who runs The Anchor pub?', opts: ['Barney', 'Jack', 'Otto'], answer: 0 },
      { q: 'How does Gus the postman get around?', opts: ['On foot', 'By boat', 'By van'], answer: 0 },
      { q: 'What does Petra do in her treehouse?', opts: ['Sleep', 'Paint', 'Cook'], answer: 1 },
      // New nature / island-themed questions
      { q: 'What powers most buildings on the island?', opts: ['Coal', 'Solar panels', 'Diesel generators'], answer: 1 },
      { q: 'Which bird is commonly seen near the cliffs?', opts: ['Penguin', 'Seagull', 'Parrot'], answer: 1 },
      { q: 'What grows in the community garden?', opts: ['Flowers only', 'Vegetables', 'Bamboo'], answer: 1 },
      { q: 'Where is the wind turbine located?', opts: ['The beach', 'Wind Ridge', 'Town Square'], answer: 1 },
      { q: 'What do bees produce at the apiary?', opts: ['Wax only', 'Honey', 'Silk'], answer: 1 },
      { q: 'What type of energy does the island primarily use?', opts: ['Fossil fuels', 'Nuclear', 'Renewable'], answer: 2 },
      { q: 'Which sea creature can be found in the rock pools?', opts: ['Starfish', 'Whale', 'Shark'], answer: 0 },
      { q: 'What is the tallest structure on the island?', opts: ['The school', 'The lighthouse', 'The café'], answer: 1 },
      { q: 'What does Otto do at the workshop?', opts: ['Bakes bread', 'Repairs and builds things', 'Teaches children'], answer: 1 },
      { q: 'Where can you find pressed flowers on the island?', opts: ['The pub', 'Jin\'s collection', 'The dock'], answer: 1 },
      { q: 'What natural event sometimes disrupts island life?', opts: ['Earthquakes', 'Storms', 'Volcanic eruptions'], answer: 1 },
      { q: 'What time of day do fireflies appear?', opts: ['Morning', 'Afternoon', 'Evening'], answer: 2 },
    ];
    this._questions = [];

    this._buildUI();
  }

  _buildUI() {
    const container = document.createElement('div');
    container.id = 'school-minigame';
    container.style.cssText = `
      position: fixed;
      inset: 0;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'Georgia', serif;
      background: radial-gradient(ellipse at center top, #2a3a1e 0%, #1a2610 50%, #0f1a08 100%);
      overflow: hidden;
      padding: 20px;
      box-sizing: border-box;
    `;

    // Classroom background deco — sunlight strips
    for (let i = 0; i < 4; i++) {
      const ray = document.createElement('div');
      ray.style.cssText = `
        position: absolute;
        top: 0;
        left: ${15 + i * 22}%;
        width: 60px;
        height: 100%;
        background: linear-gradient(180deg, rgba(255,230,100,0.06) 0%, transparent 60%);
        transform: skewX(-8deg);
        pointer-events: none;
      `;
      container.appendChild(ray);
    }

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 760px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    `;

    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
      color: #c8e6a0;
      font-size: 20px;
      font-weight: bold;
      text-shadow: 0 1px 6px rgba(0,0,0,0.7);
    `;
    titleEl.textContent = '📚 Island School';

    const hudRight = document.createElement('div');
    hudRight.style.cssText = `display: flex; gap: 20px; align-items: center;`;

    const scoreEl = document.createElement('div');
    scoreEl.id = 'school-score';
    scoreEl.style.cssText = `color: #f5c842; font-size: 18px; font-weight: bold;`;
    scoreEl.textContent = 'Score: 0';

    const progressEl = document.createElement('div');
    progressEl.id = 'school-progress';
    progressEl.style.cssText = `color: #b2d89a; font-size: 16px;`;
    progressEl.textContent = 'Q 1 / 10';

    hudRight.appendChild(progressEl);
    hudRight.appendChild(scoreEl);
    header.appendChild(titleEl);
    header.appendChild(hudRight);
    container.appendChild(header);

    // Blackboard frame (outer wooden frame)
    const frame = document.createElement('div');
    frame.style.cssText = `
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 760px;
      background: linear-gradient(135deg, #5c3d1e 0%, #3d2508 40%, #5c3d1e 100%);
      border-radius: 8px;
      padding: 14px;
      box-shadow:
        0 8px 32px rgba(0,0,0,0.8),
        inset 0 1px 0 rgba(255,200,100,0.15),
        0 0 0 2px rgba(122,74,30,0.8);
    `;

    // Blackboard inner surface
    const board = document.createElement('div');
    board.id = 'school-board';
    board.style.cssText = `
      background: linear-gradient(135deg, #1a2e10 0%, #0f1f08 50%, #1a2e10 100%);
      border-radius: 4px;
      border: 3px solid #0d1a07;
      padding: 28px 32px 24px;
      box-sizing: border-box;
      min-height: 340px;
      position: relative;
      overflow: hidden;
      box-shadow: inset 0 2px 20px rgba(0,0,0,0.6);
    `;

    // Chalk texture lines (subtle)
    for (let i = 0; i < 8; i++) {
      const line = document.createElement('div');
      line.style.cssText = `
        position: absolute;
        left: 0; right: 0;
        top: ${10 + i * 12}%;
        height: 1px;
        background: rgba(255,255,255,0.03);
      `;
      board.appendChild(line);
    }

    // Timer bar at top of blackboard
    const timerBar = document.createElement('div');
    timerBar.style.cssText = `
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 5px;
      background: rgba(0,0,0,0.4);
      border-radius: 2px 2px 0 0;
      overflow: hidden;
    `;
    const timerFill = document.createElement('div');
    timerFill.id = 'school-timer-fill';
    timerFill.style.cssText = `
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #7bed9f, #ffa502, #ff4757);
      background-size: 300% 100%;
      background-position: 0% 50%;
      transition: background-position 0.5s;
    `;
    timerBar.appendChild(timerFill);
    board.appendChild(timerBar);

    // Timer text
    const timerText = document.createElement('div');
    timerText.id = 'school-timer';
    timerText.style.cssText = `
      position: absolute;
      top: 10px;
      right: 16px;
      color: rgba(255,255,255,0.5);
      font-size: 13px;
    `;
    timerText.textContent = '30s';
    board.appendChild(timerText);

    // Question text
    const questionEl = document.createElement('div');
    questionEl.id = 'school-question';
    questionEl.style.cssText = `
      position: relative;
      z-index: 1;
      color: #e8f5d8;
      font-size: 22px;
      line-height: 1.5;
      margin-bottom: 28px;
      margin-top: 8px;
      text-shadow: 0 1px 4px rgba(0,0,0,0.5);
      min-height: 66px;
    `;

    // Answer options
    const optionsEl = document.createElement('div');
    optionsEl.id = 'school-options';
    optionsEl.style.cssText = `
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    // Emoji burst layer
    const burstEl = document.createElement('div');
    burstEl.id = 'school-burst';
    burstEl.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 10;
      overflow: hidden;
    `;
    board.appendChild(burstEl);

    // Aww text
    const awwEl = document.createElement('div');
    awwEl.id = 'school-aww';
    awwEl.style.cssText = `
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      color: #ff9f43;
      font-size: 20px;
      font-weight: bold;
      opacity: 0;
      pointer-events: none;
      z-index: 11;
      white-space: nowrap;
      text-shadow: 0 2px 6px rgba(0,0,0,0.8);
    `;
    board.appendChild(awwEl);

    board.appendChild(questionEl);
    board.appendChild(optionsEl);
    frame.appendChild(board);
    container.appendChild(frame);

    // Chalk tray decoration
    const tray = document.createElement('div');
    tray.style.cssText = `
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 760px;
      height: 18px;
      background: linear-gradient(180deg, #3d2508 0%, #2a1a05 100%);
      border-radius: 0 0 4px 4px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `;
    // Chalk sticks
    ['#e8e8e8', '#ffcdd2', '#c8e6c9'].forEach(color => {
      const chalk = document.createElement('div');
      chalk.style.cssText = `
        width: 28px; height: 7px;
        background: ${color};
        border-radius: 2px;
        opacity: 0.8;
      `;
      tray.appendChild(chalk);
    });
    container.appendChild(tray);

    // Key hint bar
    const hints = document.createElement('div');
    hints.style.cssText = `
      position: relative;
      z-index: 2;
      margin-top: 16px;
      display: flex;
      gap: 20px;
      color: rgba(200,230,160,0.6);
      font-size: 14px;
    `;
    hints.innerHTML = `
      <span>Press <strong style="color:#c8e6a0">[A]</strong> for option A</span>
      <span>Press <strong style="color:#c8e6a0">[B]</strong> for option B</span>
      <span>Press <strong style="color:#c8e6a0">[C]</strong> for option C</span>
    `;
    container.appendChild(hints);

    // Results overlay
    const results = document.createElement('div');
    results.id = 'school-results';
    results.style.cssText = `
      display: none;
      position: absolute;
      inset: 0;
      background: rgba(10,20,5,0.94);
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 30;
      color: #e8f5d8;
      text-align: center;
      gap: 12px;
    `;
    container.appendChild(results);

    // Inject styles
    if (!document.getElementById('school-keyframes')) {
      const style = document.createElement('style');
      style.id = 'school-keyframes';
      style.textContent = `
        @keyframes chalkIn {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes chalkScratch {
          0%,100% { transform: scaleX(1); }
          25%     { transform: scaleX(1.01) skewX(0.5deg); }
          75%     { transform: scaleX(0.99) skewX(-0.5deg); }
        }
        @keyframes burstFly {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-80px) scale(0.5); }
        }
        @keyframes optionPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(123,237,159,0.4); }
          50%     { box-shadow: 0 0 0 6px rgba(123,237,159,0.0); }
        }
        @keyframes awwBounce {
          0%   { opacity: 0; transform: translateX(-50%) translateY(10px); }
          20%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          80%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(10px); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(container);
    this._container = container;
  }

  /** Fisher-Yates shuffle (CAD-435) */
  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  start() {
    this._active = true;
    this._score = 0;
    this._questionIndex = 0;
    // CAD-435: shuffle and pick 10 questions each round
    this._questions = this._shuffle(this._questionBank).slice(0, 10);
    // CAD-397: difficulty reduces time
    const diff = getDifficulty('school');
    this._timeLeft = Math.max(15, Math.floor(30 * diff.timeMult));
    this._answered = false;
    this._gameOver = false;
    this._correctCount = 0;
    this._lastTime = null;

    const results = document.getElementById('school-results');
    results.style.display = 'none';

    this._container.style.display = 'flex';

    this._keyHandler = (e) => this._onKey(e.key);
    window.addEventListener('keydown', this._keyHandler);

    this._loadQuestion();
    this._lastTime = performance.now();
    this._loop(this._lastTime);
  }

  _loop(now) {
    if (!this._active) return;
    const delta = Math.min((now - (this._lastTime || now)) / 1000, 0.1);
    this._lastTime = now;
    this.update(delta);
    this._frameId = requestAnimationFrame((t) => this._loop(t));
  }

  update(delta) {
    if (!this._active || this._gameOver || this._answered) return;

    this._timeLeft -= delta;
    const pct = Math.max(0, this._timeLeft / 30);

    // Update timer fill
    const fill = document.getElementById('school-timer-fill');
    if (fill) {
      fill.style.width = `${pct * 100}%`;
      // Shift gradient colour: green -> orange -> red
      const pos = (1 - pct) * 100;
      fill.style.backgroundPosition = `${pos}% 50%`;
    }

    const timerText = document.getElementById('school-timer');
    if (timerText) {
      timerText.textContent = `${Math.ceil(this._timeLeft)}s`;
      timerText.style.color = pct > 0.5 ? 'rgba(180,230,140,0.7)' : pct > 0.25 ? 'rgba(255,160,80,0.8)' : 'rgba(255,80,80,0.9)';
    }

    if (this._timeLeft <= 0) {
      // Time's up — auto-wrong
      this._processAnswer(-1);
    }
  }

  _loadQuestion() {
    if (this._questionIndex >= this._questions.length) {
      this._endGame();
      return;
    }

    this._timeLeft = 30;
    this._answered = false;

    const q = this._questions[this._questionIndex];

    const questionEl = document.getElementById('school-question');
    if (questionEl) {
      questionEl.style.animation = 'none';
      void questionEl.offsetWidth;
      questionEl.textContent = q.q;
      questionEl.style.animation = 'chalkIn 0.4s ease-out';
    }

    const optionsEl = document.getElementById('school-options');
    if (optionsEl) {
      optionsEl.innerHTML = '';
      const labels = ['A', 'B', 'C'];
      q.opts.forEach((opt, i) => {
        const btn = document.createElement('div');
        btn.id = `school-opt-${i}`;
        btn.style.cssText = `
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255,255,255,0.05);
          border: 2px solid rgba(200,230,160,0.25);
          border-radius: 6px;
          padding: 10px 16px;
          color: #d4edba;
          font-size: 18px;
          cursor: default;
          animation: chalkIn 0.4s ease-out ${0.1 + i * 0.1}s both;
          transition: border-color 0.2s, background 0.2s;
        `;
        btn.innerHTML = `
          <span style="
            font-size: 16px;
            font-weight: bold;
            color: #c8e6a0;
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
            padding: 2px 10px;
            min-width: 28px;
            text-align: center;
          ">${labels[i]}</span>
          <span>${opt}</span>
        `;
        optionsEl.appendChild(btn);
      });
    }

    // Reset burst
    const burst = document.getElementById('school-burst');
    if (burst) burst.innerHTML = '';

    // Update progress
    const progressEl = document.getElementById('school-progress');
    if (progressEl) progressEl.textContent = `Q ${this._questionIndex + 1} / ${this._questions.length}`;

    // Update timer fill to full
    const fill = document.getElementById('school-timer-fill');
    if (fill) { fill.style.width = '100%'; fill.style.backgroundPosition = '0% 50%'; }
  }

  _onKey(key) {
    if (this._gameOver) {
      if (key === 'Escape') this.stop();
      return;
    }
    if (this._answered) return;

    const keyMap = { a: 0, A: 0, b: 1, B: 1, c: 2, C: 2 };
    if (!(key in keyMap)) return;

    this._processAnswer(keyMap[key]);
  }

  _processAnswer(chosen) {
    if (this._answered) return;
    this._answered = true;

    const q = this._questions[this._questionIndex];
    const correct = chosen === q.answer;

    // Highlight options
    const labels = ['A', 'B', 'C'];
    q.opts.forEach((_, i) => {
      const btn = document.getElementById(`school-opt-${i}`);
      if (!btn) return;
      if (i === q.answer) {
        btn.style.background = 'rgba(123,237,159,0.2)';
        btn.style.borderColor = '#7bed9f';
        btn.style.color = '#7bed9f';
      } else if (i === chosen && !correct) {
        btn.style.background = 'rgba(255,71,87,0.2)';
        btn.style.borderColor = '#ff4757';
        btn.style.color = '#ff6b6b';
      }
    });

    if (correct) {
      this._score += 10;
      this._correctCount++;
      this._triggerCheer();
    } else {
      this._triggerAww();
    }

    // Update score display
    const scoreEl = document.getElementById('school-score');
    if (scoreEl) scoreEl.textContent = `Score: ${this._score}`;

    this._questionIndex++;

    // Advance after delay
    setTimeout(() => {
      if (!this._active || this._gameOver) return;
      this._loadQuestion();
      if (this._questionIndex >= this._questions.length) {
        this._endGame();
      }
    }, 1600);
  }

  _triggerCheer() {
    const burst = document.getElementById('school-burst');
    if (!burst) return;
    const emojis = ['⭐', '🎉', '✨', '🌟', '👏', '🎊', '💫'];
    for (let i = 0; i < 12; i++) {
      const span = document.createElement('span');
      span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const left = 10 + Math.random() * 80;
      const delay = Math.random() * 0.4;
      span.style.cssText = `
        position: absolute;
        bottom: 20%;
        left: ${left}%;
        font-size: ${18 + Math.random() * 16}px;
        animation: burstFly ${0.8 + Math.random() * 0.6}s ease-out ${delay}s forwards;
      `;
      burst.appendChild(span);
    }

    // Scratch animation on question
    const questionEl = document.getElementById('school-question');
    if (questionEl) {
      questionEl.style.animation = 'chalkScratch 0.3s ease 2';
    }
  }

  _triggerAww() {
    const aww = document.getElementById('school-aww');
    if (!aww) return;
    aww.style.animation = 'none';
    void aww.offsetWidth;
    aww.textContent = 'Awwww... 😕';
    aww.style.animation = 'awwBounce 1.4s ease-in-out forwards';
  }

  _endGame() {
    if (this._gameOver) return;
    this._gameOver = true;
    cancelAnimationFrame(this._frameId);
    // CAD-398: record completion for rewards
    if (this._score > 0) recordCompletion('school', this._score);

    const results = document.getElementById('school-results');
    results.style.display = 'flex';

    let grade, rating;
    const pct = this._correctCount / this._questions.length;
    if (pct >= 0.9) { grade = 'A+'; rating = '🏆 Outstanding Teacher!'; }
    else if (pct >= 0.7) { grade = 'B'; rating = '⭐ Well Done!'; }
    else if (pct >= 0.5) { grade = 'C'; rating = '📖 Keep Studying!'; }
    else { grade = 'D'; rating = '😬 Revision Needed...'; }

    const headline = this._correctCount >= 8 ? 'Well done!' : this._correctCount >= 5 ? 'Not bad!' : 'Keep studying!';

    results.innerHTML = `
      <div style="font-size:52px; margin-bottom:6px;">📚</div>
      <div style="font-size:28px; font-weight:bold; color:#c8e6a0; margin-bottom:4px;">${headline}</div>
      <div style="
        font-size:64px;
        font-weight:bold;
        color:#f5c842;
        font-family: Georgia, serif;
        text-shadow: 0 0 20px rgba(245,200,66,0.5);
        margin: 8px 0;
      ">${grade}</div>
      <div style="font-size:20px; color:#b2d89a;">${this._correctCount} / ${this._questions.length} correct</div>
      <div style="font-size:24px; font-weight:bold; color:#fff; margin:8px 0;">${this._score} pts</div>
      <div style="font-size:18px; color:#7bed9f; margin-bottom:20px;">${rating}</div>
      <div style="font-size:14px; color:rgba(200,230,160,0.6);">Press <strong style="color:#c8e6a0;">[Esc]</strong> to leave the classroom</div>
    `;
  }

  stop() {
    this._active = false;
    this._gameOver = true;
    if (this._frameId) cancelAnimationFrame(this._frameId);
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
    if (this._container) this._container.style.display = 'none';
  }

  get active() {
    return this._active;
  }
}
