const usuariosRootScope = typeof window !== 'undefined' ? window : globalThis;
const USUARIOS_DEFAULT_API_BASE_URL = (() => {
    const hostname = String(usuariosRootScope?.location?.hostname || '').toLowerCase();
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    return isLocalhost
        ? 'http://localhost:8080/reservation'
        : 'http://99.79.51.142:8080/reservation';
})();
const UsuariosHelperBundle = usuariosRootScope.UsuariosHelpers || null;
if (!UsuariosHelperBundle) {
    console.error('UsuariosHelpers nao encontrado. Verifique se Assets/js/usuarios-helpers.js foi carregado antes de usuarios.js.');
}

const {
    decodeRoleFromToken = () => null,
    normalizeUser = (user) => ({
        id: user?.id ?? null,
        name: user?.name || '-',
        cpf: user?.cpf || '-',
        email: user?.email || '-',
        role: user?.role || 'USER',
        roleLabel: user?.role || 'USER',
        raw: {
            name: user?.name || '',
            cpf: user?.cpf || '',
            email: user?.email || '',
            role: user?.role || 'USER'
        }
    }),
    buildRoleOptions = () => [],
    formatRoleLabel = (role) => role || '',
    populateRoleSelect = () => {},
    renderUserList = () => []
} = UsuariosHelperBundle || {};

document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = usuariosRootScope.API_BASE_URL || USUARIOS_DEFAULT_API_BASE_URL;
    const token = localStorage.getItem("authToken");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const role = decodeRoleFromToken(token);
    if (!role || !role.includes('ADMIN')) {
        alert('Acesso permitido apenas para administradores.');
        window.location.href = 'reserva.html';
        return;
    }

    const navReservations = document.getElementById('navReservations');
    const navDashboard = document.getElementById('navDashboard');
    if (navReservations) navReservations.addEventListener('click', () => window.location.href = 'reserva.html');
    if (navDashboard) navDashboard.addEventListener('click', () => window.location.href = 'dashboard.html');

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");

    async function fetchUsers(name = "") {
        try {
            const url = name
                ? `${API_BASE_URL}/user/search?name=${encodeURIComponent(name)}`
                : `${API_BASE_URL}/user/`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Erro ao buscar usuário.");
            }

            const users = await response.json();
            const userContainer = document.querySelector(".user-list");
            if (!userContainer) return;

            renderUserList(userContainer, users, {
                onEdit: (normalized) => {
                    openEditModal(
                        normalized.id,
                        normalized.raw.name,
                        normalized.raw.cpf,
                        normalized.raw.email,
                        normalized.raw.role
                    );
                },
                onDelete: (normalized) => deleteUser(normalized.id)
            });
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            alert("Erro ao buscar usuário.");
        }
    }

    searchButton.addEventListener("click", () => {
        const name = searchInput.value.trim();
        fetchUsers(name);
    });

    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            const name = searchInput.value.trim();
            fetchUsers(name);
        }
    });

    window.openEditModal = function(id, name, cpf, email, role) {
        const modal = document.getElementById("editModal");
        if (!modal) return;
        modal.style.display = "flex";
        const userIdInput = document.getElementById("userId");
        const nameInput = document.getElementById("name");
        const cpfInput = document.getElementById("cpf");
        const emailInput = document.getElementById("email");

        if (userIdInput) userIdInput.value = id ?? '';
        if (nameInput) nameInput.value = name || '';
        if (cpfInput) cpfInput.value = cpf || '';
        if (emailInput) emailInput.value = email || '';

        const roleSelect = document.getElementById("editRoleSelect");
        populateRoleSelect(roleSelect, role);
    };

    window.closeEditModal = function() {
        document.getElementById("editModal").style.display = "none";
    };

    window.logout = function() {
        try {
            localStorage.removeItem("authToken");
        } catch (e) {}
        window.location.href = "login.html";
    };

    async function updateUser(event) {
        event.preventDefault();

        const userId = document.getElementById("userId").value;
        const userData = {
            id: userId,
            name: document.getElementById("name").value,
            cpf: document.getElementById("cpf").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            role: document.getElementById("editRoleSelect")?.value || 'USER'
        };

        try {
            const response = await fetch(`${API_BASE_URL}/user/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                alert("Usuário atualizado com sucesso!");
                closeEditModal();
                fetchUsers(searchInput.value.trim());
            } else {
                const error = await response.text();
                console.error("Erro ao atualizar usuário:", error);
                alert("Erro ao atualizar usuário.");
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            alert("Erro ao atualizar usuário.");
        }
    }

    document.getElementById("editForm").addEventListener("submit", updateUser);

    async function deleteUser(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/user/id/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert("Usuário excluído com sucesso!");
                fetchUsers(searchInput.value.trim());
            } else {
                const error = await response.text();
                console.error("Erro ao excluir usuário:", error);
                alert("Erro ao excluir usuário.");
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            alert("Erro ao excluir usuário.");
        }
    }

    window.deleteUser = deleteUser;

    fetchUsers();
});
