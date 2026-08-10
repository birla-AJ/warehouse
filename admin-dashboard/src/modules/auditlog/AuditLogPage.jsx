import { useState } from 'react';
import { Grid, MenuItem, TextField } from '@mui/material';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { usePaginationModel } from '../../hooks/usePaginationModel';
import { useAuditLogs } from './auditlog.api';
import { fontMono } from '../../theme/theme';

const MODULES = ['warehouses', 'farmers', 'crops', 'inventory', 'quality', 'weighbridge', 'billing', 'payments', 'dispatch', 'cctv', 'employees', 'settings'];

const columns = [
  { field: 'createdAt', headerName: 'Time', width: 190, valueFormatter: (p) => new Date(p.value).toLocaleString() },
  { field: 'module', headerName: 'Module', width: 130 },
  { field: 'action', headerName: 'Action', width: 100 },
  { field: 'entityId', headerName: 'Entity ID', width: 220, renderCell: (p) => <span style={{ fontFamily: fontMono, fontSize: 12 }}>{p.value}</span> },
  { field: 'ipAddress', headerName: 'IP', width: 130 },
];

export function AuditLogPage() {
  const [moduleFilter, setModuleFilter] = useState('');
  const { paginationModel, setPaginationModel, page, limit } = usePaginationModel(50);
  const { data, isLoading } = useAuditLogs({ page, limit, module: moduleFilter || undefined });

  return (
    <>
      <PageHeader title="Audit Log" />

      <Grid container spacing={2} sx={{ mb: 2, maxWidth: 320 }}>
        <Grid item xs={12}>
          <TextField select label="Module" fullWidth size="small" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
            <MenuItem value="">All modules</MenuItem>
            {MODULES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        rowCount={data?.meta?.total ?? 0}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[25, 50, 100, 200]}
        emptyTitle="No audit log entries for this filter"
      />
    </>
  );
}
