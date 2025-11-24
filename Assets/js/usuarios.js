document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");

    async function fetchUsers(name = "") {
        const token = localStorage.getItem("authToken");

        if (!token) {
            alert("Token não encontrado. Faça o login novamente.");
            window.location.href = "login.html";
            return;
        }

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

    // "Enter" para executar o pesquisar
    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            const name = searchInput.value.trim();
            fetchUsers(name);
        }
    });

    window.openEditModal = function(id, name, cpf, email, role) {
        // usa display:flex para centralizar via .c-modal
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

    // Logoff e retorno para tela de login
    window.logout = function() {
        try {
            localStorage.removeItem("authToken");
        } catch (e) {
        }
        window.location.href = "login.html";
    };

    async function updateUser(event) {
        event.preventDefault();

        const token = localStorage.getItem("authToken");
        const userId = document.getElementById("userId").value;
        const userData = {
            id: userId,
            name: document.getElementById("name").value,
            cpf: document.getElementById("cpf").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            role: document.getElementById("role").value
        };

    // Funcao para editar usuarios
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

    // função para excluir usuário
    async function deleteUser(id) {
        const token = localStorage.getItem("authToken");

        if (!token) {
            alert("Token não encontrado. Faça o login novamente.");
            window.location.href = "login.html";
            return;
        }

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

    // Carregar todos os usuário ao iniciar
    fetchUsers();
});

