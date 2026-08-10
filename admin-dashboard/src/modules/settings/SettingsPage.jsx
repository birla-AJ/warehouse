import { useEffect } from 'react';
import { Button, Card, CardContent, Grid, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { useSettings, useUpsertSetting } from './settings.api';
import { apiErrorMessage } from '../../api/apiClient';

function findValue(settings, key) {
  return settings?.find((s) => s.key === key)?.value ?? {};
}

export function SettingsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { data: settings, isLoading } = useSettings();
  const upsert = useUpsertSetting();

  const companyForm = useForm();
  const taxForm = useForm();

  useEffect(() => {
    if (settings) {
      companyForm.reset(findValue(settings, 'company_profile'));
      taxForm.reset(findValue(settings, 'tax_defaults'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const saveCompany = companyForm.handleSubmit((values) => {
    upsert.mutate(
      { key: 'company_profile', value: values },
      {
        onSuccess: () => enqueueSnackbar('Company profile saved', { variant: 'success' }),
        onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
      },
    );
  });

  const saveTax = taxForm.handleSubmit((values) => {
    upsert.mutate(
      { key: 'tax_defaults', value: { gstPercent: Number(values.gstPercent) || 0, cessPercent: Number(values.cessPercent) || 0 } },
      {
        onSuccess: () => enqueueSnackbar('Tax defaults saved', { variant: 'success' }),
        onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
      },
    );
  });

  if (isLoading) return null;

  return (
    <Stack spacing={3}>
      <PageHeader title="Settings" />

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Company profile</Typography>
          <Stack component="form" onSubmit={saveCompany} spacing={2} sx={{ maxWidth: 480 }}>
            <TextField label="Legal name" {...companyForm.register('legalName')} />
            <TextField label="GST number" {...companyForm.register('gstNumber')} />
            <TextField label="Address" multiline rows={2} {...companyForm.register('address')} />
            <TextField label="Contact email" {...companyForm.register('contactEmail')} />
            <TextField label="Contact phone" {...companyForm.register('contactPhone')} />
            <Button type="submit" variant="contained" sx={{ alignSelf: 'flex-start' }} disabled={upsert.isPending}>
              Save
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Tax defaults</Typography>
          <Grid container spacing={2} sx={{ maxWidth: 480 }} component="form" onSubmit={saveTax}>
            <Grid item xs={6}>
              <TextField label="GST %" type="number" fullWidth {...taxForm.register('gstPercent')} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Cess %" type="number" fullWidth {...taxForm.register('cessPercent')} />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" disabled={upsert.isPending}>Save</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
