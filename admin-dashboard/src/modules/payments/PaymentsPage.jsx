import { useState } from 'react';
import { Button, Grid, MenuItem, Stack, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { FormDialog } from '../../components/FormDialog';
import { usePaginationModel } from '../../hooks/usePaginationModel';
import { usePayments, useCreatePayment, useRefundPayment } from './payments.api';
import { useFarmers } from '../farmers/farmers.api';
import { apiErrorMessage } from '../../api/apiClient';
import { fontMono } from '../../theme/theme';

export function PaymentsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { paginationModel, setPaginationModel, page, limit } = usePaginationModel();
  const { data, isLoading } = usePayments({ page, limit });
  const { data: farmers } = useFarmers(1, 100);
  const createPayment = useCreatePayment();
  const refundPayment = useRefundPayment();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState(null);
  const { register, handleSubmit, reset } = useForm();
  const refundForm = useForm();

  const onCreate = handleSubmit((values) => {
    createPayment.mutate(
      { ...values, amount: Number(values.amount), invoiceId: values.invoiceId || undefined },
      {
        onSuccess: () => { enqueueSnackbar('Payment recorded', { variant: 'success' }); setDialogOpen(false); reset(); },
        onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
      },
    );
  });

  const onRefund = refundForm.handleSubmit((values) => {
    refundPayment.mutate(
      { id: refundTarget.id, amount: Number(values.amount), note: values.note },
      {
        onSuccess: () => { enqueueSnackbar('Refund recorded', { variant: 'success' }); setRefundTarget(null); refundForm.reset(); },
        onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
      },
    );
  });

  const columns = [
    { field: 'receiptNo', headerName: 'Receipt #', width: 200, renderCell: (p) => <span style={{ fontFamily: fontMono }}>{p.value}</span> },
    { field: 'farmerName', headerName: 'Farmer', flex: 1, minWidth: 160, valueGetter: (_value, row) => row.farmer?.name },
    { field: 'invoiceNumber', headerName: 'Invoice', width: 180, valueGetter: (_value, row) => row.invoice?.invoiceNumber ?? '—' },
    { field: 'amount', headerName: 'Amount', width: 110 },
    { field: 'type', headerName: 'Type', width: 100 },
    { field: 'method', headerName: 'Method', width: 130 },
    { field: 'createdAt', headerName: 'Date', width: 180, valueFormatter: (value) => new Date(value).toLocaleString() },
    {
      field: 'actions', headerName: '', width: 100, sortable: false,
      renderCell: (p) =>
        p.row.type !== 'REFUND' && (
          <Button size="small" color="error" onClick={(e) => { e.stopPropagation(); setRefundTarget(p.row); }}>
            Refund
          </Button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>Record payment</Button>}
      />

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        rowCount={data?.meta?.total ?? 0}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        emptyTitle="No payments recorded yet"
      />

      <FormDialog open={dialogOpen} title="Record payment" onClose={() => setDialogOpen(false)} onSubmit={onCreate} loading={createPayment.isPending}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField select label="Farmer" required fullWidth defaultValue="" {...register('farmerId', { required: true })}>
              {(farmers?.items ?? []).map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField label="Invoice ID (optional)" fullWidth {...register('invoiceId')} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Amount" type="number" required fullWidth {...register('amount', { required: true })} />
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Method" required fullWidth defaultValue="CASH" {...register('method', { required: true })}>
              {['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField label="Reference no. (optional)" fullWidth {...register('referenceNo')} />
          </Grid>
        </Grid>
      </FormDialog>

      <FormDialog
        open={!!refundTarget}
        title={`Refund ${refundTarget?.receiptNo ?? ''}`}
        onClose={() => setRefundTarget(null)}
        onSubmit={onRefund}
        loading={refundPayment.isPending}
        maxWidth="xs"
      >
        <Stack spacing={2}>
          <TextField
            label="Refund amount"
            type="number"
            required
            autoFocus
            inputProps={{ max: refundTarget?.amount }}
            helperText={refundTarget ? `Original payment: ${refundTarget.amount}` : ''}
            {...refundForm.register('amount', { required: true })}
          />
          <TextField label="Note (optional)" {...refundForm.register('note')} />
        </Stack>
      </FormDialog>
    </>
  );
}
