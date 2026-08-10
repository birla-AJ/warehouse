import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Grid, InputAdornment, Stack, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { FormDialog } from '../../components/FormDialog';
import { usePaginationModel } from '../../hooks/usePaginationModel';
import { useFarmers, useCreateFarmer } from './farmers.api';
import { apiErrorMessage } from '../../api/apiClient';

const columns = [
  { field: 'farmerCode', headerName: 'Code', width: 120 },
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 180 },
  { field: 'village', headerName: 'Village', width: 140 },
  { field: 'mobile', headerName: 'Mobile', width: 130 },
  { field: 'aadhaarNumberMasked', headerName: 'Aadhaar', width: 150 },
];

export function FarmersListPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState('');
  const { paginationModel, setPaginationModel, page, limit } = usePaginationModel();
  const { data, isLoading } = useFarmers(page, limit, search || undefined);
  const createFarmer = useCreateFarmer();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const onCreate = handleSubmit((values) => {
    createFarmer.mutate(values, {
      onSuccess: () => {
        enqueueSnackbar('Farmer added', { variant: 'success' });
        setDialogOpen(false);
        reset();
      },
      onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
    });
  });

  return (
    <>
      <PageHeader
        title="Farmers"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Add farmer
          </Button>
        }
      />

      <TextField
        placeholder="Search by name, mobile, village, or code…"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 360 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
      />

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        rowCount={data?.meta?.total ?? 0}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        onRowClick={(params) => navigate(`/farmers/${params.id}`)}
        emptyTitle="No farmers yet"
        emptyDescription="Add a farmer to start recording intake, billing, and dispatch against them."
      />

      <FormDialog
        open={dialogOpen}
        title="Add farmer"
        onClose={() => setDialogOpen(false)}
        onSubmit={onCreate}
        loading={createFarmer.isPending}
        maxWidth="sm"
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Full name" required fullWidth autoFocus {...register('name', { required: true })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Mobile" required fullWidth {...register('mobile', { required: true })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Village" fullWidth {...register('village')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="District" fullWidth {...register('district')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Aadhaar (12 digits, optional)" fullWidth {...register('aadhaarNumber')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Bank account no. (optional)" fullWidth {...register('bankAccountNo')} />
          </Grid>
        </Grid>
      </FormDialog>
    </>
  );
}
