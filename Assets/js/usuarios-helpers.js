(function(global) {
    function decodePayload(token) {
        if (!token || typeof token !== 'string') return null;
        const segments = token.split('.');
        if (segments.length < 2) return null;
        const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
        try {
            let json = null;
            if (typeof atob === 'function') {
                json = atob(base64);
            } else if (typeof Buffer !== 'undefined') {
                json = Buffer.from(base64, 'base64').toString('utf8');
            } else {
                return null;
            }
            return JSON.parse(json);
        } catch (_) {
            return null;
        }
    }

    function decodeRoleFromToken(token) {
        const payload = decodePayload(token);
        if (!payload) return null;
        const raw = payload.role || payload.authority || (Array.isArray(payload.authorities) && payload.authorities[0]);
        return raw ? String(raw).toUpperCase() : null;
    }

    function formatRoleLabel(role) {
        const normalized = String(role || '').toUpperCase();
        return normalized.includes('ADMIN') ? 'Administrador' : 'Usuário';
    }

    function normalizeUser(user) {
        const safeText = (value, fallback = '-') => {
            if (value === undefined || value === null || value === '') return fallback;
            return String(value);
        };
        return {
            id: user?.id ?? null,
            name: safeText(user?.name),
            cpf: safeText(user?.cpf),
            email: safeText(user?.email),
            role: safeText(user?.role, 'USER'),
            roleLabel: formatRoleLabel(user?.role),
            raw: {
                name: user?.name || '',
                cpf: user?.cpf || '',
                email: user?.email || '',
                role: user?.role || 'USER'
            }
        };
    }

    function buildRoleOptions(currentRole) {
        const normalized = String(currentRole || '').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';
        const alternate = normalized === 'ADMIN' ? 'USER' : 'ADMIN';
        return [
            { value: normalized, label: formatRoleLabel(normalized), selected: true },
            { value: alternate, label: formatRoleLabel(alternate), selected: false }
        ];
    }

    const helpers = {
        decodeRoleFromToken,
        normalizeUser,
        buildRoleOptions,
        formatRoleLabel
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = helpers;
    } else {
        global.UsuariosHelpers = helpers;
    }
})(typeof window !== 'undefined' ? window : globalThis);
