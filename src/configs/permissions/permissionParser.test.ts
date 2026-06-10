import { parsePermissionString } from './permissionParser';

describe('parsePermissionToString', () => {
    it('should parse super admin permissions "sa:all"', () => {
        expect(parsePermissionString('sa:all')).toEqual({
            subject: 'all',
            action: 'manage',
        });
    });

    it('should return null for invalid permission format', () => {
        expect(parsePermissionString('invalid')).toBeNull();
        expect(parsePermissionString('user')).toBeNull();
        expect(parsePermissionString('user:')).toBeNull();
        expect(parsePermissionString(':view:add')).toBeNull();
        expect(parsePermissionString('sa:all')).not.toBeNull();
    });
});
