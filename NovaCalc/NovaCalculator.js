// App State
let memory = [0, 0, 0];
let historyTape = [];
let soundEnabled = true;
let audioCtx = null;

// DOM Elements
const inputEl = document.getElementById('calcInput');
const exprEl = document.getElementById('expressionDisplay');
const previewEl = document.getElementById('evalPreview');
const tapeListEl = document.getElementById('tapeList');
const sciPanel = document.getElementById('sciPanel');

// Web Audio API Sound Synthesizer
function playKeySound(freq = 420) {
    if (!soundEnabled) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);
    } catch (e) {}
}

// Live Math Evaluator
function safeEvaluate(expression) {
    try {
        if (!expression.trim()) return '';
        let sanitized = expression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/\^/g, '**')
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/sqrt\(/g, 'Math.sqrt(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/ln\(/g, 'Math.log(')
            .replace(/abs\(/g, 'Math.abs(');

        let res = Function(`"use strict"; return (${sanitized})`)();
        if (typeof res === 'number' && !isNaN(res)) {
            return Number.isInteger(res) ? res : parseFloat(res.toFixed(8));
        }
    } catch (e) {
        return null;
    }
    return null;
}

// Update Live Preview
inputEl.addEventListener('input', () => {
    const val = inputEl.value;
    const res = safeEvaluate(val);
    previewEl.textContent = (res !== null && res !== '') ? `= ${res}` : '';
});

// Keypad Button Actions
document.querySelectorAll('.btn[data-insert]').forEach(button => {
    button.addEventListener('click', () => {
        playKeySound(500);
        const textToInsert = button.getAttribute('data-insert');
        inputEl.value += textToInsert;
        inputEl.dispatchEvent(new Event('input'));
        inputEl.focus();
    });
});

document.getElementById('clearBtn').addEventListener('click', () => {
    playKeySound(300);
    inputEl.value = '';
    exprEl.textContent = '';
    previewEl.textContent = '= 0';
});

document.getElementById('backspaceBtn').addEventListener('click', () => {
    playKeySound(350);
    inputEl.value = inputEl.value.slice(0, -1);
    inputEl.dispatchEvent(new Event('input'));
});

// Execute Calculation
document.getElementById('equalsBtn').addEventListener('click', executeCalculation);

function executeCalculation() {
    const expr = inputEl.value;
    const res = safeEvaluate(expr);

    if (res !== null && res !== '') {
        playKeySound(700);
        exprEl.textContent = `${expr} =`;
        
        // Add to Tape
        historyTape.unshift({ expr, result: res });
        renderTape();

        inputEl.value = res;
        previewEl.textContent = '';
    } else {
        playKeySound(200);
        previewEl.textContent = 'Syntax Error';
    }
}

// Render History Tape
function renderTape() {
    if (historyTape.length === 0) {
        tapeListEl.innerHTML = '<div class="tape-empty">No calculations yet.</div>';
        return;
    }

    tapeListEl.innerHTML = historyTape.map((item, index) => `
        <div class="tape-item" onclick="insertFromTape(${item.result})">
            <div class="tape-expr">${item.expr}</div>
            <div class="tape-res">= ${item.result}</div>
        </div>
    `).join('');
}

function insertFromTape(val) {
    playKeySound(600);
    inputEl.value += val;
    inputEl.dispatchEvent(new Event('input'));
}

// Memory System
function storeMemory() {
    const val = safeEvaluate(inputEl.value) || 0;
    memory[0] = val;
    document.getElementById('m1Val').textContent = val;
    playKeySound(650);
}

function useMemory(index) {
    playKeySound(550);
    inputEl.value += memory[index];
    inputEl.dispatchEvent(new Event('input'));
}

// Export as Markdown File
document.getElementById('exportMdBtn').addEventListener('click', () => {
    if (historyTape.length === 0) return alert('No history to export!');
    
    let md = `# NovaCalc Session Log\n*Exported on ${new Date().toLocaleString()}*\n\n| Expression | Result |\n| :--- | :--- |\n`;
    historyTape.forEach(item => {
        md += `| \`${item.expr}\` | **${item.result}** |\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NovaCalc_Log_${Date.now()}.md`;
    a.click();
});

// Clear Tape
document.getElementById('clearTapeBtn').addEventListener('click', () => {
    historyTape = [];
    renderTape();
});

// Toggles (Scientific, Sound, Theme)
document.getElementById('sciToggleBtn').addEventListener('click', () => {
    sciPanel.classList.toggle('hidden');
});

document.getElementById('soundToggleBtn').addEventListener('click', (e) => {
    soundEnabled = !soundEnabled;
    e.target.textContent = soundEnabled ? '🔊' : '🔇';
});

document.getElementById('themeToggleBtn').addEventListener('click', () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        executeCalculation();
    } else if (e.key === 'Escape') {
        document.getElementById('clearBtn').click();
    }
});