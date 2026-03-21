// --- MODAL LOGIC ---
function closeModal() {
    document.getElementById('survey-modal').classList.remove('show');
}

// --- 10/10 TOAST NOTIFICATION LOGIC ---
function showToast(type, message) {
    let toast;
    if (type === 'success') {
        toast = document.getElementById("toast-success");
    } else if (type === 'error') {
        toast = document.getElementById("toast-error");
        document.getElementById("toast-error-msg").innerText = message;
    }
    
    if (toast) {
        toast.classList.add("show");
        // Hide after 4 seconds
        setTimeout(() => { toast.classList.remove("show"); }, 4000);
    }
}

// --- WAITLIST FORM LOGIC ---
document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("waitlist-form");
    const btn = form.querySelector("button");
    const registeredState = document.getElementById("registered-state");
    const emailInput = document.getElementById("emailAddress");
    const waitlistNumberDisplay = document.getElementById("waitlist-number");
    const surveyModal = document.getElementById("survey-modal");

    // Check local storage on page load
    if (localStorage.getItem("vertaSkillRegistered") === "true") {
        form.style.display = "none";
        const savedPosition = localStorage.getItem("vertaSkillPosition") || "142";
        waitlistNumberDisplay.innerText = savedPosition;
        registeredState.style.display = "flex";
    }

    // Handle form submission
    form.addEventListener("submit", async function(event) {
        event.preventDefault(); 

        const emailValue = emailInput.value.trim();
        if (!emailValue) return;

        const originalText = btn.innerText;
        btn.innerText = "Requesting...";
        btn.disabled = true;

        try {
            // UPDATED: Now points to your live Render backend
            const response = await fetch('https://vertaskill-mvp.onrender.com/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailValue })
            });
            
            // Parse the JSON data from the server
            let data;
            try {
                data = await response.json();
            } catch (err) {
                data = {};
            }

            if (response.status === 201) {
                localStorage.setItem("vertaSkillRegistered", "true");
                localStorage.setItem("vertaSkillPosition", data.position);
                
                waitlistNumberDisplay.innerText = data.position;
                
                form.reset(); 
                form.style.display = 'none';
                registeredState.style.display = 'flex';

                showToast('success', 'Registration Successful!');

                // SHOW THE POP-UP MODAL
                setTimeout(() => {
                    surveyModal.classList.add('show');
                }, 500); 

            } else if (response.status === 409) {
                localStorage.setItem("vertaSkillRegistered", "true");
                localStorage.setItem("vertaSkillPosition", data.position);
                waitlistNumberDisplay.innerText = data.position;

                form.reset();
                form.style.display = 'none';
                registeredState.style.display = 'flex';
                
                surveyModal.classList.add('show');

            } else if (response.status === 429) {
                showToast('error', 'Too many attempts. Please try again in an hour.');
                btn.innerText = originalText;
                btn.disabled = false;

            } else {
                showToast('error', 'Oops! There was a problem submitting your email.');
                btn.innerText = originalText;
                btn.disabled = false;
            }
        } catch (error) {
            // UPDATED: Error message corrected for live environment
            showToast('error', 'Connection failed. Please check your internet.');
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
});

// --- BACKGROUND CANVAS ANIMATION ---
const canvas = document.getElementById('circuit-bg');
const ctx = canvas.getContext('2d');
let width, height;
let paths = [];
let dataPackets = [];

function initCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    generateCircuitBoard();
}

function generateCircuitBoard() {
    paths = []; dataPackets = [];
    for(let i = 0; i < 40; i++) {
        let x = Math.random() * width, y = Math.random() * height;
        let points = [{x, y}];
        let angleIndex = Math.floor(Math.random() * 8);
        for(let s = 0; s < 5; s++) {
            let angle = angleIndex * (Math.PI / 4);
            let length = Math.random() * 100 + 50; 
            x += Math.cos(angle) * length;
            y += Math.sin(angle) * length;
            points.push({x, y});
            angleIndex = (angleIndex + (Math.random() > 0.5 ? 1 : -1) + 8) % 8; 
        }
        paths.push(points);
        if(Math.random() > 0.3) dataPackets.push(new DataPacket(points));
    }
}

class DataPacket {
    constructor(pathPoints) { this.path = pathPoints; this.reset(); }
    reset() { this.targetIndex = 1; this.x = this.path[0].x; this.y = this.path[0].y; this.speed = Math.random() * 2 + 1; }
    update() {
        if (this.targetIndex >= this.path.length) { this.reset(); return; }
        let p1 = this.path[this.targetIndex - 1], p2 = this.path[this.targetIndex];
        let dx = p2.x - p1.x, dy = p2.y - p1.y, dist = Math.sqrt(dx*dx + dy*dy);
        if (dist === 0) { this.targetIndex++; return; }
        this.x += (dx / dist) * this.speed; this.y += (dy / dist) * this.speed;
        if (Math.abs(this.x - p2.x) < this.speed && Math.abs(this.y - p2.y) < this.speed) { this.x = p2.x; this.y = p2.y; this.targetIndex++; }
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#60a5fa'; ctx.shadowBlur = 10; ctx.shadowColor = '#60a5fa'; ctx.fill(); ctx.shadowBlur = 0; 
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    paths.forEach(path => {
        if(path.length < 2) return;
        ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
        for(let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(path[path.length - 1].x, path[path.length - 1].y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; ctx.fill(); ctx.stroke();
    });
    dataPackets.forEach(packet => { packet.update(); packet.draw(); });
    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => { clearTimeout(window.resizeTimer); window.resizeTimer = setTimeout(initCanvas, 200); });
initCanvas(); animate();