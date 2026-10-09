'use client';
import { cloneElement, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import type { CSSProperties, ReactElement, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SpaceService } from '@/services/SpaceService';
import { SpaceLevelService } from '@/services/SpaceLevelService';
import { UtilsService } from '@/services/UtilsService';
import type { SpaceLevelDTO } from '@/types/SpaceLevel';
import { toast } from 'sonner';
import {
    Button,
    Card,
    Table,
    Grid,
    Spin,
    theme,
    Tooltip,
    Typography,
    Modal,
    Descriptions,
    Image,
    Alert,
} from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PlusOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import {
    SpaceWithChildrenResponse,
    SpaceCreationRequest,
    SpaceUpdationRequest,
    SpaceFormData,
    SpaceModalData,
} from '@/types/Space';
import {
    getSpaceTableColumns,
    type SpaceTableColumnProps,
    getSpaceFormFields,
} from '@/features/dashboard/categories/space';
import { EntityFormModal } from '@/components/shared/FormModal';
import { compressImage } from '@/components/shared/FormModal/fieldRenderers';
import { SearchInput } from '@/components/shared/SearchInput';
import { Can, useAbility } from '@/contexts/AbilityContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { useAntdTableScroll } from '@/hooks/useAntdTableScroll';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUploadThing } from '@/utils/uploadthing';
import { mapSpaceTreeToTreeSelect } from '@/components/shared/filters/SpaceTreeSelect';

const { useBreakpoint } = Grid;

const spaceQueryKeys = {
    tree: ['spaces', 'tree'] as const,
    detail: (spaceId: number | string) => ['spaces', 'detail', spaceId] as const,
};

const spaceLevelQueryKeys = {
    lists: ['space-levels', 'list'] as const,
    highest: ['space-levels', 'highest'] as const,
};

const sanitizeSpaceTree = (nodes: SpaceWithChildrenResponse[]): SpaceWithChildrenResponse[] => {
    return nodes.map((node) => ({
        ...node,
        children:
            node.children && node.children.length > 0
                ? sanitizeSpaceTree(node.children)
                : undefined,
    }));
};

const normalizeOptionalUrl = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
};

const isLocalFile = (value: unknown): value is File => {
    return typeof File !== 'undefined' && value instanceof File;
};

const getNumericLevel = (
    item:
        Partial<SpaceLevelDTO> | Partial<SpaceWithChildrenResponse['spaceLevel']> | null | undefined
): number => {
    if (!item) return 0;
    const raw = item.spaceLevel ?? item.spaceLevelId;
    const num = Number(raw);
    return !Number.isNaN(num) ? num : 0;
};

const findSpaceInTree = (
    nodes: SpaceWithChildrenResponse[],
    spaceId: number
): SpaceWithChildrenResponse | null => {
    for (const node of nodes) {
        if (node.spaceId === spaceId) return node;
        if (node.children && node.children.length > 0) {
            const found = findSpaceInTree(node.children, spaceId);
            if (found) return found;
        }
    }
    return null;
};

const findAncestorsAndSelf = (
    nodes: SpaceWithChildrenResponse[],
    targetId: number,
    path: number[] = []
): number[] | null => {
    for (const node of nodes) {
        const currentPath = [...path, node.spaceId];
        if (node.spaceId === targetId) {
            return currentPath;
        }
        if (node.children && node.children.length > 0) {
            const found = findAncestorsAndSelf(node.children, targetId, currentPath);
            if (found) return found;
        }
    }
    return null;
};

interface ResolvedSpaceLevel {
    spaceLevelId: number;
    spaceLevel: number;
    spaceLevelName: string;
    parentName?: string;
    error?: 'noLevelConfigured' | 'parentNotFound' | 'maxLevelReached' | 'noTargetLevelConfigured';
}

const resolveSpaceLevelForParent = (
    parentSpaceId: number | null | undefined,
    spacesTree: SpaceWithChildrenResponse[],
    spaceLevels: SpaceLevelDTO[],
    configuredMaxLevel?: number
): ResolvedSpaceLevel => {
    if (parentSpaceId === null || parentSpaceId === undefined) {
        const validLevels = spaceLevels.filter((l) => getNumericLevel(l) > 0);
        const rootLevel =
            spaceLevels.find((l) => getNumericLevel(l) === 1) ||
            (validLevels.length > 0
                ? validLevels.reduce((min, curr) =>
                      getNumericLevel(curr) < getNumericLevel(min) ? curr : min
                  )
                : spaceLevels[0]);

        if (!rootLevel) {
            return {
                spaceLevelId: 0,
                spaceLevel: 0,
                spaceLevelName: '',
                error: 'noLevelConfigured',
            };
        }

        return {
            spaceLevelId: rootLevel.spaceLevelId,
            spaceLevel: getNumericLevel(rootLevel),
            spaceLevelName: rootLevel.spaceLevelName,
        };
    }

    const parentNode = findSpaceInTree(spacesTree, Number(parentSpaceId));
    if (!parentNode) {
        return {
            spaceLevelId: 0,
            spaceLevel: 0,
            spaceLevelName: '',
            error: 'parentNotFound',
        };
    }

    const parentLevel = getNumericLevel(parentNode.spaceLevel);
    const maxLevel =
        configuredMaxLevel !== undefined && configuredMaxLevel > 0
            ? configuredMaxLevel
            : spaceLevels.length
              ? Math.max(...spaceLevels.map(getNumericLevel))
              : 0;

    if (maxLevel > 0 && parentLevel >= maxLevel) {
        return {
            spaceLevelId: 0,
            spaceLevel: parentLevel + 1,
            spaceLevelName: '',
            parentName: parentNode.spaceName,
            error: 'maxLevelReached',
        };
    }

    const targetLevelNum = parentLevel + 1;
    let targetConfig = spaceLevels.find((l) => getNumericLevel(l) === targetLevelNum);
    if (!targetConfig) {
        targetConfig = spaceLevels.find((l) => getNumericLevel(l) > parentLevel);
    }

    if (!targetConfig) {
        return {
            spaceLevelId: 0,
            spaceLevel: targetLevelNum,
            spaceLevelName: '',
            parentName: parentNode.spaceName,
            error: 'noTargetLevelConfigured',
        };
    }

    return {
        spaceLevelId: targetConfig.spaceLevelId,
        spaceLevel: getNumericLevel(targetConfig),
        spaceLevelName: targetConfig.spaceLevelName,
        parentName: parentNode.spaceName,
    };
};

const SpaceListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: SpaceModalData | null;
    }>({ open: false, mode: 'create', data: null });

    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { checkPermission } = usePermissionCheck();
    const { handleError } = useApiErrorHandler();
    const ability = useAbility();
    const { startUpload } = useUploadThing('imageUploader');

    const [expandedRowKeys, setExpandedRowKeys] = useState<readonly React.Key[]>([]);
    const manualExpandedKeysRef = useRef<readonly React.Key[]>([]);
    const prevSearchTermRef = useRef('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormLoading, setIsFormLoading] = useState(false);

    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        loading: boolean;
        data: SpaceWithChildrenResponse | null;
    }>({ open: false, loading: false, data: null });

    const { Title } = Typography;

    usePageTitle(t('pageTitle.spaceList'));

    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const { token: themeToken } = theme.useToken();

    const spaceLevelsQuery = useQuery({
        queryKey: spaceLevelQueryKeys.lists,
        queryFn: async () => {
            try {
                const paginated = await SpaceLevelService.getSpaceLevelsPaginated({
                    page: 0,
                    size: 100,
                    sort: 'spaceLevel,ASC',
                });
                const content = paginated?.content;
                if (Array.isArray(content) && content.length > 0) {
                    return [...content].sort((a, b) => getNumericLevel(a) - getNumericLevel(b));
                }
            } catch {
                // Fallback to getAllSpaceLevels if paginated request fails
            }

            const response = (await SpaceLevelService.getAllSpaceLevels()) as unknown;
            const levels = Array.isArray(response)
                ? response
                : ((response as { content?: SpaceLevelDTO[] })?.content ?? []);
            return [...levels].sort((a, b) => getNumericLevel(a) - getNumericLevel(b));
        },
    });

    const spacesTreeQuery = useQuery({
        queryKey: spaceQueryKeys.tree,
        queryFn: async () => {
            const response = await SpaceService.getAllSpacesTree();
            return sanitizeSpaceTree(response ?? []);
        },
    });

    const highestSpaceLevelQuery = useQuery({
        queryKey: spaceLevelQueryKeys.highest,
        queryFn: async () => {
            return await UtilsService.getHighestSpaceLevel();
        },
    });

    const spaceLevels = spaceLevelsQuery.data ?? [];
    const spaceData = spacesTreeQuery.data ?? [];

    const loading =
        spaceLevelsQuery.isLoading ||
        spaceLevelsQuery.isFetching ||
        spacesTreeQuery.isLoading ||
        spacesTreeQuery.isFetching ||
        highestSpaceLevelQuery.isLoading ||
        highestSpaceLevelQuery.isFetching;

    useEffect(() => {
        if (spaceLevelsQuery.error) {
            handleError(spaceLevelsQuery.error, {
                fallbackKey: 'spaceLevelManagement.fetchError',
            });
        }
    }, [spaceLevelsQuery.error, handleError]);

    useEffect(() => {
        if (highestSpaceLevelQuery.error) {
            handleError(highestSpaceLevelQuery.error, {
                fallbackKey: 'spaceLevelManagement.fetchError',
            });
        }
    }, [highestSpaceLevelQuery.error, handleError]);

    useEffect(() => {
        if (spacesTreeQuery.error) {
            handleError(spacesTreeQuery.error, { fallbackKey: 'spaceManagement.fetchError' });
        }
    }, [spacesTreeQuery.error, handleError]);

    const maxSpaceLevel = useMemo(() => {
        if (typeof highestSpaceLevelQuery.data === 'number' && highestSpaceLevelQuery.data > 0) {
            return highestSpaceLevelQuery.data;
        }
        if (!spaceLevels.length) return 0;
        return Math.max(...spaceLevels.map(getNumericLevel));
    }, [highestSpaceLevelQuery.data, spaceLevels]);

    const spaceTreeSelectData = useMemo(() => {
        return mapSpaceTreeToTreeSelect(spaceData, '', {
            maxSelectableLevel: maxSpaceLevel,
            maxBadgeText: t('spaceManagement.maxLevelBadge', { defaultValue: 'Tối đa' }),
            t,
        });
    }, [spaceData, maxSpaceLevel, t]);

    const handleParentSpaceChange = useCallback(
        (newParentId: number | null) => {
            const resolved = resolveSpaceLevelForParent(
                newParentId,
                spaceData,
                spaceLevels,
                maxSpaceLevel
            );
            setModalState((prev) => ({
                ...prev,
                data: {
                    ...prev.data,
                    parentSpaceId: newParentId,
                    parentName: resolved.parentName ?? '',
                    spaceLevelId: resolved.spaceLevelId,
                    spaceLevelName: resolved.spaceLevelName,
                },
            }));
        },
        [spaceData, spaceLevels, maxSpaceLevel]
    );

    const validateParentSpace = useCallback(
        (parentSpaceId: number | null) => {
            if (parentSpaceId === null || parentSpaceId === undefined) return null;
            const resolved = resolveSpaceLevelForParent(
                parentSpaceId,
                spaceData,
                spaceLevels,
                maxSpaceLevel
            );
            if (resolved.error === 'maxLevelReached') {
                return t('spaceManagement.form.validation.cannotAddChildToMaxLevel', {
                    maxLevel: maxSpaceLevel,
                    defaultValue: `Không thể tạo khu vực con vì khu vực này đã đạt cấp tối đa (Cấp ${maxSpaceLevel}).`,
                });
            }
            if (resolved.error) {
                return t('spaceManagement.errors.noLevelConfigured');
            }
            return null;
        },
        [spaceData, spaceLevels, maxSpaceLevel, t]
    );

    const handleCreateRoot = () => {
        if (!spaceLevels.length) {
            toast.error(t('spaceManagement.errors.noLevelConfigured'));
            return;
        }

        const resolved = resolveSpaceLevelForParent(null, spaceData, spaceLevels, maxSpaceLevel);
        if (resolved.error) {
            toast.error(t('spaceManagement.errors.noLevelConfigured'));
            return;
        }

        setModalState({
            open: true,
            mode: 'create',
            data: {
                spaceLevelId: resolved.spaceLevelId,
                parentSpaceId: null,
                parentName: '',
                spaceLevelName: resolved.spaceLevelName,
            },
        });
    };

    const handleAddChild = useCallback(
        (parentSpace: SpaceWithChildrenResponse) => {
            if (!checkPermission('create', 'space')) return;

            const resolved = resolveSpaceLevelForParent(
                parentSpace.spaceId,
                spaceData,
                spaceLevels,
                maxSpaceLevel
            );

            if (resolved.error === 'maxLevelReached') {
                toast.error(
                    t('spaceManagement.form.validation.cannotAddChildToMaxLevel', {
                        maxLevel: maxSpaceLevel,
                        defaultValue: `Không thể tạo khu vực con vì khu vực này đã đạt cấp tối đa (Cấp ${maxSpaceLevel}).`,
                    })
                );
                return;
            }

            if (resolved.error) {
                toast.error(t('spaceManagement.errors.noLevelConfigured'));
                return;
            }

            setExpandedRowKeys((prev) => Array.from(new Set([...prev, parentSpace.spaceId])));
            manualExpandedKeysRef.current = Array.from(
                new Set([...manualExpandedKeysRef.current, parentSpace.spaceId])
            );

            setModalState({
                open: true,
                mode: 'create',
                data: {
                    spaceLevelId: resolved.spaceLevelId,
                    parentSpaceId: parentSpace.spaceId,
                    parentName: parentSpace.spaceName,
                    spaceLevelName: resolved.spaceLevelName,
                },
            });
        },
        [checkPermission, spaceData, spaceLevels, maxSpaceLevel, t]
    );

    const handleEditSpace = useCallback(
        async (space: SpaceWithChildrenResponse) => {
            if (!checkPermission('update', 'space')) return;

            setModalState({
                open: true,
                mode: 'edit',
                data: null,
            });
            setIsFormLoading(true);

            try {
                const detailData = await queryClient.fetchQuery({
                    queryKey: spaceQueryKeys.detail(space.spaceId),
                    queryFn: () => SpaceService.getSpaceById(space.spaceId),
                });
                setModalState({
                    open: true,
                    mode: 'edit',
                    data: {
                        ...detailData,
                        parentSpaceId: detailData.parentId,
                    },
                });
            } catch (error: unknown) {
                console.error('Error fetching space details:', error);
                handleError(error, { fallbackKey: 'spaceManagement.fetchError' });
                setModalState({ open: false, mode: 'create', data: null });
            } finally {
                setIsFormLoading(false);
            }
        },
        [checkPermission, handleError, queryClient]
    );

    const { mutateAsync: createSpace } = useMutation({
        mutationFn: (data: SpaceCreationRequest) => SpaceService.createSpace(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: spaceQueryKeys.tree });
        },
    });

    const { mutateAsync: updateSpace } = useMutation({
        mutationFn: (data: SpaceUpdationRequest) => SpaceService.updateSpace(data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: spaceQueryKeys.tree });
            queryClient.invalidateQueries({ queryKey: spaceQueryKeys.detail(variables.spaceId) });
        },
    });

    const { mutateAsync: deleteSpace } = useMutation({
        mutationFn: (spaceId: number | string) => SpaceService.deleteSpace(spaceId),
        onSuccess: (_data, spaceId) => {
            queryClient.invalidateQueries({ queryKey: spaceQueryKeys.tree });
            queryClient.invalidateQueries({ queryKey: spaceQueryKeys.detail(spaceId) });
        },
    });

    const handleDeleteSpace = useCallback(
        async (space: SpaceWithChildrenResponse) => {
            if (!checkPermission('delete', 'space')) return;
            try {
                const spaceId = space.spaceId;
                await deleteSpace(spaceId);
                toast.success(t('spaceManagement.deleteSuccess'));
            } catch (error) {
                handleError(error, {
                    fallbackKey: 'spaceManagement.deleteError',
                });
            }
        },
        [t, checkPermission, deleteSpace, handleError]
    );

    const handleViewSpace = useCallback(
        async (step: SpaceWithChildrenResponse) => {
            setViewModalState({ open: true, loading: true, data: null });
            try {
                const detailData = await queryClient.fetchQuery({
                    queryKey: spaceQueryKeys.detail(step.spaceId),
                    queryFn: () => SpaceService.getSpaceById(step.spaceId),
                });
                setViewModalState({ open: true, loading: false, data: detailData });
            } catch (error: unknown) {
                console.error('Error fetching step details:', error);
                handleError(error, { fallbackKey: 'spaceManagement.fetchError' });
                setViewModalState({ open: false, loading: false, data: null });
            }
        },
        [handleError, queryClient]
    );

    const columnProps: SpaceTableColumnProps = useMemo(
        () => ({
            onView: handleViewSpace,
            onEdit: handleEditSpace,
            onDelete: handleDeleteSpace,
            onAddChild: handleAddChild,
            maxSpaceLevel,
            isMobile,
            t,
            ability,
        }),
        [
            handleViewSpace,
            handleEditSpace,
            handleDeleteSpace,
            handleAddChild,
            maxSpaceLevel,
            isMobile,
            t,
            ability,
        ]
    );

    const columns = useMemo(() => getSpaceTableColumns(columnProps), [columnProps]);

    const filterSpaces = useCallback(
        (spaces: SpaceWithChildrenResponse[], term: string): SpaceWithChildrenResponse[] => {
            const lowerTerm = term.toLowerCase().trim();

            return spaces.reduce<SpaceWithChildrenResponse[]>((acc, space) => {
                const level = space.spaceLevel?.spaceLevel;
                const levelName = space.spaceLevel?.spaceLevelName?.toLowerCase() || '';
                const levelTag = level ? `l${level}` : '';

                const isMatch =
                    space.spaceName.toLowerCase().includes(lowerTerm) ||
                    space.spaceCode.toLowerCase().includes(lowerTerm) ||
                    (level?.toString().includes(lowerTerm) ?? false) ||
                    levelName.includes(lowerTerm) ||
                    levelTag.includes(lowerTerm);

                if (isMatch) {
                    acc.push(space);
                } else {
                    let filteredChildren: SpaceWithChildrenResponse[] = [];
                    if (space.children && space.children.length > 0) {
                        filteredChildren = filterSpaces(space.children, term);
                    }

                    if (filteredChildren.length > 0) {
                        acc.push({
                            ...space,
                            children: filteredChildren,
                        });
                    }
                }
                return acc;
            }, []);
        },
        []
    );

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return spaceData;
        return filterSpaces(spaceData, searchTerm);
    }, [spaceData, searchTerm, filterSpaces]);

    useEffect(() => {
        const trimmed = searchTerm.trim();
        const prevTrimmed = prevSearchTermRef.current.trim();
        prevSearchTermRef.current = searchTerm;

        if (trimmed) {
            if (!prevTrimmed) {
                manualExpandedKeysRef.current = expandedRowKeys;
            }
            const extractIds = (spaces: SpaceWithChildrenResponse[]): number[] => {
                let ids: number[] = [];
                spaces.forEach((s) => {
                    ids.push(s.spaceId);
                    if (s.children) {
                        ids = ids.concat(extractIds(s.children));
                    }
                });
                return ids;
            };
            setExpandedRowKeys(extractIds(filteredData));
        } else if (prevTrimmed && !trimmed) {
            setExpandedRowKeys(manualExpandedKeysRef.current);
        }
    }, [searchTerm, filteredData]);

    const handleSubmit = async (data: SpaceFormData, mode: 'create' | 'edit') => {
        await executeSubmit(data, mode);
    };

    const uploadFloorPlanIfNeeded = async (value: unknown): Promise<string | null> => {
        if (!value) return null;
        if (!isLocalFile(value)) return normalizeOptionalUrl(value);

        const shouldPreserveOriginal =
            value.type === 'image/svg+xml' || value.name.toLowerCase().endsWith('.svg');
        const uploadFile = shouldPreserveOriginal ? value : await compressImage(value);
        const uploadResults = await startUpload([uploadFile]);
        const uploadResult = uploadResults?.[0];
        const imageUrl = uploadResult?.ufsUrl || uploadResult?.url;

        if (!imageUrl) {
            throw new Error('Image upload failed');
        }

        return imageUrl;
    };

    const executeSubmit = async (data: SpaceFormData, mode: 'create' | 'edit') => {
        try {
            const floorPlanImageUrl = await uploadFloorPlanIfNeeded(data.floorPlanImageUrl);

            if (mode === 'create') {
                const selectedParentId =
                    data.parentSpaceId !== undefined
                        ? data.parentSpaceId
                        : (modalState.data?.parentSpaceId ?? null);

                const resolved = resolveSpaceLevelForParent(
                    selectedParentId,
                    spaceData,
                    spaceLevels,
                    maxSpaceLevel
                );

                if (resolved.error === 'maxLevelReached') {
                    toast.error(
                        t('spaceManagement.form.validation.cannotAddChildToMaxLevel', {
                            maxLevel: maxSpaceLevel,
                            defaultValue: `Không thể tạo khu vực con vì khu vực đã chọn thuộc cấp tối đa (Cấp ${maxSpaceLevel}).`,
                        })
                    );
                    return;
                }

                if (resolved.error || !resolved.spaceLevelId) {
                    toast.error(t('spaceManagement.errors.noLevelConfigured'));
                    return;
                }

                const payload: SpaceCreationRequest = {
                    spaceCode: data.spaceCode.trim().toUpperCase(),
                    spaceName: data.spaceName.trim(),
                    floorPlanImageUrl: floorPlanImageUrl ?? null,
                    description: data.description?.trim() || undefined,
                    displayOrder: Number(data.displayOrder),
                    spaceLevelId: Number(resolved.spaceLevelId),
                    parentSpaceId: selectedParentId ?? null,
                };
                await createSpace(payload);
                if (selectedParentId) {
                    const ancestors = findAncestorsAndSelf(spaceData, selectedParentId) ?? [
                        selectedParentId,
                    ];
                    setExpandedRowKeys((prev) => Array.from(new Set([...prev, ...ancestors])));
                    manualExpandedKeysRef.current = Array.from(
                        new Set([...manualExpandedKeysRef.current, ...ancestors])
                    );
                }
                toast.success(t('spaceManagement.form.createSuccess'));
            } else {
                if (modalState.data?.spaceId) {
                    const submitData: SpaceUpdationRequest = {
                        spaceId: modalState.data.spaceId,
                        spaceCode: data.spaceCode.trim().toUpperCase(),
                        spaceName: data.spaceName.trim(),
                        floorPlanImageUrl: floorPlanImageUrl ?? null,
                        description: data.description?.trim() || undefined,
                        displayOrder: Number(data.displayOrder),
                        parentSpaceId: modalState.data?.parentId ?? null,
                    };
                    await updateSpace(submitData);
                    toast.success(t('spaceManagement.form.updateSuccess'));
                }
            }
        } catch (error: unknown) {
            console.error('Error submitting space:', error);
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'spaceManagement.form.createError'
                        : 'spaceManagement.form.updateError',
            });
            throw error;
        }
    };

    const formFields = useMemo(
        () =>
            getSpaceFormFields(t, modalState.mode, {
                spaceTreeData: spaceTreeSelectData,
                onParentChange: handleParentSpaceChange,
                validateParentSpace,
            }),
        [t, modalState.mode, spaceTreeSelectData, handleParentSpaceChange, validateParentSpace]
    );
    const { tableContainerRef, tableScrollY } = useAntdTableScroll();

    return (
        <div
            style={{
                height: '100%',
                minHeight: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <ResponsivePageHeader
                title={t('spaceManagement.title')}
                loading={loading}
                rightContent={
                    <div
                        style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                        <Tooltip title={t('spaceManagement.searchPlaceholder')}>
                            <div style={{ display: 'inline-block' }}>
                                <SearchInput
                                    placeholder={t('common.search')}
                                    value={searchTerm}
                                    onChange={setSearchTerm}
                                    width={250}
                                    debounceMs={800}
                                />
                            </div>
                        </Tooltip>
                        <Can I="create" a="space">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                block={isMobile}
                                loading={
                                    spaceLevelsQuery.isLoading || highestSpaceLevelQuery.isLoading
                                }
                                onClick={handleCreateRoot}
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('spaceManagement.addSpace')}
                            </Button>
                        </Can>
                    </div>
                }
            />

            <Modal
                title={viewModalState.data?.spaceName}
                open={viewModalState.open}
                onCancel={() => setViewModalState({ open: false, loading: false, data: null })}
                footer={null}
                width={isMobile ? '90%' : 600}
            >
                {viewModalState.loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Spin />
                    </div>
                ) : viewModalState.data ? (
                    <div>
                        <Descriptions column={isMobile ? 1 : 2} bordered size="small">
                            <Descriptions.Item label={t('spaceManagement.table.headers.spaceName')}>
                                {viewModalState.data.spaceName || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('spaceManagement.table.headers.spaceCode')}>
                                {viewModalState.data.spaceCode || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('spaceManagement.table.headers.level')}>
                                {viewModalState.data.spaceLevel?.spaceLevelName || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('spaceManagement.table.headers.floorPlanImageUrl')}
                                span={isMobile ? 1 : 2}
                            >
                                {viewModalState.data.floorPlanImageUrl ? (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            minWidth: 0,
                                            maxWidth: '100%',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 160,
                                                height: 96,
                                                border: `1px solid ${themeToken.colorBorderSecondary}`,
                                                borderRadius: themeToken.borderRadiusSM,
                                                background: themeToken.colorBgContainer,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Image
                                                src={viewModalState.data.floorPlanImageUrl}
                                                alt={t(
                                                    'spaceManagement.table.headers.floorPlanImageUrl'
                                                )}
                                                width={160}
                                                height={96}
                                                style={{
                                                    objectFit: 'contain',
                                                    background: themeToken.colorBgContainer,
                                                }}
                                                preview={{
                                                    imageRender: (originalNode) => {
                                                        const imageNode =
                                                            originalNode as ReactElement<{
                                                                style?: CSSProperties;
                                                            }>;

                                                        return cloneElement(imageNode, {
                                                            style: {
                                                                ...imageNode.props.style,
                                                                background:
                                                                    themeToken.colorBgContainer,
                                                            },
                                                        });
                                                    },
                                                }}
                                            />
                                        </div>
                                        <Button
                                            type="link"
                                            size="small"
                                            href={viewModalState.data.floorPlanImageUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                                paddingInline: 0,
                                                height: 'auto',
                                                whiteSpace: 'normal',
                                                textAlign: 'left',
                                            }}
                                        >
                                            {t('common.view')}
                                        </Button>
                                    </div>
                                ) : (
                                    '-'
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('spaceManagement.table.headers.displayOrder')}
                            >
                                {viewModalState.data.displayOrder || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('spaceManagement.table.headers.description')}
                            >
                                {viewModalState.data.description || '-'}
                            </Descriptions.Item>
                        </Descriptions>
                        {viewModalState.data.auditMetaData && (
                            <div style={{ marginTop: 16 }}>
                                <Title level={5} style={{ marginBottom: 8 }}>
                                    {t('common.auditInfo.title')}
                                </Title>
                                <Descriptions column={isMobile ? 1 : 2} size="small" bordered>
                                    <Descriptions.Item label={t('common.auditInfo.createdAt')}>
                                        {viewModalState.data.auditMetaData.createdAt
                                            ? dayjs(
                                                  viewModalState.data.auditMetaData.createdAt
                                              ).format('DD/MM/YYYY HH:mm:ss')
                                            : '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t('common.auditInfo.createdBy')}>
                                        {viewModalState.data.auditMetaData.createdBy || '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t('common.auditInfo.updatedAt')}>
                                        {viewModalState.data.auditMetaData.updatedAt
                                            ? dayjs(
                                                  viewModalState.data.auditMetaData.updatedAt
                                              ).format('DD/MM/YYYY HH:mm:ss')
                                            : '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t('common.auditInfo.updatedBy')}>
                                        {viewModalState.data.auditMetaData.updatedBy || '-'}
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                            <Button
                                onClick={() =>
                                    setViewModalState({ open: false, loading: false, data: null })
                                }
                            >
                                {t('common.cancel')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div>{t('common.notAvailable')}</div>
                )}
            </Modal>

            <Card
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                styles={{
                    body: {
                        flex: 1,
                        minHeight: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        paddingBottom: 0,
                    },
                }}
            >
                <div ref={tableContainerRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <Table<SpaceWithChildrenResponse>
                        className="qw-table-scroll-fill"
                        columns={columns}
                        dataSource={filteredData}
                        loading={loading}
                        rowKey="spaceId"
                        pagination={{
                            defaultPageSize: 10,
                            hideOnSinglePage: false,
                            showSizeChanger: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} ${t('common.of')} ${total} ${t(
                                    'common.items'
                                )}`,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            position: ['bottomCenter'],
                        }}
                        expandable={{
                            expandedRowKeys,
                            onExpandedRowsChange: (keys) => {
                                setExpandedRowKeys(keys);
                                if (!searchTerm.trim()) {
                                    manualExpandedKeysRef.current = keys;
                                }
                            },
                            rowExpandable: (record) =>
                                !!record.children && record.children.length > 0,
                            expandRowByClick: true,
                            expandIcon: ({ expanded, onExpand, record }) =>
                                record.children && record.children.length > 0 ? (
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onExpand(
                                                record,
                                                e as unknown as MouseEvent<HTMLButtonElement>
                                            );
                                        }}
                                        style={{
                                            marginRight: 8,
                                            cursor: 'pointer',
                                            color: themeToken.colorTextSecondary,
                                            float: 'left',
                                        }}
                                    >
                                        {expanded ? (
                                            <DownOutlined style={{ fontSize: 10 }} />
                                        ) : (
                                            <RightOutlined style={{ fontSize: 10 }} />
                                        )}
                                    </span>
                                ) : (
                                    <span
                                        style={{
                                            marginRight: 8,
                                            display: 'inline-block',
                                            float: 'left',
                                            width: 12,
                                        }}
                                    />
                                ),
                        }}
                        scroll={{
                            x: 'max-content',
                            y: tableScrollY,
                        }}
                        style={{ height: '100%' }}
                        bordered
                    />
                </div>
            </Card>

            <EntityFormModal<SpaceFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
                fields={formFields}
                title={{
                    create: t('spaceManagement.form.createTitle'),
                    edit: t('spaceManagement.form.editTitle'),
                }}
                description={{
                    create: undefined,
                    edit: t('spaceManagement.form.editDescription'),
                }}
                topContent={
                    modalState.mode === 'create' ? (
                        <Alert
                            type="info"
                            showIcon
                            title={
                                <span>
                                    <strong>
                                        {t('spaceManagement.form.help.noticePrefix', {
                                            defaultValue: 'Lưu ý:',
                                        })}
                                    </strong>{' '}
                                    {t('spaceManagement.form.help.parentSpaceHint')}
                                </span>
                            }
                            style={{ borderRadius: 8 }}
                        />
                    ) : null
                }
                buttonLabels={{
                    cancel: t('spaceManagement.form.buttons.cancel'),
                    create: t('spaceManagement.form.buttons.create'),
                    edit: t('spaceManagement.form.buttons.save'),
                    saving: t('spaceManagement.form.buttons.saving'),
                }}
                width={{ xs: '90%', sm: '80vh', md: '80vh' }}
                auditMetaData={modalState.data?.auditMetaData}
                t={t}
                loading={isFormLoading}
            />
        </div>
    );
};

export default SpaceListPage;
