const {
    resolvePasswordToggle,
    buildRegisterRoleOptions,
    isModalOpen
} = require('../Assets/js/login-helpers');

describe('Login helpers', () => {
    test('resolvePasswordToggle alterna entre password e text', () => {
        const visible = resolvePasswordToggle('password');
        expect(visible).toEqual({
            nextType: 'text',
            iconSrc: '../Assets/img/login/VerSenha.png'
        });

        const hidden = resolvePasswordToggle('text');
        expect(hidden).toEqual({
            nextType: 'password',
            iconSrc: '../Assets/img/login/OcultarSenha.png'
        });
    });

    test('buildRegisterRoleOptions retorna opções fixas', () => {
        expect(buildRegisterRoleOptions()).toEqual([
            { value: 'USER', label: 'Usuario' },
            { value: 'ADMIN', label: 'Administrador' }
        ]);
    });

    test('isModalOpen detecta o estado do modal em diferentes cenários', () => {
        const modal = { style: { display: 'flex' } };
        expect(isModalOpen(modal)).toBe(true);

        modal.style.display = 'none';
        expect(isModalOpen(modal)).toBe(false);

        expect(isModalOpen(null)).toBe(false);
    });
});
