// =====================
// Select elements
// =====================
const canvas = document.querySelector('.canvas');
const promptInput = document.getElementById('prompt');
const generateBtn = document.getElementById('generate-btn');
const aiResult = document.getElementById('ai-result');
const styleSelect = document.getElementById('style');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const exportBtn = document.getElementById('export-btn');
const historyList = document.getElementById('history');

let frameCount = 0;
let history = [];
const GRID_SIZE = 20;

// =====================
// Multi-select
// =====================
let selectedFrames = new Set();
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let offsets = new Map(); // offset for each selected frame

// =====================
// Frame management
// =====================
function addFrame(imgSrc = null) {
    frameCount++;
    const frame = document.createElement('div');
    frame.className = 'frame';
    frame.id = `frame-${frameCount}`;
    frame.style.position = 'absolute';
    frame.style.left = '0px';
    frame.style.top = '0px';

    if (imgSrc) {
        const img = document.createElement('img');
        img.src = imgSrc;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        frame.appendChild(img);
    }

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        frame.remove();
        selectedFrames.delete(frame);
    });
    frame.appendChild(removeBtn);

    // =====================
    // Select & Drag
    // =====================
    frame.addEventListener('click', (e) => {
        if (selectedFrames.has(frame)) {
            selectedFrames.delete(frame);
            frame.classList.remove('selected');
        } else {
            selectedFrames.add(frame);
            frame.classList.add('selected');
        }
    });

    frame.addEventListener('mousedown', (e) => {
        if (!selectedFrames.has(frame)) return;
        isDragging = true;
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;
        offsets.clear();
        selectedFrames.forEach(f => {
            offsets.set(f, {
                x: parseInt(f.style.left),
                y: parseInt(f.style.top)
            });
        });
    });

    canvas.appendChild(frame);
}

// =====================
// AI Image Generation
// =====================
async function generateAIImage() {
    const prompt = promptInput.value.trim();
    const style = styleSelect.value;

    if (!prompt) {
        alert('Please enter a prompt!');
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
            aiResult.innerHTML = `<img src="${imgSrc}" alt="AI Image">`;
            addFrame(imgSrc);

            history.push({ prompt, style, imgSrc });
            updateHistory();
        }
    } catch (err) {
        console.error(err);
        alert('Failed to generate image.');
    }

    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Image';
}

// =====================
// Update history panel
// =====================
function updateHistory() {
    historyList.innerHTML = '';
    history.forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${item.prompt} [${item.style}]`;
        li.addEventListener('click', () => addFrame(item.imgSrc));
        historyList.appendChild(li);
    });
}

// =====================
// Dragging for multi-select
// =====================
document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    selectedFrames.forEach(f => {
        const offset = offsets.get(f);
        let left = offset.x + dx;
        let top = offset.y + dy;

        // Snap to grid
        left = Math.round(left / GRID_SIZE) * GRID_SIZE;
        top = Math.round(top / GRID_SIZE) * GRID_SIZE;

        f.style.left = left + 'px';
        f.style.top = top + 'px';
    });
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

// =====================
// Dark mode toggle
// =====================
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

// =====================
// Export storyboard as images
// =====================
exportBtn.addEventListener('click', () => {
    canvas.querySelectorAll('.frame img').forEach((img, idx) => {
        const link = document.createElement('a');
        link.href = img.src;
        link.download = `frame_${idx + 1}.png`;
        link.click();
    });
});

// =====================
// Event listeners
// =====================
generateBtn.addEventListener('click', generateAIImage);

// =====================
// Initialize
// =====================
addFrame();
