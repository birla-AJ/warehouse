import { useState } from 'react';
import { Button, Grid, Stack, Tab, Tabs, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { FormDialog } from '../../components/FormDialog';
import { useCrops, useCreateCrop, useBagTypes, useCreateBagType } from './crops.api';
import { apiErrorMessage } from '../../api/apiClient';

const cropColumns = [
  { field: 'name', headerName: 'Crop', flex: 1, minWidth: 160 },
  { field: 'moisturePercent', headerName: 'Moisture %', width: 120 },
  { field: 'storageType', headerName: 'Storage type', width: 150 },
  { field: 'shelfLifeDays', headerName: 'Shelf life (days)', width: 150 },
  { field: 'defaultCharge', headerName: 'Default charge/day', width: 170 },
];

const bagTypeColumns = [
  { field: 'label', headerName: 'Label', flex: 1, minWidth: 160 },
  { field: 'weightKg', headerName: 'Weight (kg)', width: 140 },
];

export function CropsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);

  const { data: crops, isLoading: loadingCrops } = useCrops();
  const createCrop = useCreateCrop();
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const cropForm = useForm();

  const { data: bagTypes, isLoading: loadingBagTypes } = useBagTypes();
  const createBagType = useCreateBagType();
  const [bagTypeDialogOpen, setBagTypeDialogOpen] = useState(false);
  const bagTypeForm = useForm();

  const onCreateCrop = cropForm.handleSubmit((values) => {
    createCrop.mutate(
      {
        ...values,
        moisturePercent: values.moisturePercent ? Number(values.moisturePercent) : undefined,
        shelfLifeDays: values.shelfLifeDays ? Number(values.shelfLifeDays) : undefined,
        defaultCharge: values.defaultCharge ? Number(values.defaultCharge) : undefined,
      },
      {
        onSuccess: () => {
          enqueueSnackbar('Crop added', { variant: 'success' });
          setCropDialogOpen(false);
          cropForm.reset();
        },
        onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
      },
    );
  });

  const onCreateBagType = bagTypeForm.handleSubmit((values) => {
    createBagType.mutate(
      { ...values, weightKg: Number(values.weightKg) },
      {
        onSuccess: () => {
          enqueueSnackbar('Bag type added', { variant: 'success' });
          setBagTypeDialogOpen(false);
          bagTypeForm.reset();
        },
        onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
      },
    );
  });

  return (
    <>
      <PageHeader title="Crops & Bag Types" />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Crops" />
        <Tab label="Bag types" />
      </Tabs>

      {tab === 0 && (
        <>
          <Stack direction="row" justifyContent="flex-end" mb={1.5}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCropDialogOpen(true)}>
              Add crop
            </Button>
          </Stack>
          <DataTable
            rows={crops ?? []}
            columns={cropColumns}
            loading={loadingCrops}
            rowCount={crops?.length ?? 0}
            paginationModel={{ page: 0, pageSize: 100 }}
            hideFooter
            emptyTitle="No crops yet"
          />
        </>
      )}

      {tab === 1 && (
        <>
          <Stack direction="row" justifyContent="flex-end" mb={1.5}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setBagTypeDialogOpen(true)}>
              Add bag type
            </Button>
          </Stack>
          <DataTable
            rows={bagTypes ?? []}
            columns={bagTypeColumns}
            loading={loadingBagTypes}
            rowCount={bagTypes?.length ?? 0}
            paginationModel={{ page: 0, pageSize: 100 }}
            hideFooter
            emptyTitle="No bag types yet"
          />
        </>
      )}

      <FormDialog
        open={cropDialogOpen}
        title="Add crop"
        onClose={() => setCropDialogOpen(false)}
        onSubmit={onCreateCrop}
        loading={createCrop.isPending}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Crop name" required fullWidth autoFocus {...cropForm.register('name', { required: true })} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Moisture %" type="number" fullWidth {...cropForm.register('moisturePercent')} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Shelf life (days)" type="number" fullWidth {...cropForm.register('shelfLifeDays')} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Storage type" fullWidth {...cropForm.register('storageType')} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Default charge/day" type="number" fullWidth {...cropForm.register('defaultCharge')} />
          </Grid>
        </Grid>
      </FormDialog>

      <FormDialog
        open={bagTypeDialogOpen}
        title="Add bag type"
        onClose={() => setBagTypeDialogOpen(false)}
        onSubmit={onCreateBagType}
        loading={createBagType.isPending}
        maxWidth="xs"
      >
        <Stack spacing={2}>
          <TextField label="Label" required autoFocus placeholder="e.g. 50 KG" {...bagTypeForm.register('label', { required: true })} />
          <TextField label="Weight (kg)" type="number" required {...bagTypeForm.register('weightKg', { required: true })} />
        </Stack>
      </FormDialog>
    </>
  );
}
