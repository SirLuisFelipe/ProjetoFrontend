const {
    decodeTokenRole,
    decodeUserId,
    formatIsoToHuman,
    summarizeTurnoRange,
    getTodayIso
} = require('../Assets/js/dashboard-helpers');

function makeToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `${header}.${body}.signature`;
}

describe('Dashboard helpers', () => {
    test('decodeTokenRole e decodeUserId interpretam o token corretamente', () => {
        const token = makeToken({ role: 'admin', id: 42 });
        expect(decodeTokenRole(token)).toBe('ADMIN');
        expect(decodeUserId(token)).toBe(42);

        const fallback = makeToken({ authorities: ['USER'], userId: '15' });
        expect(decodeTokenRole(fallback)).toBe('USER');
        expect(decodeUserId(fallback)).toBe('15');
    });

    test('formatIsoToHuman converte iso simples para dd/mm/aaaa', () => {
        expect(formatIsoToHuman('2024-11-26')).toBe('26/11/2024');
        expect(formatIsoToHuman('invalid')).toBe('invalid');
        expect(formatIsoToHuman('')).toBe('');
    });

    test('summarizeTurnoRange agrega os valores e monta label', () => {
        const payload = [
            { date: '2024-11-25', turnos: [{ turno: 'MATUTINO', total: 2 }] },
            { date: '2024-11-26', turnos: [{ turno: 'NOTURNO', total: 1 }] }
        ];
        const summary = summarizeTurnoRange(payload, '2024-11-26', { formatIsoToHuman });
        expect(summary.totals).toEqual({ MATUTINO: 2, VESPERTINO: 0, NOTURNO: 1 });
        expect(summary.label).toBe('Reservas entre 25/11/2024 e 26/11/2024');

        const single = summarizeTurnoRange({ date: '2024-11-26', turnos: [{ turno: 'VESPERTINO', total: 3 }] }, '2024-11-26', { formatIsoToHuman });
        expect(single.totals).toEqual({ MATUTINO: 0, VESPERTINO: 3, NOTURNO: 0 });
        expect(single.label).toBe('Reservas em 26/11/2024');
    });

    test('getTodayIso aceita provedor customizado', () => {
        const iso = getTodayIso(() => new Date('2024-11-26T10:00:00'));
        expect(iso).toBe('2024-11-26');
    });
});
