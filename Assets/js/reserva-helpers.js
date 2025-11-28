(function (global) {
    function isAdminRole(role) {
        if (!role) return false;
        const r = String(role).toUpperCase();
        return r.includes('ADMIN');
    }

    function extractItems(data) {
        if (Array.isArray(data)) return data;
        if (!data || typeof data !== 'object') return [];
        if (Array.isArray(data.content)) return data.content;
        return [];
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

    function buildKey(yyyy, mm, dd, pad) {
        const year = Number(yyyy);
        const month = Number(mm);
        const day = Number(dd);
        if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
        if (month < 1 || month > 12) return null;
        if (day < 1 || day > 31) return null;
        return `${year}-${pad(month)}-${pad(day)}`;
    }

    function parseDashDate(cleaned, pad) {
        const dashParts = cleaned.split('-');
        if (dashParts.length !== 3) return null;
        const [first, second, third] = dashParts;
        if (first.length === 4) {
            return buildKey(first, second, third, pad);
        }
        if (third.length === 4) {
            return buildKey(third, second, first, pad);
        }
        return null;
    }

    function parseSlashDate(cleaned, pad) {
        const slashParts = cleaned.split('/');
        if (slashParts.length !== 3) return null;
        const [first, second, third] = slashParts;
        if (first.length === 4) {
            return buildKey(first, second, third, pad);
        }
        if (third.length === 4) {
            return buildKey(third, second, first, pad);
        }
        return null;
    }

    function getDateKey(value) {
        if (!value) return null;
        const pad = num => String(num).padStart(2, '0');
        try {
            if (typeof value === 'string') {
                const cleaned = value.split('T')[0].split(' ')[0];
                const parsedDash = parseDashDate(cleaned, pad);
                if (parsedDash) return parsedDash;
                const parsedSlash = parseSlashDate(cleaned, pad);
                if (parsedSlash) return parsedSlash;
            }
            if (value instanceof Date) {
                if (isNaN(value)) return null;
                return buildKey(value.getFullYear(), value.getMonth() + 1, value.getDate(), pad);
            }
            const asDate = new Date(value);
            if (!isNaN(asDate)) {
                return buildKey(asDate.getFullYear(), asDate.getMonth() + 1, asDate.getDate(), pad);
            }
        } catch (_) {
            return null;
        }
        return null;
    }

    function getCheckinStatus(schedule) {
        if (!schedule) return undefined;
        if (schedule.checkinStatus !== undefined && schedule.checkinStatus !== null) {
            return schedule.checkinStatus;
        }
        return undefined;
    }

    function displayTurno(value) {
        if (value === undefined || value === null) return '-';
        const normalized = String(value).toUpperCase();
        if (normalized.includes('MATUTINO') || normalized === 'MANHA' || normalized === 'MANHÃ') return 'Manha';
        if (normalized.includes('VESPERTINO') || normalized === 'TARDE') return 'Tarde';
        if (normalized.includes('NOTURNO') || normalized === 'NOITE') return 'Noite';
        return value;
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
                        return `${pad(dd)}/${pad(mm)}/${yyyy}`;
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
                return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
            }
        } catch (_) {}
        return value;
    }

    function isPastDate(day, month, year, referenceDate = new Date()) {
        try {
            const selected = new Date(year, month, day, 0, 0, 0, 0);
            const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), 0, 0, 0, 0);
            return selected.getTime() < today.getTime();
        } catch (_) {
            return false;
        }
    }

    function computeOpenButtonState(options) {
        const {
            selectedDay,
            selectedMonth,
            selectedYear,
            requireCheckinResolution,
            referenceDate = new Date()
        } = options;

        const hasSelection = (
            selectedDay !== null &&
            selectedMonth !== null &&
            selectedYear !== null
        );
        const past = hasSelection
            ? isPastDate(selectedDay, selectedMonth, selectedYear, referenceDate)
            : false;
        const blocked = Boolean(requireCheckinResolution);
        const disabled = !hasSelection || past || blocked;
        const title = blocked
            ? 'Finalize o status do check-in pendente antes de agendar novamente.'
            : null;
        return { disabled, title };
    }

    function resolveCalendarButtonState({
        day,
        month,
        year,
        today,
        selectedDay,
        selectedMonth,
        selectedYear
    }) {
        const classes = ['calendar-btn'];
        const isToday = (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        );
        const isSelected = (
            selectedDay === day &&
            selectedMonth === month &&
            selectedYear === year
        );
        if (isToday && (selectedDay === null || isSelected)) {
            classes.push('bg-info');
        }
        if (isSelected) {
            classes.push('selected');
        }
        return { isToday, isSelected, classes };
    }

    function sortSchedulesByDate(items, getDateKeyFn = getDateKey) {
        if (!Array.isArray(items)) return [];
        return items.slice().sort((a, b) => {
            const keyA = getDateKeyFn(a?.scheduledDate);
            const keyB = getDateKeyFn(b?.scheduledDate);
            if (!keyA && !keyB) return 0;
            if (!keyA) return 1;
            if (!keyB) return -1;
            return keyB.localeCompare(keyA);
        });
    }

    function normalizeScheduleRow(item, {
        formatDateFn = formatDate,
        displayTurnoFn = displayTurno,
        formatCheckinStatusFn = formatCheckinStatus,
        getCheckinStatusFn = getCheckinStatus
    } = {}) {
        const safeText = (value) => (value === undefined || value === null || value === '' ? '-' : value);
        const checkinRaw = getCheckinStatusFn(item);
        return {
            name: safeText(item?.user?.name),
            email: safeText(item?.user?.email),
            track: safeText(item?.track?.name),
            turno: displayTurnoFn(item?.turno),
            checkin: formatCheckinStatusFn(checkinRaw),
            date: (item?.scheduledDate === undefined || item?.scheduledDate === null)
                ? '-'
                : formatDateFn(item?.scheduledDate)
        };
    }

    function resolveUserDisplayName(schedule, cachedUserName = null) {
        const fromSchedule = schedule?.user?.name;
        if (fromSchedule) return fromSchedule;
        if (cachedUserName) return cachedUserName;
        return 'Usuario';
    }

    function buildScheduleUpdatePayload(schedule, overrideStatus, deps = {}) {
        const getDateKeyFn = deps.getDateKey || getDateKey;
        const getUserIdFromTokenFn = deps.getUserIdFromToken || (() => null);
        if (!schedule || schedule.id == null) return null;
        const payload = {
            id: Number(schedule.id)
        };
        const userId = schedule?.user?.id ?? getUserIdFromTokenFn();
        if (userId != null) payload.userId = Number(userId);
        const trackId = schedule?.track?.id ?? schedule?.trackId;
        if (trackId != null) payload.trackId = Number(trackId);
        const paymentId = schedule?.payment?.id ?? schedule?.paymentId;
        if (paymentId != null) payload.paymentId = Number(paymentId);
        const rawDate = schedule?.scheduledDate;
        const isoDate = getDateKeyFn(rawDate);
        if (isoDate) payload.scheduledDate = isoDate;
        const turno = schedule?.turno;
        if (turno) payload.turno = String(turno).toUpperCase();
        if (overrideStatus) payload.checkinStatus = overrideStatus;
        return payload;
    }

    function isToday(dateValue, deps = {}) {
        const getDateKeyFn = deps.getDateKey || getDateKey;
        const nowProvider = deps.now || (() => new Date());
        const key = getDateKeyFn(dateValue);
        if (!key) return false;
        const today = nowProvider();
        today.setHours(0, 0, 0, 0);
        const todayKey = getDateKeyFn(today);
        return key === todayKey;
    }

    const helpers = {
        isAdminRole,
        extractItems,
        formatCheckinStatus,
        getDateKey,
        getCheckinStatus,
        displayTurno,
        formatDate,
        isPastDate,
        computeOpenButtonState,
        resolveCalendarButtonState,
        sortSchedulesByDate,
        normalizeScheduleRow,
        resolveUserDisplayName,
        buildScheduleUpdatePayload,
        isToday
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = helpers;
    } else {
        global.ReservaHelpers = helpers;
    }
})(typeof window !== 'undefined' ? window : globalThis);
