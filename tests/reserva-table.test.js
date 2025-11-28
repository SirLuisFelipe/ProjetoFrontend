const {
    sortSchedulesByDate,
    normalizeScheduleRow
} = require('../Assets/js/reserva-helpers');

describe('Helpers da tabela de reservas', () => {
    test('sortSchedulesByDate ordena por data decrescente e mantém items sem data no fim', () => {
        const items = [
            { id: 1, scheduledDate: '2024-11-27' },
            { id: 2, scheduledDate: null },
            { id: 3, scheduledDate: '2024-11-25' }
        ];
        const sorted = sortSchedulesByDate(items);
        expect(sorted.map(item => item.id)).toEqual([1, 3, 2]);
        expect(items.map(item => item.id)).toEqual([1, 2, 3]); // não mutou o array original
    });

    test('normalizeScheduleRow formata campos e aplica fallback "-" quando necessário', () => {
        const item = {
            user: { name: 'Ana', email: 'ana@example.com' },
            track: { name: 'Pista 1' },
            turno: 'MATUTINO',
            checkinStatus: 'REALIZADO',
            scheduledDate: '2024-11-26T10:00:00'
        };
        const normalized = normalizeScheduleRow(item);
        expect(normalized).toEqual({
            name: 'Ana',
            email: 'ana@example.com',
            track: 'Pista 1',
            turno: 'Manha',
            checkin: 'Realizado',
            date: '26/11/2024'
        });

        const fallback = normalizeScheduleRow({});
        expect(fallback).toEqual({
            name: '-',
            email: '-',
            track: '-',
            turno: '-',
            checkin: '-',
            date: '-'
        });
    });
});
