import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Autocomplete, Button, Grid, Stack, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { FormDialog } from '../../components/FormDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { usePaginationModel } from '../../hooks/usePaginationModel';
import { useDispatches, useCreateDispatch } from './dispatch.api';
import { useFarmers } from '../farmers/farmers.api';
import { useBags } from '../inventory/inventory.api';
import { apiErrorMessage } from '../../api/apiClient';

const columns = [
  { field: 'dispatchNumber', headerName: 'Dispatch #', width: 190 },
  { field: 'farmerName', headerName: 'Farmer', flex: 1, minWidth: 160, valueGetter: (_value, row) => row.farmer?.name },
  { field: 'vehicleNo', headerName: 'Vehicle', width: 130 },
  { field: 'driverName', headerName: 'Driver', width: 140 },
  { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusBadge status={p.value} /> },
];

export function DispatchListPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { paginationModel, setPaginationModel, page, limit } = usePaginationModel();
  const { data, isLoading } = useDispatches({ page, limit });
  const { data: farmers } = useFarmers(1, 100);
  const createDispatch = useCreateDispatch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  const { data: bags } = useBags({ farmerId: selectedFarmer?.id, status: 'IN_STORAGE', limit: 100 });
  const { register, handleSubmit, control, reset } = useForm({ defaultValues: { bagIds: [] } });

  const onCreate = handleSubmit((values) => {
    createDispatch.mutate(
      { ...values, farmerId: selectedFarmer?.id, bagIds: values.bagIds.map((b) => b.id) },
      {
        onSuccess: () => {
          enqueueSnackbar('Dispatch initiated — OTP sent to farmer', { variant: 'success' });
          setDialogOpen(false);
          reset();
          setSelectedFarmer(null);
        },
        onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
      },
    );
  });

  return (
    <>
      <PageHeader
        title="Dispatch"
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>New dispatch</Button>}
      />

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        rowCount={data?.meta?.total ?? 0}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        onRowClick={(params) => navigate(`/dispatch/${params.id}`)}
        emptyTitle="No dispatches yet"
      />

      <FormDialog open={dialogOpen} title="New dispatch" onClose={() => setDialogOpen(false)} onSubmit={onCreate} loading={createDispatch.isPending}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              options={farmers?.items ?? []}
              getOptionLabel={(f) => `${f.name} (${f.farmerCode})`}
              value={selectedFarmer}
              onChange={(_, v) => setSelectedFarmer(v)}
              renderInput={(params) => <TextField {...params} label="Farmer" required />}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="bagIds"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  options={bags?.items ?? []}
                  getOptionLabel={(b) => `${b.bagCode} · ${b.crop?.name ?? ''}`}
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                  disabled={!selectedFarmer}
                  renderInput={(params) => <TextField {...params} label="Bags to dispatch" placeholder="Select bags" />}
                />
              )}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Vehicle number" required fullWidth {...register('vehicleNo', { required: true })} />
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Type" required fullWidth defaultValue="FULL" SelectProps={{ native: true }} {...register('dispatchType', { required: true })}>
              <option value="FULL">FULL</option>
              <option value="PARTIAL">PARTIAL</option>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField label="Driver name" required fullWidth {...register('driverName', { required: true })} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Driver mobile" required fullWidth {...register('driverMobile', { required: true })} />
          </Grid>
        </Grid>
      </FormDialog>
    </>
  );
}
