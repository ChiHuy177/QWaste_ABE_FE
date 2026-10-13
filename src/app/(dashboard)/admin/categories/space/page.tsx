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
    Form,
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

const getDescendantAndSelfIds = (node: SpaceWithChildrenResponse): number[] => {
    const ids: number[] = [node.spaceId];
    if (node.children && node.children.length > 0) {
        for (const child of node.children) {
            ids.push(...getDescendantAndSelfIds(child));
        }
    }
    return ids;
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

const SpaceListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: SpaceModalData | null;
    }>({ open: false, mode: 'create', data: null });
    const [form] = Form.useForm<SpaceFormData>();
    const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);

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

    const selectedLevelConfig = useMemo(() => {
        if (!selectedLevelId) return null;
        return spaceLevels.find((l) => l.spaceLevelId === selectedLevelId) ?? null;
    }, [selectedLevelId, spaceLevels]);

    const selectedLevelNumber = useMemo(() => {
        return getNumericLevel(selectedLevelConfig);
    }, [selectedLevelConfig]);

    const targetParentLevelNumber = useMemo(() => {
        return selectedLevelNumber > 1 ? selectedLevelNumber - 1 : null;
    }, [selectedLevelNumber]);

    const editingSpaceNode = useMemo(() => {
        if (modalState.mode === 'edit' && modalState.data?.spaceId) {
            return findSpaceInTree(spaceData, modalState.data.spaceId);
        }
        return null;
    }, [modalState.mode, modalState.data?.spaceId, spaceData]);

    const spaceLevelOptions = useMemo(() => {
        return spaceLevels.map((lvl) => {
            const num = getNumericLevel(lvl);
            return {
                value: lvl.spaceLevelId,
                label: t('spaceManagement.levelOption', {
                    level: num,
                    name: lvl.spaceLevelName,
                    defaultValue: `Cấp ${num}: ${lvl.spaceLevelName}`,
                }),
            };
        });
    }, [spaceLevels, t]);

    const isLevelDisabled = modalState.mode === 'edit';
    const levelExtra =
        modalState.mode === 'edit'
            ? t('spaceManagement.form.help.levelEditDisabled', {
                  defaultValue: 'Không thể thay đổi cấp khu vực khi cập nhật.',
              })
            : undefined;

    const handleLevelChange = useCallback(
        (newLevelId: number) => {
            setSelectedLevelId(newLevelId);
            form.setFieldValue('parentSpaceId', null);
            const newLevelConfig = spaceLevels.find((l) => l.spaceLevelId === newLevelId);
            setModalState((prev) => ({
                ...prev,
                data: {
                    ...prev.data,
                    spaceLevelId: newLevelId,
                    spaceLevelName: newLevelConfig?.spaceLevelName ?? '',
                    parentSpaceId: null,
                    parentName: '',
                },
            }));
        },
        [form, spaceLevels]
    );

    const disabledSpaceIds = useMemo(() => {
        const ids: number[] = [];
        if (modalState.mode === 'edit' && editingSpaceNode) {
            ids.push(...getDescendantAndSelfIds(editingSpaceNode));
        }
        return ids;
    }, [modalState.mode, editingSpaceNode]);

    const parentSpaceTreeData = useMemo(() => {
        if (!targetParentLevelNumber || targetParentLevelNumber <= 0) {
            return [];
        }
        return mapSpaceTreeToTreeSelect(spaceData, '', {
            targetSelectableLevel: targetParentLevelNumber,
            maxDepthLevel: targetParentLevelNumber,
            disabledSpaceIds,
            t,
        });
    }, [spaceData, targetParentLevelNumber, disabledSpaceIds, t]);

    const isParentDisabled = !selectedLevelId || selectedLevelNumber <= 1;
    const parentPlaceholder = useMemo(() => {
        if (!selectedLevelId) {
            return t('spaceManagement.form.placeholders.selectLevelFirst', {
                defaultValue: 'Vui lòng chọn cấp khu vực trước...',
            });
        }
        if (selectedLevelNumber === 1) {
            return t('spaceManagement.form.placeholders.rootNoParent', {
                defaultValue: 'Khu vực cấp 1 không có cấp cha (Khu vực gốc)',
            });
        }
        return t('spaceManagement.form.placeholders.selectParentSpace', {
            defaultValue: 'Chọn khu vực cha...',
        });
    }, [selectedLevelId, selectedLevelNumber, t]);

    const handleParentSpaceChange = useCallback(
        (newParentId: number | null) => {
            const parentItem = newParentId ? findSpaceInTree(spaceData, newParentId) : null;
            setModalState((prev) => ({
                ...prev,
                data: {
                    ...prev.data,
                    parentSpaceId: newParentId,
                    parentName: parentItem ? parentItem.spaceName : '',
                },
            }));
        },
        [spaceData]
    );

    const validateParentSpace = useCallback(
        (parentSpaceId: number | null) => {
            if (!selectedLevelId) {
                return t('spaceManagement.form.placeholders.selectLevelFirst', {
                    defaultValue: 'Vui lòng chọn cấp khu vực trước...',
                });
            }

            if (selectedLevelNumber === 1) {
                return null;
            }

            if (selectedLevelNumber > 1 && !parentSpaceId) {
                return t('spaceManagement.form.validation.parentRequiredForNonRoot', {
                    level: selectedLevelNumber,
                    parentLevel: selectedLevelNumber - 1,
                    defaultValue: `Khu vực cấp ${selectedLevelNumber} bắt buộc phải chọn khu vực cha thuộc Cấp ${selectedLevelNumber - 1}.`,
                });
            }

            if (parentSpaceId) {
                const parentNode = findSpaceInTree(spaceData, parentSpaceId);
                if (parentNode) {
                    const pLevel = getNumericLevel(parentNode.spaceLevel);
                    if (pLevel !== selectedLevelNumber - 1) {
                        return t('spaceManagement.form.help.parentLevelHint', {
                            level: selectedLevelNumber - 1,
                            defaultValue: `Khu vực cha phải thuộc Cấp ${selectedLevelNumber - 1}.`,
                        });
                    }
                }
            }

            if (modalState.mode === 'edit' && modalState.data?.spaceId) {
                if (parentSpaceId === modalState.data.spaceId) {
                    return t('spaceManagement.form.validation.cannotSelectSelfAsParent', {
                        defaultValue: 'Không thể chọn chính khu vực này làm khu vực cha.',
                    });
                }
                if (editingSpaceNode) {
                    const descendants = getDescendantAndSelfIds(editingSpaceNode);
                    if (parentSpaceId && descendants.includes(parentSpaceId)) {
                        return t('spaceManagement.form.validation.cannotSelectDescendantAsParent', {
                            defaultValue: 'Không thể chọn khu vực con cháu làm khu vực cha.',
                        });
                    }
                }
            }

            return null;
        },
        [
            selectedLevelId,
            selectedLevelNumber,
            spaceData,
            modalState.mode,
            modalState.data?.spaceId,
            editingSpaceNode,
            t,
        ]
    );

    const handleCreateRoot = () => {
        if (!spaceLevels.length) {
            toast.error(t('spaceManagement.errors.noLevelConfigured'));
            return;
        }

        const rootLevel = spaceLevels.find((l) => getNumericLevel(l) === 1) || spaceLevels[0];

        if (!rootLevel) {
            toast.error(t('spaceManagement.errors.noLevelConfigured'));
            return;
        }

        setSelectedLevelId(rootLevel.spaceLevelId);
        form.setFieldsValue({
            spaceLevelId: rootLevel.spaceLevelId,
            parentSpaceId: null,
            displayOrder: 1,
            spaceCode: '',
            spaceName: '',
            description: '',
            floorPlanImageUrl: null,
        });

        setModalState({
            open: true,
            mode: 'create',
            data: {
                spaceLevelId: rootLevel.spaceLevelId,
                parentSpaceId: null,
                parentName: '',
                spaceLevelName: rootLevel.spaceLevelName,
                displayOrder: 1,
            },
        });
    };

    const handleAddChild = useCallback(
        (parentSpace: SpaceWithChildrenResponse) => {
            if (!checkPermission('create', 'space')) return;

            const parentLevel = getNumericLevel(parentSpace.spaceLevel);
            const targetChildLevelNum = parentLevel + 1;

            if (maxSpaceLevel > 0 && parentLevel >= maxSpaceLevel) {
                toast.error(
                    t('spaceManagement.form.validation.cannotAddChildToMaxLevel', {
                        maxLevel: maxSpaceLevel,
                        defaultValue: `Không thể tạo khu vực con vì khu vực này đã đạt cấp tối đa (Cấp ${maxSpaceLevel}).`,
                    })
                );
                return;
            }

            const targetConfig = spaceLevels.find(
                (l) => getNumericLevel(l) === targetChildLevelNum
            );
            if (!targetConfig) {
                toast.error(t('spaceManagement.errors.noLevelConfigured'));
                return;
            }

            setExpandedRowKeys((prev) => Array.from(new Set([...prev, parentSpace.spaceId])));
            manualExpandedKeysRef.current = Array.from(
                new Set([...manualExpandedKeysRef.current, parentSpace.spaceId])
            );

            setSelectedLevelId(targetConfig.spaceLevelId);
            form.setFieldsValue({
                spaceLevelId: targetConfig.spaceLevelId,
                parentSpaceId: parentSpace.spaceId,
                displayOrder: 1,
                spaceCode: '',
                spaceName: '',
                description: '',
                floorPlanImageUrl: null,
            });

            setModalState({
                open: true,
                mode: 'create',
                data: {
                    spaceLevelId: targetConfig.spaceLevelId,
                    parentSpaceId: parentSpace.spaceId,
                    parentName: parentSpace.spaceName,
                    spaceLevelName: targetConfig.spaceLevelName,
                    displayOrder: 1,
                },
            });
        },
        [checkPermission, spaceLevels, maxSpaceLevel, form, t]
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
                const lvlId = detailData.spaceLevel?.spaceLevelId ?? null;
                setSelectedLevelId(lvlId);
                form.setFieldsValue({
                    spaceLevelId: lvlId,
                    parentSpaceId: detailData.parentId,
                    spaceCode: detailData.spaceCode,
                    spaceName: detailData.spaceName,
                    displayOrder: detailData.displayOrder,
                    description: detailData.description,
                    floorPlanImageUrl: detailData.floorPlanImageUrl,
                });

                setModalState({
                    open: true,
                    mode: 'edit',
                    data: {
                        ...detailData,
                        parentSpaceId: detailData.parentId,
                        spaceLevelId: lvlId,
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
        [checkPermission, handleError, queryClient, form]
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

            const targetLevelId = Number(data.spaceLevelId || selectedLevelId);
            if (!targetLevelId) {
                toast.error(t('spaceManagement.errors.noLevelConfigured'));
                return;
            }

            const targetLevelConfig = spaceLevels.find((l) => l.spaceLevelId === targetLevelId);
            const levelNum = targetLevelConfig ? getNumericLevel(targetLevelConfig) : 0;

            let targetParentId: number | null = null;
            if (levelNum > 1) {
                if (!data.parentSpaceId) {
                    toast.error(
                        t('spaceManagement.form.validation.parentRequiredForNonRoot', {
                            level: levelNum,
                            parentLevel: levelNum - 1,
                            defaultValue: `Khu vực cấp ${levelNum} bắt buộc phải chọn khu vực cha thuộc Cấp ${levelNum - 1}.`,
                        })
                    );
                    return;
                }
                targetParentId = Number(data.parentSpaceId);
            }

            if (mode === 'create') {
                const payload: SpaceCreationRequest = {
                    spaceCode: data.spaceCode.trim().toUpperCase(),
                    spaceName: data.spaceName.trim(),
                    floorPlanImageUrl: floorPlanImageUrl ?? null,
                    description: data.description?.trim() || undefined,
                    displayOrder: Number(data.displayOrder),
                    spaceLevelId: targetLevelId,
                    parentSpaceId: targetParentId,
                };
                await createSpace(payload);
                if (targetParentId) {
                    const ancestors = findAncestorsAndSelf(spaceData, targetParentId) ?? [
                        targetParentId,
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
                        parentSpaceId: targetParentId,
                        spaceLevelId: targetLevelId,
                    };
                    await updateSpace(submitData);
                    if (targetParentId) {
                        const ancestors = findAncestorsAndSelf(spaceData, targetParentId) ?? [
                            targetParentId,
                        ];
                        setExpandedRowKeys((prev) => Array.from(new Set([...prev, ...ancestors])));
                        manualExpandedKeysRef.current = Array.from(
                            new Set([...manualExpandedKeysRef.current, ...ancestors])
                        );
                    }
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
                spaceLevelOptions,
                isLevelDisabled,
                levelExtra,
                onLevelChange: handleLevelChange,

                spaceTreeData: parentSpaceTreeData,
                isParentDisabled,
                parentPlaceholder,
                parentExtra:
                    targetParentLevelNumber && targetParentLevelNumber > 0
                        ? t('spaceManagement.form.help.parentLevelHint', {
                              level: targetParentLevelNumber,
                              defaultValue: `Khu vực cha phải thuộc Cấp ${targetParentLevelNumber}.`,
                          })
                        : undefined,
                onParentChange: handleParentSpaceChange,
                validateParentSpace,
            }),
        [
            t,
            modalState.mode,
            spaceLevelOptions,
            isLevelDisabled,
            levelExtra,
            handleLevelChange,
            parentSpaceTreeData,
            isParentDisabled,
            parentPlaceholder,
            targetParentLevelNumber,
            handleParentSpaceChange,
            validateParentSpace,
        ]
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
                form={form}
                open={modalState.open}
                onOpenChange={(open) => {
                    setModalState((prev) => ({ ...prev, open }));
                    if (!open) {
                        setSelectedLevelId(null);
                    }
                }}
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
