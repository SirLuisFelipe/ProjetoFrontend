(function (global) {
    function safeDecodeToken(token) {
        if (token && typeof token === 'string') {
            const parts = token.split('.');
            if (parts.length < 2) return null;
            const base64 = parts[1]
                .replaceAll('-', '+')
                .replaceAll('_', '/');
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
            } catch (error) {
                console.warn('Falha ao decodificar token do dashboard:', error);
                return null;
            }
        }
        return null;
    }

    function decodeTokenRole(token) {
        const payload = safeDecodeToken(token);
        if (!payload) return null;
        const raw = payload.role || payload.authority || (Array.isArray(payload.authorities) && payload.authorities[0]);
        return raw ? String(raw).toUpperCase() : null;
    }

    function decodeUserId(token) {
        const payload = safeDecodeToken(token);
        if (!payload) return null;
        return payload.id || payload.userId || payload.sub || null;
    }

    function formatIsoToHuman(iso) {
        if (!iso) return '';
        const parts = iso.split('-');
        if (parts.length !== 3) return iso;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    function summarizeTurnoRange(payload, fallbackIso, dependencies = {}) {
        const order = ['MATUTINO', 'VESPERTINO', 'NOTURNO'];
        const totals = order.reduce((acc, key) => {
            acc[key] = 0;
            return acc;
        }, {});
        let start = null;
        let end = null;

        if (Array.isArray(payload)) {
            payload.forEach(item => {
                if (!start) start = item?.date || null;
                end = item?.date || end;
                if (Array.isArray(item?.turnos)) {
                    item.turnos.forEach(t => {
                        const key = String(t?.turno || '').toUpperCase();
                        if (key in totals) {
                            totals[key] += Number(t?.total) || 0;
                        }
                    });
                }
            });
        } else if (payload && Array.isArray(payload?.turnos)) {
            start = payload?.date || fallbackIso;
            end = start;
            payload.turnos.forEach(t => {
                const key = String(t?.turno || '').toUpperCase();
                if (key in totals) {
                    totals[key] = Number(t?.total) || 0;
                }
            });
        }

        if (!start) start = fallbackIso;
        if (!end) end = start;
        const formatFn = dependencies.formatIsoToHuman || formatIsoToHuman;
        const label = start === end
            ? `Reservas em ${formatFn(start)}`
            : `Reservas entre ${formatFn(start)} e ${formatFn(end)}`;

        return { totals, label };
    }

    function getTodayIso(provider = () => new Date()) {
        const now = provider();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    const helpers = {
        decodeTokenRole,
        decodeUserId,
        formatIsoToHuman,
        summarizeTurnoRange,
        getTodayIso
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = helpers;
    } else {
        globalThis.DashboardHelpers = helpers;
    }
})(typeof window !== 'undefined' ? window : globalThis);
