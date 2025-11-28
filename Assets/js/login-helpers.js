(function(global) {
    const ICONS = {
        hidden: '../Assets/img/login/OcultarSenha.png',
        visible: '../Assets/img/login/VerSenha.png'
    };

    function resolvePasswordToggle(currentType) {
        const isHidden = currentType === 'password';
        return {
            nextType: isHidden ? 'text' : 'password',
            iconSrc: isHidden ? ICONS.visible : ICONS.hidden
        };
    }

    function buildRegisterRoleOptions() {
        return [
            { value: 'USER', label: 'Usuario' },
            { value: 'ADMIN', label: 'Administrador' }
        ];
    }

    function isModalOpen(modal) {
        if (!modal) return false;
        const style = globalThis.getComputedStyle?.(modal) || null;
        if (style) return style.display !== 'none';
        return Boolean(modal.style?.display && modal.style.display !== 'none');
    }

    const helpers = {
        resolvePasswordToggle,
        buildRegisterRoleOptions,
        isModalOpen
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = helpers;
    } else {
        globalThis.LoginHelpers = helpers;
    }
})(typeof window !== 'undefined' ? window : globalThis);
