import { useState } from 'react';
import { Button, Grid, MenuItem, Stack, Tab, Tabs, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { FormDialog } from '../../components/FormDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { useEmployees, useCreateEmployee, useLeaveRequests, useDecideLeave } from './employees.api';
import { useUsers } from '../admin/admin.api';
import { apiErrorMessage } from '../../api/apiClient';

const employeeColumns = [
  { field: 'employeeCode', headerName: 'Code', width: 120 },
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160, valueGetter: (p) => p.row.user?.name },
  { field: 'designation', headerName: 'Designation', width: 160 },
  { field: 'shift', headerName: 'Shift', width: 160 },
  { field: 'joinDate', headerName: 'Joined', width: 130, valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleDateString() : '—') },
];

export function EmployeesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);

  const { data: employees, isLoading } = useEmployees();
  const { data: users } = useUsers(1, 100);
  const createEmployee = useCreateEmployee();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const { data: leaves, isLoading: loadingLeaves } = useLeaveRequests({ status: 'PENDING' });
  const decideLeave = useDecideLeave();

  const onCreate = handleSubmit((values) => {
    createEmployee.mutate(values, {
      onSuccess: () => { enqueueSnackbar('Employee added', { variant: 'success' }); setDialogOpen(false); reset(); },
      onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
    });
  });

  return (
    <>
      <PageHeader
        title="Employees"
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>Add employee</Button>}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Employees" />
        <Tab label="Pending leave requests" />
      </Tabs>

      {tab === 0 && (
        <DataTable
          rows={employees ?? []}
          columns={employeeColumns}
          loading={isLoading}
          rowCount={employees?.length ?? 0}
          paginationModel={{ page: 0, pageSize: 100 }}
          hideFooter
          emptyTitle="No employees yet"
        />
      )}

      {tab === 1 && (
        <DataTable
          rows={leaves?.items ?? leaves ?? []}
          columns={[
            { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 160, valueGetter: (p) => p.row.employee?.user?.name },
            { field: 'fromDate', headerName: 'From', width: 130, valueFormatter: (p) => new Date(p.value).toLocaleDateString() },
            { field: 'toDate', headerName: 'To', width: 130, valueFormatter: (p) => new Date(p.value).toLocaleDateString() },
            { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 160 },
            {
              field: 'actions', headerName: 'Actions', width: 200, sortable: false,
              renderCell: (p) => (
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => decideLeave.mutate({ id: p.row.id, status: 'APPROVED' })}>Approve</Button>
                  <Button size="small" color="error" onClick={() => decideLeave.mutate({ id: p.row.id, status: 'REJECTED' })}>Reject</Button>
                </Stack>
              ),
            },
          ]}
          loading={loadingLeaves}
          rowCount={(leaves?.items ?? leaves ?? []).length}
          paginationModel={{ page: 0, pageSize: 100 }}
          hideFooter
          emptyTitle="No pending leave requests"
        />
      )}

      <FormDialog open={dialogOpen} title="Add employee" onClose={() => setDialogOpen(false)} onSubmit={onCreate} loading={createEmployee.isPending}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField select label="User" required fullWidth defaultValue="" {...register('userId', { required: true })}>
              {(users?.items ?? []).map((u) => <MenuItem key={u.id} value={u.id}>{u.name} ({u.email ?? u.mobile})</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField label="Designation" fullWidth {...register('designation')} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Shift" fullWidth {...register('shift')} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Salary" type="number" fullWidth {...register('salary')} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Join date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('joinDate')} />
          </Grid>
        </Grid>
      </FormDialog>
    </>
  );
}
