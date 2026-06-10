import type { Permission } from '@/types/Permission';
import { PERMISSION_REGISTRY } from '@/configs/permissions/permissionRegistry';

const auditMetaData = {
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-27T10:30:00.000Z',
    createdBy: 'Demo Admin',
    updatedBy: 'Demo Admin',
};

export const MOCK_RBAC_PERMISSIONS: Permission[] = PERMISSION_REGISTRY.map(
    (permission, index) => ({
        permissionId: index + 1,
        slug: permission.slug,
        permissionName: permission.slug
            .split(':')
            .map((part) =>
                part
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
            )
            .join(' / '),
        description: permission.description,
        auditMetaData,
    })
);
