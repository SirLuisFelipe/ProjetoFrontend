document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("authToken");

    // Função para obter a role do usuário a partir do token
    function getUserRoleFromToken() {
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const raw = payload.role || payload.authority || (payload.authorities && payload.authorities[0]) || payload.scope || (payload.scopes && payload.scopes[0]);
            if (!raw) return null;
            const val = String(raw).toUpperCase();
            if (val.includes('ADMIN')) return 'ADMIN';
            if (val.includes('USER')) return 'USER';
            return val; 
        } catch (error) {
            console.error("Erro ao decodificar o token:", error);
            return null;
        }
    }

    function getUserIdFromToken() {
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id || payload.userId || payload.sub || null;
        } catch (error) {
            return null;
        }
    }

    function isAdminRole(role) {
        if (!role) return false;
        const r = String(role).toUpperCase();
        return r.includes('ADMIN');
    }

    function getUserIdFromToken() {
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id || payload.userId || payload.sub || null;
        } catch (error) {
            return null;
        }
    }

    const userRole = getUserRoleFromToken();

    // Exibe/oculta botão de gerenciar usuários (se existir no DOM)
    const manageUsersButton = document.getElementById("manageUsersButton");
    if (manageUsersButton) {
        if (userRole === "ADMIN") {
            manageUsersButton.style.display = "block";
        } else {
            manageUsersButton.style.display = "none";
        }
    }

    // Carrega reservas na tabela central conforme a role
    (async function loadSchedules() {
        const tableBody = document.getElementById('schedulesBody');
        if (!tableBody) return; // tabela pode não existir

        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const baseUrl = 'http://localhost:8080/reservation';
        // Regra para definir se deve visualizar todas reservas ou só as próprias
        async function resolveCurrentUserId() {
            const idFromToken = getUserIdFromToken();
            if (idFromToken) return idFromToken;
            try {
                const t = localStorage.getItem('authToken');
                const payload = t ? JSON.parse(atob(t.split('.')[1])) : null;
                const email = payload?.email || payload?.sub || null;
                if (!email) return null;
                const resp = await fetch(`${baseUrl}/user/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!resp.ok) return null;
                const users = await resp.json();
                const match = Array.isArray(users) ? users.find(u => (u.email || '').toLowerCase() === String(email).toLowerCase()) : null;
                return match?.id || null;
            } catch (_) {
                return null;
            }
        }

        const uid = await resolveCurrentUserId();
        const endpoints = (isAdminRole(userRole))
            ? [
                `${baseUrl}/scheduling/`
              ]
            : [
                uid ? `${baseUrl}/scheduling/user/${uid}` : null
              ].filter(Boolean);

        let lastError = null;
        for (const url of endpoints) {
            try {
                const resp = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!resp.ok) {
                    const text = await resp.text();
                    lastError = `GET ${url} → ${resp.status} ${resp.statusText} ${text || ''}`;
                    console.warn(lastError);
                    continue;
                }
                const data = await resp.json();
                const items = extractItems(data);
                renderSchedules(items);
                return;
            } catch (e) {
                lastError = `GET ${url} → erro de rede: ${e.message}`;
                console.warn(lastError);
                continue;
            }
        }

        console.error('Falha ao carregar reservas.', lastError || 'sem detalhes');
        tableBody.innerHTML = '<tr><td colspan="5">Erro ao carregar reservas</td></tr>';
    })();

    function extractItems(data) {
        if (Array.isArray(data)) return data;
        if (!data || typeof data !== 'object') return [];
        if (Array.isArray(data.content)) return data.content;
        return [];
    }

    function renderSchedules(items) {
        const tableBody = document.getElementById('schedulesBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (!Array.isArray(items) || items.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 5;
            td.textContent = 'Nenhuma reserva encontrada';
            tr.appendChild(td);
            tableBody.appendChild(tr);
            return;
        }

        items.forEach(item => {
            // Buscando valores do banco para popular a tabela
            const tr = document.createElement('tr');

            const tdName = document.createElement('td');
            const n = item?.user?.name;
            tdName.textContent = (n === undefined || n === null) ? '-' : n;
            tr.appendChild(tdName);

            const tdEmail = document.createElement('td');
            const e = item?.user?.email; 
            tdEmail.textContent = (e === undefined || e === null) ? '-' : e;
            tr.appendChild(tdEmail);

            const tdTrack = document.createElement('td');
            const t = item?.track?.name;
            tdTrack.textContent = (t === undefined || t === null) ? '-' : t;
            tr.appendChild(tdTrack);

            const tdTurno = document.createElement('td');
            const tu = item?.turno;
            tdTurno.textContent = (tu === undefined || tu === null) ? '-' : tu;
            tr.appendChild(tdTurno);

            const tdDate = document.createElement('td');
            const d = item?.scheduledDate
            tdDate.textContent = (d === undefined || d === null) ? '-' : formatDate(d);
            tr.appendChild(tdDate);

            tableBody.appendChild(tr);
        });
    }

    function formatDate(value) {
        try {
            const date = new Date(value);
            if (!isNaN(date)) {
                const dd = String(date.getDate()).padStart(2, '0');
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const yyyy = date.getFullYear();
                return `${dd}/${mm}/${yyyy}`;
            }
            return value;
        } catch (_) {
            return value;
        }
    }

    // Código do calendário e outras funções
    let today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    let months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    let monthAndYear = document.getElementById("monthAndYear");

    showCalendar(currentMonth, currentYear);

    function next() {
        currentYear = (currentMonth === 11) ? currentYear + 1 : currentYear;
        currentMonth = (currentMonth + 1) % 12;
        showCalendar(currentMonth, currentYear);
    }

    function previous() {
        currentYear = (currentMonth === 0) ? currentYear - 1 : currentYear;
        currentMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
        showCalendar(currentMonth, currentYear);
    }

    function showCalendar(month, year) {
        let firstDay = (new Date(year, month)).getDay();
        let daysInMonth = 32 - new Date(year, month, 32).getDate();
        let tbl = document.getElementById("calendarBody");

        tbl.innerHTML = "";
        monthAndYear.innerHTML = months[month] + " " + year;

        let date = 1;
        for (let i = 0; i < 6; i++) {
            let row = document.createElement("tr");

            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDay) {
                    let cell = document.createElement("td");
                    let cellText = document.createTextNode("");
                    cell.appendChild(cellText);
                    row.appendChild(cell);
                } else if (date > daysInMonth) {
                    break;
                } else {
                    let cell = document.createElement("td");
                    let cellButton = document.createElement("button");
                    cellButton.textContent = date;
                    cellButton.className = "calendar-btn";
                    cellButton.addEventListener("click", (event) => openModal(event.target, month, year));
                    if (date === today.getDate() && year === today.getFullYear() && month === today.getMonth()) {
                        cellButton.classList.add("bg-info");
                    }
                    cell.appendChild(cellButton);
                    row.appendChild(cell);
                    date++;
                }
            }
            tbl.appendChild(row);
        }
    }

    // Abre o modal de confirmação ao clicar em um dia

    async function openModal(button, month, year) {
        const modal = document.getElementById("confirmationModal");
        const dateInfo = document.getElementById("dateInfo");
        const selectedDate = document.getElementById("selectedDate");

        const date = button.textContent;
        selectedDate.value = `${date}-${month + 1}-${year}`;
        dateInfo.textContent = `Dia selecionado: ${date} de ${months[month]} de ${year}`;

        // Preenche e bloqueia os campos de Nome e Email, e carrega opções de selects
        await prefillAndLockUserFields();
        await loadSelectOptions();

        // Ajusta estado do botão Confirmar conforme seleção
        setupConfirmButtonState();

        modal.style.display = "flex"; // usa flex para centralizar
    }

    // expõe globalmente para o onclick do HTML funcionar
    window.closeModal = function() {
        const modal = document.getElementById("confirmationModal");
        modal.style.display = "none";
    }

    // fecha ao clicar fora do conteúdo do modal
    const confirmationModal = document.getElementById("confirmationModal");
    if (confirmationModal) {
        confirmationModal.addEventListener('click', function(event) {
            if (event.target === confirmationModal) {
                window.closeModal();
            }
        });
    }

    // fecha ao pressionar ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const modal = document.getElementById("confirmationModal");
            if (modal && modal.style.display !== 'none') {
                window.closeModal();
            }
        }
    });

    // Confirma ao pressionar Enter
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmReservation();
        }
    });

    // Confirma agendamento: envia para o backend e recarrega a lista
    window.confirmReservation = async function() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = 'login.html';
            return;
        }

        const selectedDate = document.getElementById('selectedDate')?.value || '';
        const turno = document.getElementById('turno')?.value || '';
        const trackId = document.getElementById('track')?.value || '';
        const paymentId = document.getElementById('payment')?.value || '';

        if (!selectedDate || !turno || !trackId || !paymentId) {
            alert('Preencha data, turno, pista e pagamento.');
            return;
        }

        // Converte dd-m-aaaa para aaaa-mm-dd
        function toIsoDate(dmy) {
            const parts = String(dmy).split('-');
            if (parts.length !== 3) return dmy;
            const [dd, mm, yyyy] = parts;
            const m2 = String(mm).padStart(2, '0');
            const d2 = String(dd).padStart(2, '0');
            return `${yyyy}-${m2}-${d2}`;
        }

        const dateIso = toIsoDate(selectedDate);
        const uid = getUserIdFromToken();
        const baseUrl = 'http://localhost:8080/reservation';

        // Mapeia rótulos para valores do backend
        const turnoMap = { 'MANHA': 'MATUTINO', 'TARDE': 'VESPERTINO', 'NOITE': 'NOTURNO' };
        const turnoBackend = turnoMap[turno] || turno;

        const payload = {
            userId: Number(uid),
            trackId: Number(trackId),
            paymentId: Number(paymentId),
            scheduledDate: dateIso,
            turno: turnoBackend
        };

        try {
            const resp = await fetch(`${baseUrl}/scheduling/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`POST /scheduling/ → ${resp.status} ${resp.statusText} ${text || ''}`);
            }
            alert('Reserva realizada com sucesso!');
            window.closeModal();
            try { location.reload(); } catch (_) {}
        } catch (err) {
            console.error(err);
            alert('Não foi possível realizar a reserva. Verifique os dados ou tente novamente.');
        }
    }

    // Carrega opções de Pista e Pagamento (Track e Payment)
    async function loadSelectOptions() {
        const token = localStorage.getItem('authToken');
        const trackSel = document.getElementById('track');
        const paySel = document.getElementById('payment');
        if (!trackSel || !paySel) return;

        // Limpa mantendo placeholder
        trackSel.innerHTML = '<option value="" disabled selected>Selecione</option>';
        paySel.innerHTML = '<option value="" disabled selected>Selecione</option>';

        const baseUrl = 'http://localhost:8080/reservation';
        const trackUrls = [
            `${baseUrl}/track/`
        ];
        const paymentUrls = [
            `${baseUrl}/payment/`
        ];

        async function fetchList(urls) {
            for (const url of urls) {
                try {
                    const resp = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (!resp.ok) continue;
                    const data = await resp.json();
                    const list = Array.isArray(data) ? data : [];
                    if (list.length) return list;
                } catch (_) {
                }
            }
            return [];
        }

        const [tracks, payments] = await Promise.all([
            fetchList(trackUrls),
            fetchList(paymentUrls)
        ]);

        // Preenche selects com name e id
        tracks.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item?.id;
            opt.textContent = item?.name || item?.nome || `#${item?.id}`;
            trackSel.appendChild(opt);
        });
        payments.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item?.id;
            opt.textContent = item?.name || item?.nome || `#${item?.id}`;
            paySel.appendChild(opt);
        });
    }

    function setupConfirmButtonState() {
        const btn = document.getElementById('confirmButton');
        const trackSel = document.getElementById('track');
        const paySel = document.getElementById('payment');
        const turnoSel = document.getElementById('turno');
        if (!btn || !trackSel || !paySel || !turnoSel) return;

        function update() {
            const ready = !!trackSel.value && !!paySel.value && !!turnoSel.value;
            btn.disabled = !ready;
        }
        update();
        trackSel.addEventListener('change', update);
        paySel.addEventListener('change', update);
        turnoSel.addEventListener('change', update);
    }

    // Preenche Nome e Email do usuário logado e torna os campos somente para leitura
    async function prefillAndLockUserFields() {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        if (!nameInput || !emailInput) return;

        // Sempre manter como somente leitura (nao deve ser alterao pois são dados do proprio usuário)
        nameInput.readOnly = true;
        emailInput.readOnly = true;

        // Tenta pegar do token
        let tokenPayload = null;
        try {
            tokenPayload = token ? JSON.parse(atob(token.split('.')[1])) : null;
        } catch (_) {}

        const tokenName = tokenPayload?.name || tokenPayload?.nome || tokenPayload?.userName || tokenPayload?.username;
        const tokenEmail = tokenPayload?.email || tokenPayload?.sub || tokenPayload?.userEmail;

        if (tokenName) nameInput.value = tokenName;
        if (tokenEmail) emailInput.value = tokenEmail;

        // Se faltou algum dado, tenta buscar pela API
        if ((!nameInput.value || !emailInput.value) && token) {
            const uid = getUserIdFromToken();
            const baseUrl = 'http://localhost:8080/reservation';
            const candidates = [
                uid ? `${baseUrl}/user/id/${uid}` : null,
                `${baseUrl}/user/me`
            ].filter(Boolean);

            for (const url of candidates) {
                try {
                    const resp = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (!resp.ok) continue;
                    const data = await resp.json();
                    const apiName = data?.name 
                    const apiEmail = data?.email 
                    if (!nameInput.value && apiName) nameInput.value = apiName;
                    if (!emailInput.value && apiEmail) emailInput.value = apiEmail;
                    break;
                } catch (_) {}
            }
        }
    }
});

// Logoff e retorno à tela de login (usado no botão "Sair")
window.logout = function() {
    try {
        localStorage.removeItem("authToken");
    } catch (e) {
        // ignora erros de storage
    }
    window.location.href = "login.html";
};
