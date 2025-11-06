// Função de login 
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        // Executa login com o backend
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

            // Redireciona para a pagina principal apos login bem-sucedido
            window.location.href = "reserva.html";
        } catch (error) {
            alert("Erro: " + error.message);
        }
    });
}

// função para ver/ocultar senha
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
    modal.style.display = "flex";

    const roleSelect = document.querySelector('#registerModal #role');
    if (roleSelect) {
        roleSelect.innerHTML = '';

        const userOpt = document.createElement('option');
        userOpt.value = 'USER';
        userOpt.textContent = 'Usuario';
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

// Fecha o modal se clicar fora do conteudo do modal
window.onclick = function(event) {
    const modal = document.getElementById("registerModal");
    if (event.target === modal) {
        closeRegisterModal();
    }
};

// Atalhos de teclado quando o modal esta aberto
function isRegisterModalOpen() {
    const modal = document.getElementById('registerModal');
    if (!modal) return false;
    const style = window.getComputedStyle ? getComputedStyle(modal) : null;
    return style ? style.display !== 'none' : (modal.style.display && modal.style.display !== 'none');
}

document.addEventListener('keydown', function(e) {
    if (!isRegisterModalOpen()) return;
    if (e.key === 'Escape') {
        e.preventDefault();
        closeRegisterModal();
    } else if (e.key === 'Enter') {
        e.preventDefault();
        const form = document.getElementById('registerForm');
        if (form) {
            if (typeof form.requestSubmit === 'function') {
                form.requestSubmit();
            } else {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        }
    }
});

// Registrando um novo usuario 
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const name = document.getElementById("registerName").value;
        const cpf = document.getElementById("registerCpf").value;
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;

        // Role sera passado como "User" por padrao quando o usuario for criado pela tela de login
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
            closeRegisterModal(); // Fecha o modal apos o sucesso
        } catch (error) {
            alert("Erro: " + error.message);
        }
    });
}

