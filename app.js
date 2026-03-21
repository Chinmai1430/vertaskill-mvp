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

    if (localStorage.getItem("vertaSkillRegistered") === "true") {
        form.style.display = "none";
        const savedPosition = localStorage.getItem("vertaSkillPosition") || "142";
        waitlistNumberDisplay.innerText = savedPosition;
        registeredState.style.display = "flex";
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
                
                waitlistNumberDisplay.innerText = data.position || localStorage.getItem("vertaSkillPosition");
                
                form.reset(); 
                form.style.display = 'none';
                registeredState.style.display = 'flex';

                if(response.status === 201) {
                    showToast('success', 'Registration Successful!');
                    setTimeout(() => { surveyModal.classList.add('show'); }, 500); 
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