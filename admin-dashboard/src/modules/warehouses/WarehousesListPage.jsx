import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Stack, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { FormDialog } from '../../components/FormDialog';
import { usePaginationModel } from '../../hooks/usePaginationModel';
import { useWarehouses, useCreateWarehouse } from './warehouses.api';
import { apiErrorMessage } from '../../api/apiClient';

const columns = [
  { field: 'code', headerName: 'Code', width: 110, headerAlign: 'left' },
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 200 },
  { field: 'address', headerName: 'Address', flex: 1, minWidth: 220 },
  { field: 'capacityUnit', headerName: 'Unit', width: 100 },
  {
    field: 'totalCapacity', headerName: 'Capacity', width: 120,
    valueFormatter: (value) => Number(value).toLocaleString('en-IN'),
  },
];

export function WarehousesListPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { paginationModel, setPaginationModel, page, limit } = usePaginationModel();
  const { data, isLoading } = useWarehouses(page, limit);
  const createWarehouse = useCreateWarehouse();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const onCreate = handleSubmit((values) => {
    createWarehouse.mutate(
      { ...values, totalCapacity: values.totalCapacity ? Number(values.totalCapacity) : undefined },
      {
        onSuccess: () => {
          enqueueSnackbar('Warehouse created', { variant: 'success' });
          setDialogOpen(false);
          reset();
        },
        onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
      },
    );
  });

  return (
    <>
      <PageHeader
        title="Warehouses"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Add warehouse
          </Button>
        }
      />

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        rowCount={data?.meta?.total ?? 0}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        onRowClick={(params) => navigate(`/warehouses/${params.id}`)}
        emptyTitle="No warehouses yet"
        emptyDescription="Add your first warehouse to start building out zones, blocks, racks, and positions."
      />

      <FormDialog
        open={dialogOpen}
        title="Add warehouse"
        onClose={() => setDialogOpen(false)}
        onSubmit={onCreate}
        loading={createWarehouse.isPending}
      >
        <Stack spacing={2}>
          <TextField label="Name" required autoFocus {...register('name', { required: true })} />
          <TextField label="Code" required placeholder="e.g. WH1" {...register('code', { required: true })} />
          <TextField label="Address" multiline rows={2} {...register('address')} />
          <TextField label="Total capacity" type="number" {...register('totalCapacity')} />
        </Stack>
      </FormDialog>
    </>
  );
}
