import { useState } from 'react';
import { Button, Grid, IconButton, MenuItem, Stack, TextField, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { FormDialog } from '../../components/FormDialog';
import { usePaginationModel } from '../../hooks/usePaginationModel';
import { useWeighbridgeEntries, useCreateWeighbridgeEntry } from './weighbridge.api';
import { useFarmers } from '../farmers/farmers.api';
import { apiErrorMessage } from '../../api/apiClient';
import { openPdfInNewTab } from '../../api/pdf';
import { fontMono } from '../../theme/theme';

const columns = (onPrintSlip) => [
  { field: 'slipNumber', headerName: 'Slip #', width: 180, renderCell: (p) => <span style={{ fontFamily: fontMono }}>{p.value}</span> },
  { field: 'vehicleNo', headerName: 'Vehicle', width: 140 },
  { field: 'direction', headerName: 'Direction', width: 100 },
  { field: 'grossWeight', headerName: 'Gross', width: 100 },
  { field: 'tareWeight', headerName: 'Tare', width: 100 },
  { field: 'netWeight', headerName: 'Net', width: 100 },
  { field: 'createdAt', headerName: 'Time', width: 180, valueFormatter: (p) => new Date(p.value).toLocaleString() },
  {
    field: 'actions',
    headerName: '',
    width: 60,
    sortable: false,
    renderCell: (p) => (
      <Tooltip title="Print slip">
        <IconButton size="small" onClick={() => onPrintSlip(p.row)}>
          <PictureAsPdfIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ),
  },
];

export function WeighbridgePage() {
  const { enqueueSnackbar } = useSnackbar();
  const { paginationModel, setPaginationModel, page, limit } = usePaginationModel();
  const { data, isLoading } = useWeighbridgeEntries({ page, limit });
  const { data: farmers } = useFarmers(1, 100);
  const createEntry = useCreateWeighbridgeEntry();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const onCreate = handleSubmit((values) => {
    createEntry.mutate(
      { ...values, grossWeight: Number(values.grossWeight), tareWeight: Number(values.tareWeight) },
      {
        onSuccess: () => { enqueueSnackbar('Weighbridge entry recorded', { variant: 'success' }); setDialogOpen(false); reset(); },
        onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
      },
    );
  });

  const handlePrintSlip = async (entry) => {
    try {
      await openPdfInNewTab(`/weighbridge/entries/${entry.id}/slip/pdf`, `${entry.slipNumber}.pdf`);
    } catch (error) {
      enqueueSnackbar(apiErrorMessage(error, 'Could not generate the slip PDF'), { variant: 'error' });
    }
  };

  return (
    <>
      <PageHeader
        title="Weighbridge"
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>New entry</Button>}
      />

      <DataTable
        rows={data?.items ?? []}
        columns={columns(handlePrintSlip)}
        loading={isLoading}
        rowCount={data?.meta?.total ?? 0}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        emptyTitle="No weighbridge entries yet"
      />

      <FormDialog open={dialogOpen} title="New weighbridge entry" onClose={() => setDialogOpen(false)} onSubmit={onCreate} loading={createEntry.isPending}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField label="Vehicle number" required fullWidth autoFocus {...register('vehicleNo', { required: true })} />
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Direction" required fullWidth defaultValue="IN" {...register('direction', { required: true })}>
              <MenuItem value="IN">IN</MenuItem>
              <MenuItem value="OUT">OUT</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField label="Gross weight" type="number" required fullWidth {...register('grossWeight', { required: true })} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Tare weight" type="number" required fullWidth {...register('tareWeight', { required: true })} />
          </Grid>
          <Grid item xs={12}>
            <TextField select label="Farmer (optional)" fullWidth defaultValue="" {...register('farmerId')}>
              <MenuItem value="">—</MenuItem>
              {(farmers?.items ?? []).map((f) => (
                <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </FormDialog>
    </>
  );
}
