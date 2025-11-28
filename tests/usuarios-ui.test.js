const { JSDOM } = require('jsdom');
const {
    renderUserList,
    populateRoleSelect
} = require('../Assets/js/usuarios-helpers');

describe('Usuarios UI helpers', () => {
    let container;
    let dom;

    beforeEach(() => {
        dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
        global.window = dom.window;
        global.document = dom.window.document;
        container = document.createElement('div');
        container.className = 'user-list';
        document.body.appendChild(container);
    });

    afterEach(() => {
        dom.window.close();
        global.window = undefined;
        global.document = undefined;
    });

    test('renderUserList cria elementos e aciona callbacks', () => {
        const onEdit = jest.fn();
        const onDelete = jest.fn();
        const users = [
            { id: 1, name: 'Ana', email: 'ana@example.com', cpf: '123', role: 'ADMIN' },
            { id: 2, name: 'Bruno', email: 'bruno@example.com', cpf: '456', role: 'USER' }
        ];

        renderUserList(container, users, { onEdit, onDelete });

        const rows = container.querySelectorAll('.user');
        expect(rows.length).toBe(2);
        expect(rows[0].querySelector('span').textContent).toBe('Ana');

        rows[0].querySelector('.edit-btn').click();
        rows[1].querySelector('.lock-btn').click();

        expect(onEdit).toHaveBeenCalledTimes(1);
        expect(onEdit.mock.calls[0][0]).toEqual(expect.objectContaining({ id: 1 }));
        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(onDelete.mock.calls[0][0]).toEqual(expect.objectContaining({ id: 2 }));
    });

    test('populateRoleSelect repovoa o select com opções corretas', () => {
        const selectEl = document.createElement('select');
        document.body.appendChild(selectEl);

        populateRoleSelect(selectEl, 'ADMIN');
        expect(selectEl.options.length).toBe(2);
        expect(selectEl.options[0].value).toBe('ADMIN');
        expect(selectEl.options[0].selected).toBe(true);

        populateRoleSelect(selectEl, 'USER');
        expect(selectEl.options[0].value).toBe('USER');
        expect(selectEl.options[0].selected).toBe(true);
    });
});
