document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    if (!body || !body.classList.contains('has-top-bar')) {
        return;
    }

    const welcomePlaceholder = document.querySelector('.js-welcome-user');
    if (!welcomePlaceholder) {
        return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
        welcomePlaceholder.textContent = 'Bem-vindo';
        return;
    }

    let decodedName = null;
    try {
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
            const payload = JSON.parse(atob(payloadBase64));
            decodedName = payload?.name || payload?.nome || payload?.userName || payload?.username || null;
        }
    } catch (error) {
        console.warn('Nao foi possivel decodificar o token para preencher o nome do usuario.', error);
    }

    const message = decodedName ? `Bem-vindo ${decodedName}` : 'Bem-vindo';
    welcomePlaceholder.textContent = message;
});
