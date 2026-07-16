'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserGroup, GroupFormData } from '@/types/UserGroup';
import { GroupService } from '@/services/GroupService';
import { toast } from 'sonner';
import { getGroupTableColumns, GroupTableColumnProps } from './_components/Columns';
import { Button, Card, Table, TableProps } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PlusOutlined, ToolOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { EntityFormModal } from '../../../../../components/shared/FormModal';
import { getGroupFormFields } from './_components/groupFormConfig';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { useAntdTableScroll } from '@/hooks/useAntdTableScroll';
import { CategoryViewModal } from '../_components/CategoryViewModal';

const GroupListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: UserGroup | null;
    }>({ open: false, mode: 'create', data: null });
    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        data: UserGroup | null;
    }>({ open: false, data: null });

    const { t } = useTranslation();
    const { handleError } = useApiErrorHandler();
    const [loading, setLoading] = useState(true);
    const [groupData, setGroupData] = useState<UserGroup[]>([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    usePageTitle(t('electricManagement.electricOverview'));
    const { tableContainerRef, tableScrollY } = useAntdTableScroll();

    // Handle Edit Action
    const handleEditGroup = useCallback((group: UserGroup) => {
        setModalState({
            open: true,
            mode: 'edit',
            data: group,
        });
    }, []);

    const handleViewGroup = useCallback((group: UserGroup) => {
        setViewModalState({ open: true, data: group });
    }, []);

    // Handle Delete Action
    const handleDeleteGroup = useCallback(
        async (group: UserGroup) => {
            try {
                const groupId = group.groupId;
                await GroupService.deleteGroup(groupId);
                toast.success(t('groupManagement.deleteSuccess'));
                fetchGroupData();
            } catch (error) {
                console.error('Error deleting group:', error);
                handleError(error, { fallbackKey: 'groupManagement.deleteError' });
            }
        },
        [t, handleError]
    );

    const columnProps: GroupTableColumnProps = useMemo(
        () => ({
            onEdit: handleEditGroup,
            onView: handleViewGroup,
            onDelete: handleDeleteGroup,
            t,
        }),
        [handleEditGroup, handleViewGroup, handleDeleteGroup, t]
    );

    const columns = useMemo(() => getGroupTableColumns(columnProps), [columnProps]);

    const rowSelection: TableProps<UserGroup>['rowSelection'] = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys);
        },
        getCheckboxProps: () => ({
            disabled: true, // Change to false if you want to enable row selection
        }),
    };

    const fetchGroupData = async () => {
        try {
            setLoading(true);
            const response = await GroupService.getAllGroups();
            setGroupData(response);
        } catch (_error) {
            // console.error('Error fetching group data:', error);
            toast.error(t('groupManagement.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroupData();
    }, []);

    const handleSubmit = async (data: GroupFormData, mode: 'create' | 'edit') => {
        try {
            if (mode === 'create') {
                await GroupService.createGroup(data);
                toast.success(t('groupManagement.form.createSuccess'));
            } else {
                if (modalState.data?.groupId) {
                    const submitData = {
                        ...data,
                        groupId: modalState.data.groupId,
                    };
                    await GroupService.updateGroup(submitData);
                    toast.success(t('groupManagement.updateSuccess'));
                }
            }
            fetchGroupData();
        } catch (error) {
            console.error('Error submitting group:', error);
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'groupManagement.form.createError'
                        : 'groupManagement.updateError',
            });
            throw error;
        }
    };

    const formFields = useMemo(() => getGroupFormFields(t, modalState.mode), [t, modalState.mode]);

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
                title={t('groupManagement.title')}
                icon={<ToolOutlined />}
                loading={loading}
                rightContent={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalState({ open: true, mode: 'create', data: null })}
                        style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                    >
                        {t('groupManagement.addGroup')}
                    </Button>
                }
                rightContentMobile={
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<PlusOutlined />}
                        onClick={() => setModalState({ open: true, mode: 'create', data: null })}
                        aria-label={t('machineTypeManagement.addMachineType')}
                        style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                    />
                }
            />

            <Card
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                styles={{ body: {
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    paddingBottom: 0,
                } }}
            >
                <div
                    ref={tableContainerRef}
                    style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
                >
                    <Table<UserGroup>
                        columns={columns}
                        dataSource={groupData}
                        rowSelection={rowSelection}
                        loading={loading}
                        rowKey={(record) => record.groupId}
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
                        scroll={{ x: 'max-content', y: tableScrollY }}
                        style={{ height: '100%' }}
                        sticky
                        bordered
                    />
                </div>
            </Card>

            <EntityFormModal<GroupFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
                fields={formFields}
                title={{
                    create: t('groupManagement.form.createTitle'),
                    edit: t('groupManagement.form.editTitle'),
                }}
                description={{
                    create: t('groupManagement.form.createDescription'),
                    edit: t('groupManagement.form.editDescription'),
                }}
                buttonLabels={{
                    cancel: t('groupManagement.form.buttons.cancel'),
                    create: t('groupManagement.form.buttons.create'),
                    edit: t('groupManagement.form.buttons.update'),
                    saving: t('groupManagement.form.buttons.saving'),
                }}
                width={{ xs: '90%', sm: 550, md: 650 }}
                auditMetaData={modalState.data?.auditMetaData}
                t={t}
            />

            <CategoryViewModal
                open={viewModalState.open}
                title={viewModalState.data?.groupName || t('common.view')}
                onClose={() => setViewModalState({ open: false, data: null })}
                t={t}
                auditMetaData={viewModalState.data?.auditMetaData}
                items={[
                    {
                        key: 'groupId',
                        label: t('groupManagement.table.headers.groupId'),
                        children: viewModalState.data?.groupId ?? '-',
                    },
                    {
                        key: 'groupName',
                        label: t('groupManagement.table.headers.groupName'),
                        children: viewModalState.data?.groupName || '-',
                    },
                    {
                        key: 'description',
                        label: t('groupManagement.table.headers.description'),
                        children: viewModalState.data?.description || '-',
                    },
                ]}
            />
        </div>
    );
};

export default GroupListPage;
