async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = '/profile';
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        showAlert('Erro ao fazer login. Tente novamente.', 'error');
    }
}

async function logout() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        } else {
            showAlert('Erro ao fazer logout.', 'error');
        }
    } catch (error) {
        showAlert('Erro ao fazer logout. Tente novamente.', 'error');
    }
}

function confirmDelete() {
    if (confirm('Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita.')) {
        deleteAccount();
    }
}

async function deleteAccount() {
    try {
        const token = localStorage.getItem('token');
        const userId = getUserIdFromToken(token); // Função para extrair o ID do usuário do token

        const response = await fetch(`/user/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            localStorage.removeItem('token');
            showAlert('Conta deletada com sucesso!', 'success');
            window.location.href = '/login';
        } else {
            const data = await response.json();
            showAlert(data.message, 'error');
        }
    } catch (error) {
        showAlert('Erro ao deletar conta. Tente novamente.', 'error');
    }
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

function getUserIdFromToken(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub; // ou payload.user_id, dependendo de como você estruturou o token
    } catch (error) {
        console.error('Erro ao decodificar token:', error);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname;

    if (!token && !['/', '/login', '/register'].includes(currentPath)) {
        window.location.href = '/login';
    }
});
