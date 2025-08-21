// =====================
// DOM Elements
// =====================
const canvas = document.querySelector('.canvas');
const promptInput = document.getElementById('prompt');
const generateBtn = document.getElementById('generate-btn');
const aiResult = document.getElementById('ai-result');
const styleSelect = document.getElementById('style');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const exportBtn = document.getElementById('export-btn');
const clearBtn = document.getElementById('clear-btn');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const historyList = document.getElementById('history');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');

let frameCount = 0;
let historyStack = [];
let redoStack = [];
let historyData = [];

// =====================
// Frame Management
// =====================
function addFrame(imgSrc = null) {
    frameCount++;
    const frame = document.createElement('div');
    frame.className = 'frame';
    frame.id = `frame-${frameCount}`;

    if (imgSrc) {
        const img = document.createElement('img');
        img.src = imgSrc;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.addEventListener('click', () => openModal(imgSrc));
        frame.appendChild(img);
    }

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
        frame.remove();
        saveHistory();
    });
    frame.appendChild(removeBtn);

    canvas.appendChild(frame);
    saveHistory();
}

// =====================
// AI Image Generation
// =====================
async function generateAIImage() {
    const prompt = promptInput.value.trim();
    const style = styleSelect.value;

    if (!prompt) {
        alert('Enter a prompt!');
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: `${prompt}, style: ${style}` })
        });

        const data = await response.json();

        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            const imgSrc = data.image_url;
            addFrame(imgSrc);

            // Add to history panel
            historyData.push({ prompt, style, imgSrc });
            updateHistoryPanel();
        }
    } catch (err) {
        console.error(err);
        alert('Failed to generate image.');
    }

    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Image';
}

// =====================
// History Panel
// =====================
function updateHistoryPanel() {
    historyList.innerHTML = '';
    historyData.forEach((item, idx) => {
        const li = document.createElement('li');
        li.textContent = `${idx + 1}. ${item.prompt} [${item.style}]`;
        li.addEventListener('click', () => addFrame(item.imgSrc));
        historyList.appendChild(li);
    });
}

// =====================
// Modal
// =====================
function openModal(src) {
    modal.style.display = 'block';
    modalImg.src = src;
}

modal.querySelector('.close').onclick = function() {
    modal.style.display = 'none';
}

// =====================
// Dark Mode Toggle
// =====================
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

// =====================
// Canvas Actions
// =====================
exportBtn.addEventListener('click', () => {
    canvas.querySelectorAll('.frame img').forEach((img, idx) => {
        const link = document.createElement('a');
        link.href = img.src;
        link.download = `frame_${idx + 1}.png`;
        link.click();
    });
});

clearBtn.addEventListener('click', () => {
    canvas.innerHTML = '';
    saveHistory();
});

// =====================
// Undo/Redo
// =====================
function saveHistory() {
    const snapshot = canvas.innerHTML;
    historyStack.push(snapshot);
    redoStack = [];
}

undoBtn.addEventListener('click', () => {
    if (historyStack.length > 1) {
        redoStack.push(historyStack.pop());
        canvas.innerHTML = historyStack[historyStack.length - 1];
    }
});

redoBtn.addEventListener('click', () => {
    if (redoStack.length > 0) {
        const redoState = redoStack.pop();
        canvas.innerHTML = redoState;
        historyStack.push(redoState);
    }
});

// =====================
// Initialize
// =====================
addFrame(); // initial frame
saveHistory();

generateBtn.addEventListener('click', generateAIImage);
