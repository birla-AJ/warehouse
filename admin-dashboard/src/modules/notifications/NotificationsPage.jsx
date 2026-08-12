import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { usePaginationModel } from '../../hooks/usePaginationModel';
import { useNotifications } from './notifications.api';

const columns = [
  { field: 'type', headerName: 'Type', width: 180 },
  { field: 'channel', headerName: 'Channel', width: 110 },
  { field: 'recipient', headerName: 'Recipient', width: 170 },
  { field: 'status', headerName: 'Status', width: 110, renderCell: (p) => <StatusBadge status={p.value} /> },
  { field: 'createdAt', headerName: 'Sent at', width: 190, valueFormatter: (value) => new Date(value).toLocaleString() },
];

export function NotificationsPage() {
  const { paginationModel, setPaginationModel, page, limit } = usePaginationModel();
  const { data, isLoading } = useNotifications({ page, limit });

  return (
    <>
      <PageHeader title="Notifications" />
      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        rowCount={data?.meta?.total ?? 0}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        emptyTitle="No notifications yet"
      />
    </>
  );
}
