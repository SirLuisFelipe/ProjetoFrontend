document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("authToken");

    const API_BASE_URL = 'http://localhost:8080/reservation';

    // Funcao para obter a role do usuario a partir do token
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

    function getUserNameFromToken() {
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.name || payload.nome || payload.userName || payload.username || null;
        } catch (error) {
            return null;
        }
    }

    function isAdminRole(role) {
        if (!role) return false;
        const r = String(role).toUpperCase();
        return r.includes('ADMIN');
    }
    
    const userRole = getUserRoleFromToken();
    const cachedUserName = getUserNameFromToken();

    // Exibe/oculta botões de admin
    const manageUsersButton = document.getElementById("manageUsersButton");
    const viewDashboardsButton = document.getElementById("ViewDashboards");
    if (userRole === "ADMIN") {
        if (manageUsersButton) {
            manageUsersButton.style.display = "block";
            manageUsersButton.addEventListener('click', () => {
                window.location.href = 'usuarios.html';
            });
        }
        if (viewDashboardsButton) {
            viewDashboardsButton.style.display = "block";
            viewDashboardsButton.addEventListener('click', () => {
                window.location.href = 'dashboard.html';
            });
        }
    } else {
        if (manageUsersButton) manageUsersButton.style.display = "none";
        if (viewDashboardsButton) viewDashboardsButton.style.display = "none";
    }

    // Carrega reservas na tabela central conforme a role
    (async function loadSchedules() {
        const tableBody = document.getElementById('schedulesBody');
        if (!tableBody) return; // tabela pode não existir

        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const baseUrl = API_BASE_URL;
        // Regra para definir se deve visualizar todas reservas ou so as proprias
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
        tableBody.innerHTML = '<tr><td colspan=\"7\">Erro ao carregar reservas</td></tr>';
    })();

    function extractItems(data) {
        if (Array.isArray(data)) return data;
        if (!data || typeof data !== 'object') return [];
        if (Array.isArray(data.content)) return data.content;
        return [];
    }

    const schedulesById = new Map();

    function renderSchedules(items) {
        const tableBody = document.getElementById('schedulesBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (!Array.isArray(items) || items.length === 0) {
            handleCheckinQueue([]);
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 7;
            td.textContent = 'Nenhuma reserva encontrada';
            tr.appendChild(td);
            tableBody.appendChild(tr);
            return;
        }

        const sortedItems = items.slice().sort((a, b) => {
            const keyA = getDateKey(a?.scheduledDate);
            const keyB = getDateKey(b?.scheduledDate);
            if (!keyA && !keyB) return 0;
            if (!keyA) return 1;
            if (!keyB) return -1;
            return keyA.localeCompare(keyB);
        });

        sortedItems.forEach(item => {
            if (item && item.id != null) {
                schedulesById.set(item.id, item);
            }
            // Buscando valores do banco para popular a tabela
            const tr = document.createElement('tr');
            if (item && item.id != null) {
                try { tr.dataset.scheduleId = String(item.id); } catch (e) {}
            }

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
            tdTurno.textContent = displayTurno(tu);
            tr.appendChild(tdTurno);

            const tdCheckin = document.createElement('td');
            const ck = getCheckinStatus(item);
            tdCheckin.textContent = formatCheckinStatus(ck);
            tr.appendChild(tdCheckin);

            const tdDate = document.createElement('td');
            const d = item?.scheduledDate
            tdDate.textContent = (d === undefined || d === null) ? '-' : formatDate(d);
            tr.appendChild(tdDate);
            // acoes dentro da tabela
            const tdActions = document.createElement('td');
            tdActions.className = 'actions';
            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.title = 'Editar';
            const editImg = document.createElement('img');
            editImg.src = '../Assets/img/Icones genericos/Editar22.png';
            editImg.alt = 'Editar';
            editImg.className = 'icon';
            editBtn.appendChild(editImg);
            editBtn.addEventListener('click', () => openEditScheduleModal(item?.id));
            const delBtn = document.createElement('button');
            delBtn.className = 'action-btn delete-btn';
            delBtn.title = 'Excluir';
            const delImg = document.createElement('img');
            delImg.src = '../Assets/img/Icones genericos/Excluir22.png';
            delImg.alt = 'Excluir';
            delImg.className = 'icon';
            delBtn.appendChild(delImg);
            delBtn.addEventListener('click', () => deleteSchedule(item?.id));
            tdActions.appendChild(editBtn);
            tdActions.appendChild(delBtn);
            tr.appendChild(tdActions);

            tableBody.appendChild(tr);
        });

        handleCheckinQueue(items);
    }

    function getCheckinStatus(schedule) {
        if (schedule.checkinStatus !== undefined && schedule.checkinStatus !== null) return schedule.checkinStatus;
        return undefined;
    }

    function formatCheckinStatus(value) {
        if (value === undefined || value === null || value === '') return '-';
        const normalized = String(value).toUpperCase();
        if (normalized === 'PENDENTE') return 'Pendente';
        if (normalized === 'NAO_REALIZADO') return 'Não Realizado';
        if (normalized === 'REALIZADO') return 'Realizado';
        if (normalized === 'CANCELADO') return 'Cancelado';
        return value;
    }

    function getDateKey(value) {
        if (!value) return null;
        const pad = num => String(num).padStart(2, '0');
        try {
            if (typeof value === 'string') {
                const cleaned = value.split('T')[0].split(' ')[0];
                const dashParts = cleaned.split('-');
                if (dashParts.length === 3) {
                    if (dashParts[0].length === 4) {
                        const [yyyy, mm, dd] = dashParts;
                        return `${yyyy}-${pad(mm)}-${pad(dd)}`;
                    }
                    if (dashParts[2].length === 4) {
                        const [dd, mm, yyyy] = dashParts;
                        return `${yyyy}-${pad(mm)}-${pad(dd)}`;
                    }
                }
                const slashParts = cleaned.split('/');
                if (slashParts.length === 3) {
                    const [dd, mm, yyyy] = slashParts;
                    return `${yyyy}-${pad(mm)}-${pad(dd)}`;
                }
            }
            if (value instanceof Date) {
                if (isNaN(value)) return null;
                return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
            }
            const asDate = new Date(value);
            if (!isNaN(asDate)) {
                return `${asDate.getFullYear()}-${pad(asDate.getMonth() + 1)}-${pad(asDate.getDate())}`;
            }
        } catch (_) {
            return null;
        }
        return null;
    }

    function getTodayKey() {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return getDateKey(now);
    }

    function handleCheckinQueue(items) {
        if (!checkinPromptModal) {
            requireCheckinResolution = false;
            pendingCheckinQueue = [];
            return;
        }

        pendingCheckinQueue = [];
        const todayKey = getTodayKey();
        const currentUserId = getUserIdFromToken();
        if (Array.isArray(items) && todayKey) {
            items.forEach(item => {
                const scheduleKey = getDateKey(item?.scheduledDate);
                if (scheduleKey !== todayKey) return;
                if (currentUserId != null) {
                    const ownerId = item?.user?.id;
                    if (ownerId != null && Number(ownerId) !== Number(currentUserId)) return;
                }
                const rawStatus = getCheckinStatus(item);
                const normalized = (rawStatus === undefined || rawStatus === null || rawStatus === '')
                    ? 'PENDENTE'
                    : String(rawStatus).toUpperCase();
                if (normalized === 'PENDENTE') {
                    pendingCheckinQueue.push(item);
                }
            });
        }

        requireCheckinResolution = pendingCheckinQueue.length > 0;
        if (requireCheckinResolution) {
            showNextCheckinPrompt();
        } else {
            closeCheckinPromptModal();
        }
        updateOpenButtonState();
    }

    function resolveUserDisplayName(schedule) {
        const fromSchedule = schedule?.user?.name;
        if (fromSchedule) return fromSchedule;
        if (cachedUserName) return cachedUserName;
        return 'Usuario';
    }

    function showNextCheckinPrompt() {
        if (!checkinPromptModal || pendingCheckinQueue.length === 0) return;
        currentCheckinSchedule = pendingCheckinQueue[0];
        if (checkinUserNameSpan) {
            checkinUserNameSpan.textContent = resolveUserDisplayName(currentCheckinSchedule);
        }
        checkinPromptModal.style.display = 'flex';
    }

    function closeCheckinPromptModal() {
        if (checkinPromptModal) {
            checkinPromptModal.style.display = 'none';
        }
        currentCheckinSchedule = null;
        if (!pendingCheckinQueue.length) {
            requireCheckinResolution = false;
        }
        updateOpenButtonState();
    }

    function setCheckinButtonsDisabled(disabled) {
        if (checkinConfirmButton) checkinConfirmButton.disabled = disabled;
        if (checkinCancelButton) checkinCancelButton.disabled = disabled;
    }

    function buildScheduleUpdatePayload(schedule, overrideStatus) {
        if (!schedule || schedule.id == null) return null;
        const payload = {
            id: Number(schedule.id)
        };
        const userId = schedule?.user?.id ?? getUserIdFromToken();
        if (userId != null) payload.userId = Number(userId);
        const trackId = schedule?.track?.id ?? schedule?.trackId;
        if (trackId != null) payload.trackId = Number(trackId);
        const paymentId = schedule?.payment?.id ?? schedule?.paymentId;
        if (paymentId != null) payload.paymentId = Number(paymentId);
        const rawDate = schedule?.scheduledDate;
        const isoDate = getDateKey(rawDate);
        if (isoDate) payload.scheduledDate = isoDate;
        const turno = schedule?.turno;
        if (turno) payload.turno = String(turno).toUpperCase();
        if (overrideStatus) payload.checkinStatus = overrideStatus;
        return payload;
    }

    function isToday(dateValue) {
        const key = getDateKey(dateValue);
        if (!key) return false;
        function getTodayKey() {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            return getDateKey(now);
        }

        const todayKey = getTodayKey();
        return key === todayKey;
    }

    async function submitCheckinStatusUpdate(schedule, newStatus, authToken) {
        if (!schedule || schedule.id == null) {
            throw new Error('Não foi possível localizar a reserva para atualizar o status.');
        }

        const schedulePayload = buildScheduleUpdatePayload(schedule, newStatus);
        if (!schedulePayload) {
            throw new Error('Dados incompletos para atualizar a reserva.');
        }

        const scheduleDateKey = getDateKey(schedule?.scheduledDate);
        if (newStatus === 'REALIZADO' && !isToday(schedule?.scheduledDate)) {
            throw new Error('Check-in só pode ser marcado como REALIZADO no dia da reserva.');
        }
        if (newStatus === 'CANCELADO' && scheduleDateKey) {
            const todayKey = getTodayKey();
            if (scheduleDateKey < todayKey) {
                throw new Error('Não é permitido cancelar reservas passadas.');
            }
        }

        const resp = await fetch(`${API_BASE_URL}/scheduling/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(schedulePayload)
        });
        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`PUT /scheduling/ -> ${resp.status} ${resp.statusText} ${text || ''}`);
        }
    }

    async function processCheckinResponse(newStatus) {
        if (!currentCheckinSchedule || currentCheckinSchedule.id == null) return;
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = 'login.html';
            return;
        }

        setCheckinButtonsDisabled(true);
        try {
            await submitCheckinStatusUpdate(currentCheckinSchedule, newStatus, authToken);
            alert('Status atualizado com sucesso!');
            pendingCheckinQueue.shift();
            currentCheckinSchedule = null;
            if (pendingCheckinQueue.length > 0) {
                showNextCheckinPrompt();
            } else {
                closeCheckinPromptModal();
            }
            try { location.reload(); } catch (_) {}
        } catch (err) {
            console.error(err);
            alert('Não foi possivel atualizar o status do check-in.');
        } finally {
            setCheckinButtonsDisabled(false);
        }
    }

    

            function displayTurno(value) {
        if (value === undefined || value === null) return '-';
        const v = String(value).toUpperCase();
        if (v.includes('MATUTINO') || v === 'MANHA' || v === 'MANHÃ') return 'Manhã';
        if (v.includes('VESPERTINO') || v === 'TARDE') return 'Tarde';
        if (v.includes('NOTURNO') || v === 'NOITE') return 'Noite';
        return value;
    }

        // Código do calendario e outras funções
    let today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    let months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    let monthAndYear = document.getElementById("monthAndYear");

    // Estado de seleção do calendário
    let selectedDay = null;
    let selectedMonth = null;
    let selectedYear = null;
    let selectedButton = null;
    const openScheduleButton = document.getElementById('openScheduleButton');
    let pendingCheckinQueue = [];
    let currentCheckinSchedule = null;
    let requireCheckinResolution = false;
    const checkinPromptModal = document.getElementById('checkinPromptModal');
    const checkinUserNameSpan = document.getElementById('checkinUserName');
    const checkinConfirmButton = document.getElementById('checkinConfirmButton');
    const checkinCancelButton = document.getElementById('checkinCancelButton');
    const turnoChartCanvas = document.getElementById('turnoChart');
    let turnoChartInstance = null;
    const turnoChartOrder = ['MATUTINO', 'VESPERTINO', 'NOTURNO'];
    const turnoChartLabelMap = {
        'MATUTINO': 'Manhã',
        'VESPERTINO': 'Tarde',
        'NOTURNO': 'Noite'
    };
    const turnoChartMaxValue = 25;

    if (checkinConfirmButton) {
        checkinConfirmButton.addEventListener('click', () => processCheckinResponse('REALIZADO'));
    }
    if (checkinCancelButton) {
        checkinCancelButton.addEventListener('click', () => processCheckinResponse('CANCELADO'));
    }

    function isPastDate(day, month, year) {
        try {
            const dSel = new Date(year, month, day, 0, 0, 0, 0);
            const dNow = new Date();
            const dToday = new Date(dNow.getFullYear(), dNow.getMonth(), dNow.getDate(), 0, 0, 0, 0);
            return dSel.getTime() < dToday.getTime();
        } catch (_) {
            return false;
        }
    }

    function updateOpenButtonState() {
        if (openScheduleButton) {
            const hasSelection = (selectedDay !== null && selectedMonth !== null && selectedYear !== null);
            const past = hasSelection ? isPastDate(selectedDay, selectedMonth, selectedYear) : false;
            const blocked = requireCheckinResolution;
            openScheduleButton.disabled = !hasSelection || past || blocked;
            if (blocked) {
                openScheduleButton.title = 'Finalize o status do check-in pendente antes de agendar novamente.';
            } else {
                openScheduleButton.removeAttribute('title');
            }
        }
    }

    function clearSelection() {
        selectedDay = null;
        selectedMonth = null;
        selectedYear = null;
        if (selectedButton && selectedButton.classList) {
            selectedButton.classList.remove('selected');
        }
        selectedButton = null;
        updateOpenButtonState();
        refreshTurnoChart();
    }

    function getSelectedDateIso() {
        if (selectedDay === null || selectedMonth === null || selectedYear === null) return null;
        const day = String(selectedDay).padStart(2, '0');
        const month = String(selectedMonth + 1).padStart(2, '0');
        return `${selectedYear}-${month}-${day}`;
    }

    function getTurnoColor(value) {
        const clamped = Math.max(0, Math.min(turnoChartMaxValue, value));
        const ratio = clamped / turnoChartMaxValue;
        const r = Math.round(101 + (210 - 101) * ratio); // from greenish to red
        const g = Math.round(195 - (195 - 48) * ratio);
        const b = Math.round(186 - (186 - 48) * ratio);
        return `rgb(${r}, ${g}, ${b})`;
    }

    function updateTurnoChartDataset(values, isoDate) {
        if (!turnoChartCanvas) return;
        const cappedValues = values.map(v => Math.min(turnoChartMaxValue, Math.max(0, v)));
        const colors = cappedValues.map(v => getTurnoColor(v));
        const labels = turnoChartOrder.map(key => turnoChartLabelMap[key] || key);
        const displayDate = isoDate ? formatDate(isoDate) : '';
        const datasetLabel = displayDate ? `Reservas em ${displayDate}` : 'Reservas';
        if (!turnoChartInstance) {
            turnoChartInstance = new Chart(turnoChartCanvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: datasetLabel,
                        data: cappedValues,
                        backgroundColor: colors
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    backgroundColor: '#3A3D6B',
                    scales: {
                        x: {
                            ticks: { color: '#ffffff' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        y: {
                            beginAtZero: true,
                            max: turnoChartMaxValue,
                            suggestedMax: turnoChartMaxValue,
                            ticks: {
                                precision: 0,
                                color: '#ffffff'
                            },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true
                        }
                    }
                }
            });
        } else {
            turnoChartInstance.data.labels = labels;
            turnoChartInstance.data.datasets[0].data = cappedValues;
            turnoChartInstance.data.datasets[0].label = datasetLabel;
            turnoChartInstance.data.datasets[0].backgroundColor = colors;
            turnoChartInstance.update();
        }
    }

    async function refreshTurnoChart() {
        if (!turnoChartCanvas) return;
        const isoDate = getSelectedDateIso();
        if (!isoDate || !token) {
            updateTurnoChartDataset(turnoChartOrder.map(() => 0), isoDate);
            return;
        }
        try {
            const resp = await fetch(`${API_BASE_URL}/scheduling/analytics/day?date=${isoDate}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`GET /scheduling/analytics/day?date=${isoDate} -> ${resp.status} ${resp.statusText} ${text || ''}`);
            }
            const data = await resp.json();
            const totals = turnoChartOrder.reduce((acc, key) => {
                acc[key] = 0;
                return acc;
            }, {});
            if (Array.isArray(data?.turnos)) {
                data.turnos.forEach(item => {
                    const backendKey = String(item?.turno || '').toUpperCase();
                    if (backendKey in totals) {
                        totals[backendKey] = Number(item?.total) || 0;
                    }
                });
            }
            const values = turnoChartOrder.map(key => totals[key] || 0);
            updateTurnoChartDataset(values, data?.date || isoDate);
        } catch (error) {
            console.warn('Não foi possível carregar o gráfico de turnos:', error);
            updateTurnoChartDataset(turnoChartOrder.map(() => 0), isoDate);
        }
    }

    function selectCalendarDay(button, day, month, year) {
        if (selectedButton && selectedButton.classList) {
            selectedButton.classList.remove('selected');
            selectedButton.classList.remove('bg-info');
        }
        selectedButton = button;
        if (selectedButton && selectedButton.classList) {
            selectedButton.classList.add('selected');
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                selectedButton.classList.add('bg-info');
            }
        }
        selectedDay = day;
        selectedMonth = month;
        selectedYear = year;
        updateOpenButtonState();
        refreshTurnoChart();
    }

    async function openModalForDate(day, month, year) {
        // Bloqueia modal para datas passadas
        if (isPastDate(day, month, year)) {
            alert('Data anterior a hoje. Selecione outra data.');
            return;
        }
        const modal = document.getElementById("confirmationModal");
        const dateInfo = document.getElementById("dateInfo");
        const selectedDate = document.getElementById("selectedDate");
        if (!modal || !dateInfo || !selectedDate) return;

        const mHuman = month + 1;
        selectedDate.value = `${day}-${mHuman}-${year}`;
        dateInfo.classList.add("Text-Title-Modal");
        dateInfo.textContent = `${day} de ${months[month]} de ${year}`;

        await prefillAndLockUserFields();
        await loadSelectOptions();
        applyTurnoRestrictions(day, month, year);
        setupConfirmButtonState();

        modal.style.display = "flex";
    }

    // Clique no botão "Realizar reserva"
    if (openScheduleButton) {
        openScheduleButton.addEventListener('click', async () => {
            if (selectedDay === null || selectedMonth === null || selectedYear === null) {
                alert('Selecione um dia no calendário.');
                return;
            }
            if (isPastDate(selectedDay, selectedMonth, selectedYear)) {
                alert('Data anterior a hoje. Selecione outra data.');
                return;
            }
            await openModalForDate(selectedDay, selectedMonth, selectedYear);
        });
    }

    // Seleciona o dia atual por padrão
    selectedDay = today.getDate();
    selectedMonth = currentMonth;
    selectedYear = currentYear;

    updateOpenButtonState();
    showCalendar(currentMonth, currentYear);
    refreshTurnoChart();

    function next() {
        currentYear = (currentMonth === 11) ? currentYear + 1 : currentYear;
        currentMonth = (currentMonth + 1) % 12;
        clearSelection();
        showCalendar(currentMonth, currentYear);
    }

    function formatDate(value) {
        if (!value && value !== 0) return '-';
        const pad = num => String(num).padStart(2, '0');
        try {
            if (typeof value === 'string') {
                const cleaned = value.split('T')[0].split(' ')[0];
                const dashParts = cleaned.split('-');
                if (dashParts.length === 3) {
                    if (dashParts[0].length === 4) {
                        const [yyyy, mm, dd] = dashParts;
                        return `${pad(dd)}-${pad(mm)}-${yyyy}`.replace(/-/g, '/');
                    }
                    if (dashParts[2].length === 4) {
                        const [dd, mm, yyyy] = dashParts;
                        return `${pad(dd)}/${pad(mm)}/${yyyy}`;
                    }
                }
                const slashParts = cleaned.split('/');
                if (slashParts.length === 3) {
                    const [dd, mm, yyyy] = slashParts;
                    return `${pad(dd)}/${pad(mm)}/${yyyy}`;
                }
            }
            const date = new Date(value);
            if (!isNaN(date)) {
                const dd = pad(date.getDate());
                const mm = pad(date.getMonth() + 1);
                const yyyy = date.getFullYear();
                return `${dd}/${mm}/${yyyy}`;
            }
        } catch (_) {}
        return value;
    }

    function previous() {
        currentYear = (currentMonth === 0) ? currentYear - 1 : currentYear;
        currentMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
        clearSelection();
        showCalendar(currentMonth, currentYear);
    }

    function showCalendar(month, year) {
        const firstDay = new Date(year, month).getDay();
        const daysInMonth = 32 - new Date(year, month, 32).getDate();
        const tbl = document.getElementById("calendarBody");
        if (!tbl) return;
        tbl.innerHTML = "";
        monthAndYear.innerHTML = months[month] + " " + year;

        let date = 1;
        for (let i = 0; i < 6; i++) {
            const row = document.createElement("tr");
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDay) {
                    const cell = document.createElement("td");
                    row.appendChild(cell);
                } else if (date > daysInMonth) {
                    const cell = document.createElement("td");
                    row.appendChild(cell);
                } else {
                    const cell = document.createElement("td");
                    const btn = document.createElement("button");
                    btn.textContent = date;
                    btn.className = "calendar-btn";
                    const thisDay = date; // captura o valor do dia atual
                    btn.addEventListener("click", (event) => selectCalendarDay(event.target, thisDay, month, year));
                    const isToday = (date === today.getDate() && year === today.getFullYear() && month === today.getMonth());
                    if (isToday && (selectedDay === null || (selectedDay === thisDay && selectedMonth === month && selectedYear === year))) {
                        btn.classList.add("bg-info");
                    }
                    // Se este dia já está selecionado (ex: re-render), reatribuir classe
                    if (selectedDay === thisDay && selectedMonth === month && selectedYear === year) {
                        btn.classList.add('selected');
                        selectedButton = btn;
                    }
                    cell.appendChild(btn);
                    row.appendChild(cell);
                    date++;
                }
            }
            tbl.appendChild(row);
            if (date > daysInMonth) break;
        }
    }

    // (Fluxo antigo removido: abrir diretamente ao clicar no dia)

    function applyTurnoRestrictions(day, month, year) {
        const turnoSel = document.getElementById('turno');
        if (!turnoSel) return;

        // Reabilita todas as opções inicialmente
        const optManha = turnoSel.querySelector('option[value="MANHA"]');
        const optTarde = turnoSel.querySelector('option[value="TARDE"]');
        const optNoite = turnoSel.querySelector('option[value="NOITE"]');
        [optManha, optTarde, optNoite].forEach(opt => { if (opt) opt.disabled = false; });

        // Se não for hoje, todas opções válidas
        const now = new Date();
        const isToday = (year === now.getFullYear() && month === now.getMonth() && day === now.getDate());
        if (!isToday) {
            return;
        }

        const h = now.getHours();
        const m = now.getMinutes();
        const after12 = (h > 12) || (h === 12 && m > 0);
        const after18 = (h > 18) || (h === 18 && m > 0);

        // >18h: apenas Noite
        if (after18) {
            if (optManha) optManha.disabled = true;
            if (optTarde) optTarde.disabled = true;
        } else if (after12) {
            // >12h: Tarde e Noite
            if (optManha) optManha.disabled = true;
        }

        // Se a opção atualmente selecionada ficou desabilitada, limpa seleção
        if (turnoSel.value && turnoSel.selectedOptions && turnoSel.selectedOptions[0]?.disabled) {
            turnoSel.value = '';
        }
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

    // Confirma reserva: envia para o backend e recarrega a lista
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
        const baseUrl = API_BASE_URL;

        // Mapeia rotulos para valores do backend
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

        const baseUrl = API_BASE_URL;
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
            const baseUrl = API_BASE_URL;
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

    // Edicao/Update de reserva
    const uiToBackendTurno = { 'MANHA': 'MATUTINO', 'TARDE': 'VESPERTINO', 'NOITE': 'NOTURNO' };
    const backendToUiTurno = { 'MATUTINO': 'MANHA', 'VESPERTINO': 'TARDE', 'NOTURNO': 'NOITE' };

    async function loadEditSelectOptions() {
        const token = localStorage.getItem('authToken');
        const trackSel = document.getElementById('editTrack');
        if (!trackSel) return;
        trackSel.innerHTML = '<option value="" disabled selected>Selecione</option>';

        const baseUrl = API_BASE_URL;
        try {
            const resp = await fetch(`${baseUrl}/track/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (resp.ok) {
                const data = await resp.json();
                const tracks = Array.isArray(data) ? data : [];
                tracks.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t?.id;
                    opt.textContent = t?.name || t?.nome || `#${t?.id}`;
                    trackSel.appendChild(opt);
                });
            }
        } catch (_) {}
    }

    window.openEditScheduleModal = async function(id) {
        if (!id && id !== 0) return;
        const modal = document.getElementById('editScheduleModal');
        const idInput = document.getElementById('editScheduleId');
        const trackSel = document.getElementById('editTrack');
        const turnoSel = document.getElementById('editTurno');
        const dateInput = document.getElementById('editDate');
        if (!modal || !idInput || !trackSel || !turnoSel || !dateInput) return;

        const item = schedulesById.get(id);
        if (!item) return;

        await loadEditSelectOptions();

        idInput.value = id;

        // Preenche pista
        const trackId = item?.track?.id ?? '';
        if (trackId) trackSel.value = String(trackId);

        // Preenche turno
        const uiTurno = backendToUiTurno[(item?.turno || '').toUpperCase()]; // (item?.turno || '')
        if (uiTurno) turnoSel.value = uiTurno;

        // Preenche data (YYYY-MM-DD)
        let isoDate = '';
        const raw = item?.scheduledDate;
        if (raw) {
            try {
                // tenta usar somente os 10 primeiros caracteres se vier com hora
                isoDate = String(raw).slice(0, 10);
                // valida
                if (isNaN(new Date(isoDate))) {
                    const d = new Date(raw);
                    if (!isNaN(d)) {
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        isoDate = `${d.getFullYear()}-${mm}-${dd}`;
                    }
                }
            } catch (_) {}
        }
        dateInput.value = isoDate || '';

        modal.style.display = 'flex';
    }

    window.closeEditScheduleModal = function() {
        const modal = document.getElementById('editScheduleModal');
        if (modal) modal.style.display = 'none';
    }

    window.saveScheduleUpdate = async function() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = 'login.html';
            return;
        }

        const id = document.getElementById('editScheduleId')?.value;
        const trackId = document.getElementById('editTrack')?.value;
        const turno = document.getElementById('editTurno')?.value;
        const dateIso = document.getElementById('editDate')?.value; // já no formato YYYY-MM-DD
        if (!id || !trackId || !turno || !dateIso) {
            alert('Preencha pista, turno e data.');
            return;
        }

        const current = schedulesById.get(Number(id));
        const userId = (current?.user?.id != null) ? current.user.id : getUserIdFromToken();
        const payload = {
            id: Number(id),
            trackId: Number(trackId),
            scheduledDate: dateIso,
            turno: uiToBackendTurno[turno] || turno
        };
        if (userId != null) payload.userId = Number(userId);
        // mantem paymentId atual (ou explicita null)
        const paymentId = current?.payment?.id ?? current?.paymentId;
        payload.paymentId = (paymentId != null) ? Number(paymentId) : null;

        const baseUrl = API_BASE_URL;
        try {
            const resp = await fetch(`${baseUrl}/scheduling/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`PUT /scheduling/ -> ${resp.status} ${resp.statusText} ${text || ''}`);
            }
            alert('Reserva atualizada com sucesso!');
            window.closeEditScheduleModal();
            try { location.reload(); } catch (_) {}
        } catch (err) {
            console.error(err);
            alert('Não foi possível atualizar a reserva.');
        }
    }

    window.deleteSchedule = async function(id) {
        if (!id && id !== 0) return;
        if (!confirm('Deseja realmente excluir esta reserva?')) return;
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = 'login.html';
            return;
        }
        const baseUrl = API_BASE_URL;

        async function tryDelete(url, options) {
            try {
                const resp = await fetch(url, options);
                if (resp.ok) return { ok: true };
                const text = await resp.text();
                return { ok: false, msg: `${resp.status} ${resp.statusText} ${text || ''}` };
            } catch (e) {
                return { ok: false, msg: e.message };
            }
        }

        const commonHeaders = {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // Chama endpoint de delete 
        const attempts = [
            { url: `${baseUrl}/scheduling/${id}`, method: 'DELETE', headers: commonHeaders },
        ];

        let lastErr = '';
        for (const a of attempts) {
            const res = await tryDelete(a.url, { method: a.method, headers: a.headers, body: a.body });
            if (res.ok) {
                alert('Reserva excluída com sucesso!');
                try { location.reload(); } catch (_) {}
                return;
            }
            lastErr = `${a.method} ${a.url} -> ${res.msg}`;
            console.warn(lastErr);
        }
        console.error('Falha ao excluir reserva:', lastErr);
        alert('Não foi possível excluir a reserva.');
    }

    // expor navegacao do calendario para onclick do HTML
    try { window.next = next; window.previous = previous; } catch (_) {}
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







