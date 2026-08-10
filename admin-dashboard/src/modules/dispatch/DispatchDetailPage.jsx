import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Button, Card, CardContent, Grid, List, ListItem, ListItemText, Skeleton, Stack, TextField, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useDispatch, useVerifyDispatchOtp, useCancelDispatch } from './dispatch.api';
import { apiErrorMessage } from '../../api/apiClient';
import { openPdfInNewTab } from '../../api/pdf';

export function DispatchDetailPage() {
  const { id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { data: dispatch, isLoading } = useDispatch(id);
  const verifyOtp = useVerifyDispatchOtp();
  const cancelDispatch = useCancelDispatch();
  const { register, handleSubmit, reset } = useForm();
  const [downloading, setDownloading] = useState(false);

  if (isLoading || !dispatch) return <Skeleton variant="rounded" height={300} />;

  const handleDownloadGatePass = async () => {
    setDownloading(true);
    try {
      await openPdfInNewTab(`/dispatch/${id}/gate-pass/pdf`, `${dispatch.dispatchNumber}-gate-pass.pdf`);
    } catch (error) {
      enqueueSnackbar(apiErrorMessage(error, 'Could not generate the gate pass PDF'), { variant: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  const onVerify = handleSubmit((values) => {
    const scannedBagCodes = values.scannedCodes
      ? values.scannedCodes.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
    verifyOtp.mutate(
      { id, otp: values.otp, scannedBagCodes },
      {
        onSuccess: () => { enqueueSnackbar('Dispatch completed', { variant: 'success' }); reset(); },
        onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
      },
    );
  });

  const onCancel = () => {
    cancelDispatch.mutate(id, {
      onSuccess: () => enqueueSnackbar('Dispatch cancelled', { variant: 'success' }),
      onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
    });
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title={dispatch.dispatchNumber}
        breadcrumbs={[{ label: 'Dispatch', to: '/dispatch' }, { label: dispatch.dispatchNumber }]}
        actions={
          <Stack direction="row" spacing={1.5} alignItems="center">
            {dispatch.status === 'COMPLETED' && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadGatePass}
                disabled={downloading}
              >
                {downloading ? 'Preparing…' : 'Gate Pass PDF'}
              </Button>
            )}
            <StatusBadge status={dispatch.status} />
          </Stack>
        }
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Details</Typography>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Farmer</Typography>
                  <Typography variant="body2" fontWeight={600}>{dispatch.farmer?.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Vehicle</Typography>
                  <Typography variant="body2" fontWeight={600}>{dispatch.vehicleNo}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Driver</Typography>
                  <Typography variant="body2" fontWeight={600}>{dispatch.driverName} · {dispatch.driverMobile}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body2" fontWeight={600}>{dispatch.dispatchType}</Typography>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Bags</Typography>
              <List dense>
                {dispatch.bags?.map(({ bag }) => (
                  <ListItem key={bag.id} disableGutters>
                    <ListItemText primary={bag.bagCode} secondary={`${bag.crop?.name ?? ''} · ${bag.weightKg} kg`} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          {dispatch.status === 'PENDING' && (
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Verify gate-release OTP</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  OTP was sent to the farmer's mobile when this dispatch was initiated.
                </Typography>
                <Stack component="form" onSubmit={onVerify} spacing={2}>
                  <TextField label="6-digit OTP" required autoFocus inputProps={{ maxLength: 6 }} {...register('otp', { required: true })} />
                  <TextField
                    label="Scanned bag QR codes (optional)"
                    placeholder="Comma-separated — leave blank to skip the scan cross-check"
                    multiline
                    rows={2}
                    {...register('scannedCodes')}
                  />
                  <Button type="submit" variant="contained" disabled={verifyOtp.isPending}>
                    {verifyOtp.isPending ? 'Verifying…' : 'Verify & release'}
                  </Button>
                  <Button color="error" onClick={onCancel} disabled={cancelDispatch.isPending}>
                    Cancel dispatch
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Stack>
  );
}
