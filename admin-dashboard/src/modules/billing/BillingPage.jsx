import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Grid, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import PlayCircleIcon from '@mui/icons-material/PlayCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { FormDialog } from '../../components/FormDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { usePaginationModel } from '../../hooks/usePaginationModel';
import { useInvoices, useBillingRules, useCreateBillingRule, useGenerateInvoices } from './billing.api';
import { useCrops } from '../crops/crops.api';
import { apiErrorMessage } from '../../api/apiClient';

const invoiceColumns = [
  { field: 'invoiceNumber', headerName: 'Invoice #', width: 190 },
  { field: 'farmerName', headerName: 'Farmer', flex: 1, minWidth: 160, valueGetter: (_value, row) => row.farmer?.name },
  { field: 'periodFrom', headerName: 'From', width: 120, valueFormatter: (value) => new Date(value).toLocaleDateString() },
  { field: 'periodTo', headerName: 'To', width: 120, valueFormatter: (value) => new Date(value).toLocaleDateString() },
  { field: 'totalAmount', headerName: 'Total', width: 120 },
  { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusBadge status={p.value} /> },
];

export function BillingPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);

  const { paginationModel, setPaginationModel, page, limit } = usePaginationModel();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices({ page, limit });
  const { data: rules, isLoading: loadingRules } = useBillingRules();
  const { data: crops } = useCrops();

  const createRule = useCreateBillingRule();
  const generateInvoices = useGenerateInvoices();

  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const ruleForm = useForm();
  const generateForm = useForm();

  const onCreateRule = ruleForm.handleSubmit((values) => {
    createRule.mutate(
      {
        ...values,
        cropId: values.cropId || undefined,
        ratePerBagPerDay: values.ratePerBagPerDay ? Number(values.ratePerBagPerDay) : undefined,
        gstPercent: values.gstPercent ? Number(values.gstPercent) : undefined,
        isDefault: !!values.isDefault,
      },
      {
        onSuccess: () => { enqueueSnackbar('Billing rule created', { variant: 'success' }); setRuleDialogOpen(false); ruleForm.reset(); },
        onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
      },
    );
  });

  const onGenerate = generateForm.handleSubmit((values) => {
    generateInvoices.mutate(values, {
      onSuccess: (res) => {
        enqueueSnackbar(`Generated ${res.generated} invoice(s)`, { variant: 'success' });
        setGenerateDialogOpen(false);
        generateForm.reset();
      },
      onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
    });
  });

  return (
    <>
      <PageHeader
        title="Billing"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setRuleDialogOpen(true)}>New rule</Button>
            <Button variant="contained" startIcon={<PlayCircleIcon />} onClick={() => setGenerateDialogOpen(true)}>
              Generate invoices
            </Button>
          </Stack>
        }
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Invoices" />
        <Tab label="Billing rules" />
      </Tabs>

      {tab === 0 && (
        <DataTable
          rows={invoices?.items ?? []}
          columns={invoiceColumns}
          loading={loadingInvoices}
          rowCount={invoices?.meta?.total ?? 0}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          onRowClick={(params) => navigate(`/billing/invoices/${params.id}`)}
          emptyTitle="No invoices yet"
          emptyDescription="Generate invoices for a billing period once you have a default rule set up."
        />
      )}

      {tab === 1 && (
        <DataTable
          rows={rules ?? []}
          columns={[
            { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
            { field: 'cropName', headerName: 'Crop', width: 140, valueGetter: (_value, row) => row.crop?.name ?? 'All crops' },
            { field: 'ratePerBagPerDay', headerName: 'Rate/bag/day', width: 140 },
            { field: 'gstPercent', headerName: 'GST %', width: 100 },
            { field: 'isDefault', headerName: 'Default', width: 100, valueFormatter: (value) => (value ? 'Yes' : 'No') },
          ]}
          loading={loadingRules}
          rowCount={rules?.length ?? 0}
          paginationModel={{ page: 0, pageSize: 100 }}
          hideFooter
          emptyTitle="No billing rules yet"
        />
      )}

      <FormDialog open={ruleDialogOpen} title="New billing rule" onClose={() => setRuleDialogOpen(false)} onSubmit={onCreateRule} loading={createRule.isPending}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Name" required fullWidth autoFocus {...ruleForm.register('name', { required: true })} />
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Crop (blank = all)" fullWidth defaultValue="" {...ruleForm.register('cropId')}>
              <MenuItem value="">All crops (default rule)</MenuItem>
              {(crops ?? []).map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField label="Rate per bag/day" type="number" fullWidth {...ruleForm.register('ratePerBagPerDay')} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="GST %" type="number" fullWidth {...ruleForm.register('gstPercent')} />
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Is default rule?" fullWidth defaultValue="" {...ruleForm.register('isDefault')}>
              <MenuItem value="">No</MenuItem>
              <MenuItem value="1">Yes</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </FormDialog>

      <FormDialog open={generateDialogOpen} title="Generate invoices" onClose={() => setGenerateDialogOpen(false)} onSubmit={onGenerate} loading={generateInvoices.isPending} maxWidth="xs">
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Generates one invoice per farmer for bags currently in storage, for the selected period.
          </Typography>
          <TextField label="Period from" type="date" required fullWidth InputLabelProps={{ shrink: true }} {...generateForm.register('periodFrom', { required: true })} />
          <TextField label="Period to" type="date" required fullWidth InputLabelProps={{ shrink: true }} {...generateForm.register('periodTo', { required: true })} />
        </Stack>
      </FormDialog>
    </>
  );
}
