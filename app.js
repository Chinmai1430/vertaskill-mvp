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
    if (!form) return; // Safety check
    
    const btn = form.querySelector("button");
    const registeredState = document.getElementById("registered-state");
    const emailInput = document.getElementById("emailAddress");
    const waitlistNumberDisplay = document.getElementById("waitlist-number");
    const surveyModal = document.getElementById("survey-modal");

    if (localStorage.getItem("vertaSkillRegistered") === "true") {
        form.style.display = "none";
        const savedPosition = localStorage.getItem("vertaSkillPosition") || "142";
        if (waitlistNumberDisplay) waitlistNumberDisplay.innerText = savedPosition;
        if (registeredState) registeredState.style.display = "flex";
    }

    form.addEventListener("submit", async function(event) {
        event.preventDefault(); 
        const emailValue = emailInput.value.trim();
        if (!emailValue) return;

        const originalText = btn.innerText;
        btn.innerText = "Requesting...";
        btn.disabled = true;

        try {
            const response = await fetch('https://vertaskill-mvp.onrender.com/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailValue })
            });
            
            let data = await response.json().catch(() => ({}));

            // 201 = New Success, 400 or 409 = Already Registered
            if (response.status === 201 || response.status === 400 || response.status === 409) {
                localStorage.setItem("vertaSkillRegistered", "true");
                if(data.position) localStorage.setItem("vertaSkillPosition", data.position);
                
                if (waitlistNumberDisplay) waitlistNumberDisplay.innerText = data.position || localStorage.getItem("vertaSkillPosition");
                
                form.reset(); 
                form.style.display = 'none';
                if (registeredState) registeredState.style.display = 'flex';

                if(response.status === 201) {
                    showToast('success', 'Registration Successful!');
                    if (surveyModal) setTimeout(() => { surveyModal.classList.add('show'); }, 500); 
                } else {
                    showToast('error', 'You are already on the waitlist!');
                }

            } else if (response.status === 429) {
                showToast('error', 'Too many attempts. Try again later.');
                btn.innerText = originalText;
                btn.disabled = false;
            } else {
                showToast('error', 'Oops! Server error. Try again.');
                btn.innerText = originalText;
                btn.disabled = false;
            }
        } catch (error) {
            showToast('error', 'Connection failed. Check your internet.');
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
});

// --- BACKGROUND CANVAS ANIMATION ---
document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById('circuit-bg');
    if (!canvas) return; // Safety check
    
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
        
        // FIX 1: Dynamically scale lines! Desktop gets ~90 lines, mobile gets ~20.
        let numLines = Math.floor(window.innerWidth / 50); 
        
        for(let i = 0; i < numLines; i++) {
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
        
        // FIX 2: Increased opacity from 0.15 to 0.35 so it's visible on desktop!
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)'; 
        ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        
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
    initCanvas(); 
    animate();
});