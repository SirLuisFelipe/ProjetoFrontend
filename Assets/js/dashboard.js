const DASHBOARD_DEFAULT_API_BASE_URL = (() => {
    const hostname = String(globalThis?.location?.hostname || '').toLowerCase();
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    return isLocal
        ? 'http://localhost:8080/reservation'
        : '/api/backend';
})();
const DashboardHelperBundle = globalThis.DashboardHelpers || {
    decodeTokenRole: () => null,
    decodeUserId: () => null,
    formatIsoToHuman: iso => iso || '',
    summarizeTurnoRange: () => ({
        totals: { MATUTINO: 0, VESPERTINO: 0, NOTURNO: 0 },
        label: 'Reservas'
    }),
    getTodayIso: () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
};
const {
    decodeTokenRole,
    formatIsoToHuman,
    summarizeTurnoRange,
    getTodayIso
} = DashboardHelperBundle;

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = globalThis.API_BASE_URL || DASHBOARD_DEFAULT_API_BASE_URL;
    const token = localStorage.getItem('authToken');

    if (!token) {
        globalThis.location.href = 'login.html';
        return;
    }

    const role = decodeTokenRole(token);
    if (!role || !role.includes('ADMIN')) {
        alert('Acesso permitido apenas para administradores.');
        globalThis.location.href = 'reserva.html';
        return;
    }

    const manageUsersButton = document.getElementById('manageUsersButton');
    if (manageUsersButton) {
        manageUsersButton.style.display = 'block';
        manageUsersButton.addEventListener('click', () => {
            globalThis.location.href = 'usuarios.html';
        });
    }

    const trackChartCtx = document.getElementById('trackChart')?.getContext('2d');
    const paymentChartCtx = document.getElementById('paymentChart')?.getContext('2d');
    const dailyChartCtx = document.getElementById('dashboardTurnoChart')?.getContext('2d');
    const timelineChartCtx = document.getElementById('timelineChart')?.getContext('2d');
    const trackStartInput = document.getElementById('trackStartDate');
    const trackEndInput = document.getElementById('trackEndDate');
    const applyTrackFilterBtn = document.getElementById('applyTrackFilter');

    let trackChart;
    let paymentChart;
    let dashboardTurnoChart;
    let timelineChart;

    const cardColors = ['#65c3ba', '#7a5af8', '#f2a541', '#f25f5c', '#ffe066', '#247ba0'];

    async function fetchAnalytics(path) {
        const resp = await fetch(`${API_BASE_URL}${path}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`${path} -> ${resp.status} ${resp.statusText} ${text || ''}`);
        }
        return resp.json();
    }

    function updateTrackChart(data) {
        if (!trackChartCtx) return;
        const labels = data.map(item => item.trackName || `Pista ${item.trackId}`);
        const values = data.map(item => Number(item.total) || 0);
        if (!trackChart) {
            trackChart = new Chart(trackChartCtx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Reservas',
                        data: values,
                        backgroundColor: cardColors
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: {
                            ticks: { color: '#ffffff' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0, color: '#ffffff' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        }
                    }
                }
            });
        } else {
            trackChart.data.labels = labels;
            trackChart.data.datasets[0].data = values;
            trackChart.update();
        }
    }

    function updatePaymentChart(data) {
        if (!paymentChartCtx) return;
        const labels = data.map(item => item.paymentName || 'Sem pagamento');
        const values = data.map(item => Number(item.total) || 0);
        if (!paymentChart) {
            paymentChart = new Chart(paymentChartCtx, {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [{
                        label: 'Reservas',
                        data: values,
                        backgroundColor: cardColors
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#ffffff' } }
                    }
                }
            });
        } else {
            paymentChart.data.labels = labels;
            paymentChart.data.datasets[0].data = values;
            paymentChart.update();
        }
    }

    function updateDailyTurnoChart(data, isoDate) {
        if (!dailyChartCtx) return;
        const order = ['MATUTINO', 'VESPERTINO', 'NOTURNO'];
        const labelMap = {
            'MATUTINO': 'Manhã',
            'VESPERTINO': 'Tarde',
            'NOTURNO': 'Noite'
        };
        const summary = summarizeTurnoRange(data, isoDate, { formatIsoToHuman });
        const labels = order.map(key => labelMap[key]);
        const values = order.map(key => summary.totals[key] || 0);
        const titleDate = summary.label;
        const maxValue = Math.max(...values, 0);
        const colors = values.map(value => {
            if (!maxValue) {
                return '#65c3ba';
            }
            const ratio = Math.min(Math.max(value / maxValue, 0), 1);
            const r = Math.round(101 + (242 - 101) * ratio);
            const g = Math.round(195 - (195 - 95) * ratio);
            const b = Math.round(186 - (186 - 92) * ratio);
            return `rgb(${r}, ${g}, ${b})`;
        });
        if (!dashboardTurnoChart) {
            dashboardTurnoChart = new Chart(dailyChartCtx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: titleDate ? `Reservas em ${titleDate}` : 'Reservas',
                        data: values,
                        backgroundColor: colors
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: {
                            ticks: { color: '#ffffff' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0, color: '#ffffff' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        }
                    }
                }
            });
        } else {
            dashboardTurnoChart.data.labels = labels;
            dashboardTurnoChart.data.datasets[0].data = values;
            dashboardTurnoChart.data.datasets[0].label = titleDate ? `Reservas em ${titleDate}` : 'Reservas';
            dashboardTurnoChart.data.datasets[0].backgroundColor = colors;
            dashboardTurnoChart.update();
        }
    }

    function updateTimelineChart(data) {
        if (!timelineChartCtx) return;
        const labels = data.map(item => item.period || '');
        const values = data.map(item => Number(item.total) || 0);
        if (!timelineChart) {
            timelineChart = new Chart(timelineChartCtx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Reservas por mês',
                        data: values,
                        borderColor: '#65c3ba',
                        backgroundColor: 'rgba(101,195,186,0.2)',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: {
                            ticks: { color: '#ffffff' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0, color: '#ffffff' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        }
                    }
                }
            });
        } else {
            timelineChart.data.labels = labels;
            timelineChart.data.datasets[0].data = values;
            timelineChart.update();
        }
    }

    function updateTopUsers(data) {
        const tbody = document.getElementById('topUsersBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!Array.isArray(data) || !data.length) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="2">Sem dados</td>';
            tbody.appendChild(tr);
            return;
        }
        data.forEach(item => {
            const tr = document.createElement('tr');
            const tdUser = document.createElement('td');
            tdUser.textContent = item?.userName || `Usuário ${item?.userId}`;
            const tdTotal = document.createElement('td');
            tdTotal.textContent = Number(item?.total || 0);
            tr.appendChild(tdUser);
            tr.appendChild(tdTotal);
            tbody.appendChild(tr);
        });
    }

    function updateCancellationCard(data) {
        const percentEl = document.getElementById('cancellationPercentage');
        const totalsEl = document.getElementById('cancellationTotals');
        if (!percentEl || !totalsEl) return;
        const percentage = Number(data?.percentage || 0).toFixed(1);
        const total = Number(data?.total || 0);
        const cancelled = Number(data?.cancelled || 0);
        percentEl.textContent = `${percentage}%`;
        totalsEl.textContent = `${cancelled} / ${total}`;
    }

    function setCurrentMonthRange() {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const toIso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (trackStartInput) trackStartInput.value = toIso(start);
        if (trackEndInput) trackEndInput.value = toIso(end);
    }

    async function refreshDashboard(rangeStart, rangeEnd) {
        try {
            const query = new URLSearchParams();
            if (rangeStart) query.append('startDate', rangeStart);
            if (rangeEnd) query.append('endDate', rangeEnd);
            const suffix = query.toString() ? `?${query.toString()}` : '';

            const trackData = await fetchAnalytics(`/scheduling/analytics/by-track${suffix}`);
            updateTrackChart(Array.isArray(trackData) ? trackData : []);

            const paymentData = await fetchAnalytics(`/scheduling/analytics/by-payment${suffix}`);
            updatePaymentChart(Array.isArray(paymentData) ? paymentData : []);

            const userParams = new URLSearchParams(query);
            userParams.set('limit', 6);
            const userSuffix = `?${userParams.toString()}`;
            const usersData = await fetchAnalytics(`/scheduling/analytics/by-user${userSuffix}`);
            updateTopUsers(Array.isArray(usersData) ? usersData : []);

            const timelineSuffix = suffix || '?months=6';
            const timelineData = await fetchAnalytics(`/scheduling/analytics/timeline${timelineSuffix}`);
            updateTimelineChart(Array.isArray(timelineData) ? timelineData : []);

            const todayIso = getTodayIso();
            const rangeSuffix = suffix || `?startDate=${rangeStart || todayIso}&endDate=${rangeEnd || todayIso}`;
            const dailyData = await fetchAnalytics(`/scheduling/analytics/day-range${rangeSuffix}`);
            updateDailyTurnoChart(dailyData || {}, rangeStart || rangeEnd || todayIso);

            const cancellationSuffix = suffix || '?months=6';
            const cancelData = await fetchAnalytics(`/scheduling/analytics/cancellations${cancellationSuffix}`);
            updateCancellationCard(cancelData || {});
        } catch (error) {
            console.error('Erro ao atualizar indicadores:', error);
            alert('Não foi possível atualizar os indicadores.');
        }
    }

    setCurrentMonthRange();
    refreshDashboard(trackStartInput?.value, trackEndInput?.value);

    async function applyTrackFilter() {
        const startDate = trackStartInput?.value;
        const endDate = trackEndInput?.value;
        await refreshDashboard(startDate, endDate);
    }

    if (applyTrackFilterBtn) {
        applyTrackFilterBtn.addEventListener('click', () => {
            applyTrackFilter();
        });
    }

});

function logout() {
    try {
        localStorage.removeItem('authToken');
    } catch (error) {}
    globalThis.location.href = 'login.html';
}
