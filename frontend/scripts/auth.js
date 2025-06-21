
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message, 'error');
            return;
        }

        // Salva il token
        localStorage.setItem('token', data.token);

        // Reindirizza alla home
        switchPage('home');
        showToast('Login effettuato con successo', 'success');
    } catch (error) {
        console.error('Errore durante il login:', error);
        showToast('Errore durante il login', 'error');
    }
}

async function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('fname').value;
    const lastname = document.getElementById('lname').value;
    const role = document.querySelector('input[name="role"]:checked').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                name,
                lastname,
                role
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message, 'error');
            return;
        }

        // Salva il token
        localStorage.setItem('token', data.token);

        // Reindirizza alla home
        switchPage('home');
        showToast('Registrazione completata con successo', 'success');
    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        showToast('Errore durante la registrazione', 'error');
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast', `toast-${type}`);
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}