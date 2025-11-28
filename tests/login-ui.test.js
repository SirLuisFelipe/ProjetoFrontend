const { JSDOM } = require('jsdom');

describe('login.js DOM behaviors', () => {
    let dom;
    let moduleExports;

    const baseHtml = `
        <!doctype html>
        <html>
        <body>
            <form id="loginForm"></form>
            <div id="registerModal" style="display:none;">
                <select id="registerRoleSelect"></select>
                <form id="registerForm"></form>
            </div>
            <input type="password" id="password" />
            <img id="icon-eye" src="../Assets/img/login/OcultarSenha.png" />
        </body>
        </html>
    `;

    beforeEach(() => {
        dom = new JSDOM(baseHtml, { url: 'http://localhost/' });
        global.window = dom.window;
        global.document = dom.window.document;
        global.getComputedStyle = dom.window.getComputedStyle;
        global.localStorage = dom.window.localStorage;
        global.alert = jest.fn();
        jest.resetModules();
        moduleExports = require('../Assets/js/login.js');
    });

    afterEach(() => {
        dom.window.close();
        global.window = undefined;
        global.document = undefined;
        global.getComputedStyle = undefined;
        global.localStorage = undefined;
        global.alert = undefined;
    });

    test('togglePasswordVisibility alterna tipo e icone', () => {
        const password = document.getElementById('password');
        const icon = document.getElementById('icon-eye');
        expect(password.type).toBe('password');
        expect(icon.getAttribute('src')).toContain('OcultarSenha');

        moduleExports.togglePasswordVisibility();
        expect(password.type).toBe('text');
        expect(icon.getAttribute('src')).toContain('VerSenha');

        moduleExports.togglePasswordVisibility();
        expect(password.type).toBe('password');
        expect(icon.getAttribute('src')).toContain('OcultarSenha');
    });

    test('openRegisterModal exibe modal e popula select', () => {
        const modal = document.getElementById('registerModal');
        const select = document.getElementById('registerRoleSelect');
        expect(modal.style.display).toBe('none');
        moduleExports.openRegisterModal();
        expect(modal.style.display).toBe('flex');
        expect(select.options.length).toBe(2);
        expect(select.options[0].value).toBe('USER');
    });

    test('closeRegisterModal oculta o modal', () => {
        const modal = document.getElementById('registerModal');
        modal.style.display = 'flex';
        moduleExports.closeRegisterModal();
        expect(modal.style.display).toBe('none');
    });

    test('isRegisterModalOpen reflete estado atual', () => {
        const modal = document.getElementById('registerModal');
        expect(moduleExports.isRegisterModalOpen()).toBe(false);
        modal.style.display = 'flex';
        expect(moduleExports.isRegisterModalOpen()).toBe(true);
    });
});
