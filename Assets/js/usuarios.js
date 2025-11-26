document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    function decodeRole() {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const raw = payload.role || payload.authority || (payload.authorities && payload.authorities[0]);
            return raw ? String(raw).toUpperCase() : null;
        } catch (_) {
            return null;
        }
    }

    const role = decodeRole();
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
                ? `http://localhost:8080/reservation/user/search?name=${name}`
                : `http://localhost:8080/reservation/user/`;
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
            userContainer.innerHTML = "";

            users.forEach(user => {
                const userDiv = document.createElement("div");
                userDiv.classList.add("user");
                userDiv.innerHTML = `
                    <span>${user.name}</span>
                    <div class="user-actions">
                        <button class="edit-btn" onclick="openEditModal(${user.id}, '${user.name}', '${user.cpf}', '${user.email}', '${user.role}')">
                            <img src="../Assets/img/Icones genericos/Editar22.png" alt="Editar" class="icon"/>
                        </button>
                        <button class="lock-btn" onclick="deleteUser(${user.id})">
                            <img src="../Assets/img/Icones genericos/Excluir22.png" alt="Excluir" class="icon"/>
                        </button>
                    </div>
                `;
                userContainer.appendChild(userDiv);
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
        document.getElementById("editModal").style.display = "flex";
        document.getElementById("userId").value = id;
        document.getElementById("name").value = name;
        document.getElementById("cpf").value = cpf;
        document.getElementById("email").value = email;

        const roleSelect = document.getElementById("role");
        roleSelect.innerHTML = "";

        const currentOption = document.createElement("option");
        currentOption.value = role;
        currentOption.textContent = role === "ADMIN" ? "Administrador" : "Usuário";
        currentOption.selected = true;
        roleSelect.appendChild(currentOption);

        const alternateOption = document.createElement("option");
        alternateOption.value = role === "ADMIN" ? "USER" : "ADMIN";
        alternateOption.textContent = role === "ADMIN" ? "Usuário" : "Administrador";
        roleSelect.appendChild(alternateOption);
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
            role: document.getElementById("role").value
        };

        try {
            const response = await fetch(`http://localhost:8080/reservation/user/`, {
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
            const response = await fetch(`http://localhost:8080/reservation/user/id/${id}`, {
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
