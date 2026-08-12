import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Grid, MenuItem, Stack, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { FormDialog } from '../../components/FormDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { usePaginationModel } from '../../hooks/usePaginationModel';
import { useBags, useCreateBag } from './inventory.api';
import { useFarmers } from '../farmers/farmers.api';
import { useCrops, useBagTypes } from '../crops/crops.api';
import { apiErrorMessage } from '../../api/apiClient';
import { fontMono } from '../../theme/theme';

const columns = [
  { field: 'bagCode', headerName: 'Bag code', width: 150, renderCell: (p) => <span style={{ fontFamily: fontMono }}>{p.value}</span> },
  { field: 'farmerName', headerName: 'Farmer', flex: 1, minWidth: 160, valueGetter: (_value, row) => row.farmer?.name },
  { field: 'cropName', headerName: 'Crop', width: 130, valueGetter: (_value, row) => row.crop?.name },
  { field: 'grade', headerName: 'Grade', width: 90 },
  { field: 'weightKg', headerName: 'Weight (kg)', width: 120 },
  { field: 'locationCode', headerName: 'Location', width: 170, valueGetter: (_value, row) => row.position?.locationCode ?? 'Unassigned' },
  { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusBadge status={p.value} /> },
];

export function BagsListPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { paginationModel, setPaginationModel, page, limit } = usePaginationModel();
  const { data, isLoading } = useBags({ page, limit });
  const { data: farmers } = useFarmers(1, 100);
  const { data: crops } = useCrops();
  const { data: bagTypes } = useBagTypes();
  const createBag = useCreateBag();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const onCreate = handleSubmit((values) => {
    createBag.mutate(
      { ...values, weightKg: Number(values.weightKg) },
      {
        onSuccess: () => {
          enqueueSnackbar('Bag received', { variant: 'success' });
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
        title="Inventory — Bags"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<QrCode2Icon />} onClick={() => navigate('/inventory/qr')}>
              Scan QR
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Receive bag
            </Button>
          </Stack>
        }
      />

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        rowCount={data?.meta?.total ?? 0}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        onRowClick={(params) => navigate(`/inventory/bags/${params.id}`)}
        emptyTitle="No bags yet"
        emptyDescription="Receive a bag to place it into storage and start tracking it."
      />

      <FormDialog
        open={dialogOpen}
        title="Receive bag"
        onClose={() => setDialogOpen(false)}
        onSubmit={onCreate}
        loading={createBag.isPending}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField select label="Farmer" required fullWidth defaultValue="" {...register('farmerId', { required: true })}>
              {(farmers?.items ?? []).map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.name} ({f.farmerCode})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Crop" required fullWidth defaultValue="" {...register('cropId', { required: true })}>
              {(crops ?? []).map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Bag type" required fullWidth defaultValue="" {...register('bagTypeId', { required: true })}>
              {(bagTypes ?? []).map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField label="Weight (kg)" type="number" required fullWidth {...register('weightKg', { required: true })} />
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Grade" fullWidth defaultValue="A" {...register('grade')}>
              {['PREMIUM', 'A', 'B', 'C', 'REJECTED'].map((g) => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </FormDialog>
    </>
  );
}
