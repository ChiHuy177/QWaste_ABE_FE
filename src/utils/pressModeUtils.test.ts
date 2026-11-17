import { getVisiblePressModeLabelKey } from './pressModeUtils';

describe('getVisiblePressModeLabelKey', () => {
    it('trả về key dập đơn khi mode là SINGLE', () => {
        expect(getVisiblePressModeLabelKey('SINGLE', 'RUNTIME')).toBe('pressMode.single');
    });

    it('trả về key dập tự động khi mode là AUTOMATIC', () => {
        expect(getVisiblePressModeLabelKey('AUTOMATIC', 'IDLE')).toBe('pressMode.automatic');
    });

    it('trả về null khi mode là null hoặc không có', () => {
        expect(getVisiblePressModeLabelKey(null, 'RUNTIME')).toBeNull();
        expect(getVisiblePressModeLabelKey(undefined, 'RUNTIME')).toBeNull();
    });

    it('trả về null khi máy OFFLINE', () => {
        expect(getVisiblePressModeLabelKey('AUTOMATIC', 'OFFLINE')).toBeNull();
    });
});
