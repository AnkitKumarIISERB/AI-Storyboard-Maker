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

// =====================
// Frame management
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
        frame.appendChild(img);
    }

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => frame.remove());
    frame.appendChild(removeBtn);

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

            // Save to history
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
addFrame(); // initial empty frame
