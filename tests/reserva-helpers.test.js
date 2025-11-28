const {
    isAdminRole,
    extractItems,
    formatCheckinStatus,
    getDateKey,
    isPastDate,
    computeOpenButtonState,
    resolveCalendarButtonState,
    displayTurno,
    formatDate,
    getCheckinStatus,
    resolveUserDisplayName,
    buildScheduleUpdatePayload,
    isToday
} = require('../Assets/js/reserva-helpers');

describe('Reserva helpers', () => {
    test('isAdminRole identifica valores ADMIN independentemente da capitalização', () => {
        expect(isAdminRole('ADMIN')).toBe(true);
        expect(isAdminRole('admin')).toBe(true);
        expect(isAdminRole('user')).toBe(false);
        expect(isAdminRole(undefined)).toBe(false);
    });

    test('extractItems lida com arrays, objetos paginados e entradas inválidas', () => {
        const arr = [{ id: 1 }];
        expect(extractItems(arr)).toBe(arr);

        const paged = { content: [{ id: 2 }, { id: 3 }] };
        expect(extractItems(paged)).toEqual(paged.content);

        expect(extractItems(null)).toEqual([]);
        expect(extractItems({})).toEqual([]);
    });

    test('formatCheckinStatus formata valores conhecidos e mantém os demais', () => {
        expect(formatCheckinStatus('pendente')).toBe('Pendente');
        expect(formatCheckinStatus('nao_realizado')).toBe('Não Realizado');
        expect(formatCheckinStatus('realizado')).toBe('Realizado');
        expect(formatCheckinStatus('cancelado')).toBe('Cancelado');
        expect(formatCheckinStatus('outro')).toBe('outro');
        expect(formatCheckinStatus('')).toBe('-');
    });

    test('getDateKey converte diferentes formatos para YYYY-MM-DD', () => {
        expect(getDateKey('2024-11-26T10:00:00')).toBe('2024-11-26');
        expect(getDateKey('26/11/2024')).toBe('2024-11-26');
        expect(getDateKey(new Date('2024-11-26T12:00:00Z'))).toBe('2024-11-26');
        expect(getDateKey('2024/13/50')).toBeNull();
    });

    test('isPastDate respeita o dia corrente fornecido', () => {
        const reference = new Date('2024-11-26T10:00:00Z');
        expect(isPastDate(25, 10, 2024, reference)).toBe(true); // 25/11/2024
        expect(isPastDate(26, 10, 2024, reference)).toBe(false);
        expect(isPastDate(27, 10, 2024, reference)).toBe(false);
    });

    test('computeOpenButtonState considera seleção e bloqueio de check-in', () => {
        const reference = new Date('2024-11-26T10:00:00Z');
        const baseParams = {
            selectedDay: 26,
            selectedMonth: 10,
            selectedYear: 2024,
            referenceDate: reference
        };
        expect(computeOpenButtonState(baseParams)).toEqual({ disabled: false, title: null });
        expect(computeOpenButtonState({ ...baseParams, selectedDay: null }).disabled).toBe(true);
        expect(computeOpenButtonState({ ...baseParams, requireCheckinResolution: true }))
            .toEqual({
                disabled: true,
                title: 'Finalize o status do check-in pendente antes de agendar novamente.'
            });
        expect(computeOpenButtonState({ ...baseParams, selectedDay: 25 }).disabled).toBe(true);
    });

    test('resolveCalendarButtonState define classes para hoje e para datas selecionadas', () => {
        const today = new Date('2024-11-26T10:00:00Z');
        const base = {
            today,
            selectedDay: null,
            selectedMonth: null,
            selectedYear: null
        };
        const todayState = resolveCalendarButtonState({
            ...base,
            day: 26,
            month: 10,
            year: 2024
        });
        expect(todayState.isToday).toBe(true);
        expect(todayState.classes).toContain('bg-info');
        expect(todayState.classes).not.toContain('selected');

        const selectedState = resolveCalendarButtonState({
            ...base,
            selectedDay: 27,
            selectedMonth: 10,
            selectedYear: 2024,
            day: 27,
            month: 10,
            year: 2024
        });
        expect(selectedState.isSelected).toBe(true);
        expect(selectedState.classes).toContain('selected');
    });

    test('displayTurno normaliza diferentes entradas', () => {
        expect(displayTurno('matutino')).toBe('Manha');
        expect(displayTurno('Noite')).toBe('Noite');
        expect(displayTurno('tarde')).toBe('Tarde');
        expect(displayTurno(null)).toBe('-');
        expect(displayTurno('custom')).toBe('custom');
    });

    test('formatDate converte valores conhecidos e preserva entradas inválidas', () => {
        expect(formatDate('2024-11-26T10:00:00')).toBe('26/11/2024');
        expect(formatDate('26/11/2024')).toBe('26/11/2024');
        expect(formatDate(new Date('2024-11-26T12:00:00Z'))).toBe('26/11/2024');
        expect(formatDate('valor-invalido')).toBe('valor-invalido');
        expect(formatDate(undefined)).toBe('-');
    });

    test('getCheckinStatus devolve o status presente ou undefined', () => {
        expect(getCheckinStatus({ checkinStatus: 'REALIZADO' })).toBe('REALIZADO');
        expect(getCheckinStatus({})).toBeUndefined();
        expect(getCheckinStatus(null)).toBeUndefined();
    });

    test('resolveUserDisplayName prioriza o nome da reserva e em seguida cacheado', () => {
        expect(resolveUserDisplayName({ user: { name: 'Ana' } })).toBe('Ana');
        expect(resolveUserDisplayName({ user: {} }, 'Carlos')).toBe('Carlos');
        expect(resolveUserDisplayName({}, null)).toBe('Usuario');
    });

    test('buildScheduleUpdatePayload compõe o payload com fallback de tokens', () => {
        const payload = buildScheduleUpdatePayload({
            id: 10,
            user: { id: 5 },
            track: { id: 2 },
            payment: { id: 4 },
            scheduledDate: '2024-11-26',
            turno: 'manha'
        }, 'REALIZADO', {
            getDateKey: jest.fn().mockReturnValue('2024-11-26'),
            getUserIdFromToken: jest.fn().mockReturnValue(9)
        });
        expect(payload).toEqual({
            id: 10,
            userId: 5,
            trackId: 2,
            paymentId: 4,
            scheduledDate: '2024-11-26',
            turno: 'MANHA',
            checkinStatus: 'REALIZADO'
        });
        expect(buildScheduleUpdatePayload(null)).toBeNull();
    });

    test('isToday compara a data informada com a data atual normalizada', () => {
        const deps = {
            getDateKey: jest.fn(value => typeof value === 'string' ? value : '2024-11-26'),
            now: () => new Date('2024-11-26T10:00:00')
        };
        expect(isToday('2024-11-26', deps)).toBe(true);
        expect(isToday('2024-11-25', deps)).toBe(false);
    });
});
