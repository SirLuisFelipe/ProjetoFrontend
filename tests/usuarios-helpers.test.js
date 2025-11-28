const {
    decodeRoleFromToken,
    normalizeUser,
    buildRoleOptions,
    formatRoleLabel
} = require('../Assets/js/usuarios-helpers');

function makeToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `${header}.${body}.signature`;
}

describe('Usuarios helpers', () => {
    test('decodeRoleFromToken extrai role e normaliza para maiúsculas', () => {
        const token = makeToken({ role: 'admin' });
        expect(decodeRoleFromToken(token)).toBe('ADMIN');

        const tokenAuthority = makeToken({ authority: 'user' });
        expect(decodeRoleFromToken(tokenAuthority)).toBe('USER');

        const tokenArray = makeToken({ authorities: ['ADMIN'] });
        expect(decodeRoleFromToken(tokenArray)).toBe('ADMIN');
    });

    test('normalizeUser aplica fallback e inclui dados crus', () => {
        const normalized = normalizeUser({
            id: 5,
            name: 'Carlos',
            cpf: '123',
            email: 'carlos@example.com',
            role: 'ADMIN'
        });
        expect(normalized).toEqual({
            id: 5,
            name: 'Carlos',
            cpf: '123',
            email: 'carlos@example.com',
            role: 'ADMIN',
            roleLabel: 'Administrador',
            raw: {
                name: 'Carlos',
                cpf: '123',
                email: 'carlos@example.com',
                role: 'ADMIN'
            }
        });

        const fallback = normalizeUser({});
        expect(fallback.name).toBe('-');
        expect(fallback.raw.role).toBe('USER');
    });

    test('buildRoleOptions gera lista consistente de opções', () => {
        const adminOptions = buildRoleOptions('ADMIN');
        expect(adminOptions).toEqual([
            { value: 'ADMIN', label: 'Administrador', selected: true },
            { value: 'USER', label: 'Usuário', selected: false }
        ]);

        const userOptions = buildRoleOptions('USER');
        expect(userOptions[0].value).toBe('USER');
        expect(userOptions[1].value).toBe('ADMIN');
    });

    test('formatRoleLabel traduz roles corretamente', () => {
        expect(formatRoleLabel('ADMIN')).toBe('Administrador');
        expect(formatRoleLabel('USER')).toBe('Usuário');
        expect(formatRoleLabel('custom')).toBe('Usuário');
    });
});
