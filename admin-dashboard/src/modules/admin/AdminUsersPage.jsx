import { useState } from 'react';
import { Button, Checkbox, FormControlLabel, Grid, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { FormDialog } from '../../components/FormDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { usePaginationModel } from '../../hooks/usePaginationModel';
import { useUsers, useCreateUser, useRoles, usePermissions, useUpdateRolePermissions } from './admin.api';
import { apiErrorMessage } from '../../api/apiClient';

const userColumns = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
  { field: 'email', headerName: 'Email', width: 200 },
  { field: 'mobile', headerName: 'Mobile', width: 130 },
  { field: 'roleName', headerName: 'Role', width: 170, valueGetter: (p) => p.row.role?.name },
  { field: 'status', headerName: 'Status', width: 120, renderCell: (p) => <StatusBadge status={p.value} /> },
];

function RolePermissionsPanel() {
  const { data: roles } = useRoles();
  const { data: permissions } = usePermissions();
  const updateRole = useUpdateRolePermissions();
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const role = roles?.find((r) => r.id === selectedRoleId);
  const grantedIds = new Set((role?.permissions ?? []).map((rp) => rp.permission.id));

  const toggle = (permissionId, checked) => {
    const current = new Set(grantedIds);
    if (checked) current.add(permissionId);
    else current.delete(permissionId);
    updateRole.mutate({ roleId: selectedRoleId, permissionIds: Array.from(current) });
  };

  const byModule = (permissions ?? []).reduce((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  return (
    <Stack spacing={2}>
      <TextField select label="Role" value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} sx={{ maxWidth: 320 }}>
        {(roles ?? []).map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
      </TextField>

      {role?.isSystem && (
        <Typography variant="body2" color="warning.main">
          This is a system role — permissions are locked and cannot be edited here.
        </Typography>
      )}

      {selectedRoleId && !role?.isSystem && (
        <Grid container spacing={2}>
          {Object.entries(byModule).map(([module, perms]) => (
            <Grid item xs={12} sm={6} md={4} key={module}>
              <Typography variant="subtitle2" fontWeight={700} textTransform="capitalize" gutterBottom>
                {module}
              </Typography>
              <Stack>
                {perms.map((p) => (
                  <FormControlLabel
                    key={p.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={grantedIds.has(p.id)}
                        onChange={(e) => toggle(p.id, e.target.checked)}
                      />
                    }
                    label={p.action}
                  />
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}

export function AdminUsersPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);
  const { paginationModel, setPaginationModel, page, limit } = usePaginationModel();
  const { data, isLoading } = useUsers(page, limit);
  const { data: roles } = useRoles();
  const createUser = useCreateUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const onCreate = handleSubmit((values) => {
    createUser.mutate(values, {
      onSuccess: () => { enqueueSnackbar('User created', { variant: 'success' }); setDialogOpen(false); reset(); },
      onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
    });
  });

  return (
    <>
      <PageHeader
        title="Users & Roles"
        actions={tab === 0 && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>Add user</Button>}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Users" />
        <Tab label="Roles & permissions" />
      </Tabs>

      {tab === 0 && (
        <DataTable
          rows={data?.items ?? []}
          columns={userColumns}
          loading={isLoading}
          rowCount={data?.meta?.total ?? 0}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          emptyTitle="No users yet"
        />
      )}

      {tab === 1 && <RolePermissionsPanel />}

      <FormDialog open={dialogOpen} title="Add user" onClose={() => setDialogOpen(false)} onSubmit={onCreate} loading={createUser.isPending}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Name" required fullWidth autoFocus {...register('name', { required: true })} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Email" fullWidth {...register('email')} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Mobile" fullWidth {...register('mobile')} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Password" type="password" required fullWidth {...register('password', { required: true })} />
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Role" required fullWidth defaultValue="" {...register('roleId', { required: true })}>
              {(roles ?? []).map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
      </FormDialog>
    </>
  );
}
