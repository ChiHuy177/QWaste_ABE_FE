import { convertApiPermissions, parsePermissionString } from './permissionParser';

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

    it('should parse the canonical production plan slugs', () => {
        expect(parsePermissionString('production_plan:create')).toEqual({
            subject: 'production_plan',
            action: 'create',
        });
        expect(parsePermissionString('production_plan:import')).toEqual({
            subject: 'production_plan',
            action: 'import',
        });
    });

    it('should map legacy "product:*" slugs onto production_plan', () => {
        expect(parsePermissionString('product:create')).toEqual({
            subject: 'production_plan',
            action: 'create',
        });
        expect(parsePermissionString('product:import')).toEqual({
            subject: 'production_plan',
            action: 'import',
        });
    });

    it('should map legacy "production_overview:view" onto dashboard', () => {
        expect(parsePermissionString('production_overview:view')).toEqual({
            subject: 'dashboard',
            action: 'view',
        });
    });

    it('should map legacy "error_management:*" slugs onto machine_incident', () => {
        expect(parsePermissionString('error_management:view')).toEqual({
            subject: 'machine_incident',
            action: 'view',
        });
        expect(parsePermissionString('error_management:update')).toEqual({
            subject: 'machine_incident',
            action: 'update',
        });
    });
});

describe('convertApiPermissions', () => {
    it('should keep legacy and canonical slugs on the same subject', () => {
        expect(convertApiPermissions(['product:create', 'production_plan:view'])).toEqual([
            { subject: 'production_plan', action: 'create' },
            { subject: 'production_plan', action: 'view' },
        ]);
    });

    it('should drop slugs whose action is unknown', () => {
        expect(convertApiPermissions(['create:production_plan', 'production_plan:view'])).toEqual([
            { subject: 'production_plan', action: 'view' },
        ]);
    });
});
