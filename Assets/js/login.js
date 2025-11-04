// Função de login (executa apenas se o formulário existir na página)
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        // Execução do login com o backend
        try {
            const response = await fetch("http://localhost:8080/reservation/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Falha no login. Verifique suas credenciais.");
            }

            const data = await response.json();
            localStorage.setItem("authToken", data.token); 

            // Redireciona para a página principal após login bem-sucedido
            window.location.href = "reserva.html";
        } catch (error) {
            alert("Erro: " + error.message);
        }
    });
}

// Função para ver/ocultar senha
function togglePasswordVisibility() {
    const passwordField = document.getElementById("password");
    const icon = document.getElementById("icon-eye");

    if (passwordField.type === "password") {
        passwordField.type = "text";
        icon.src = '../Assets/img/login/VerSenha.png';
    } else {
        passwordField.type = "password";
        icon.src = '../Assets/img/login/OcultarSenha.png'; 
    }
}

// Abrir o modal de registro
function openRegisterModal() {
    const modal = document.getElementById("registerModal");
    modal.style.display = "block";

    const roleSelect = document.querySelector('#registerModal #role');
    if (roleSelect) {
        roleSelect.innerHTML = '';

        const userOpt = document.createElement('option');
        userOpt.value = 'USER';
        userOpt.textContent = 'Usuário';
        roleSelect.appendChild(userOpt);

        const adminOpt = document.createElement('option');
        adminOpt.value = 'ADMIN';
        adminOpt.textContent = 'Administrador';
        roleSelect.appendChild(adminOpt);
    }
}

// Fechar o modal de registro
function closeRegisterModal() {
    document.getElementById("registerModal").style.display = "none";
}

document.addEventListener("DOMContentLoaded", function() {
    const modal = document.getElementById("registerModal");
    if (modal) {
        closeRegisterModal();
    }
});

// Fecha o modal se clicar fora do conteúdo do modal
window.onclick = function(event) {
    const modal = document.getElementById("registerModal");
    if (event.target === modal) {
        closeRegisterModal();
    }
};

// Registrando um novo usuário (executa apenas se o formulário existir na página)
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const name = document.getElementById("registerName").value;
        const cpf = document.getElementById("registerCpf").value;
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;

        // Role será passado como "User" por padrão quando o usuário for criado pela tela de login
        const roleSelect = document.querySelector('#registerModal #role');
        const selectedRole = roleSelect && roleSelect.value ? roleSelect.value : "User";

        const userData = {
            name: name,
            email: email,
            cpf: cpf,
            password: password,
            role: selectedRole
        };

        try {
            const response = await fetch("http://localhost:8080/reservation/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro ao registrar usuário.");
            }

            alert("Usuário registrado com sucesso!");
            closeRegisterModal(); // Fecha o modal após o sucesso
        } catch (error) {
            alert("Erro: " + error.message);
        }
    });
}
