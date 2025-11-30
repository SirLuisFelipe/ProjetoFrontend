(() => {
    const rootScope = typeof window !== 'undefined' ? window : globalThis;
    const DEFAULT_API_BASE_URL = (() => {
        const hostname = String(rootScope?.location?.hostname || '').toLowerCase();
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        return isLocalhost ? 'http://localhost:8080/reservation' : '/api/backend';
    })();

    function decodePayload(token) {
        try {
            const payloadBase64 = token.split('.')[1];
            if (!payloadBase64) return null;
            return JSON.parse(atob(payloadBase64));
        } catch (error) {
            return null;
        }
    }

    function resolveIdFromPayload(payload) {
        if (!payload) return null;
        return payload.id;
    }

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

        const payload = decodePayload(token);
        const userId = resolveIdFromPayload(payload);
        if (!userId) {
            welcomePlaceholder.textContent = 'Bem-vindo';
            return;
        }

        const apiBase = rootScope.API_BASE_URL || DEFAULT_API_BASE_URL;
        (async () => {
            try {
                const resp = await fetch(`${apiBase}/user/id/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!resp.ok) {
                    welcomePlaceholder.textContent = 'Bem-vindo';
                    return;
                }
                const data = await resp.json();
                const userName = data?.name;
                welcomePlaceholder.textContent = userName ? `Bem-vindo ${userName}` : 'Bem-vindo';
            } catch (error) {
                welcomePlaceholder.textContent = 'Bem-vindo';
            }
        })();
    });
})();
