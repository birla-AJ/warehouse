import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card, CardContent, Chip, Grid, MenuItem, Skeleton, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { FormDialog } from '../../components/FormDialog';
import { fontMono } from '../../theme/theme';
import {
  useBag, useMoveBag, useDamageBag, useAdjustBag, useQualityReports, useCreateQualityReport,
} from './inventory.api';
import { apiErrorMessage } from '../../api/apiClient';

function Field({ label, value }) {
  return (
    <Grid item xs={6} sm={4}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value ?? '—'}
      </Typography>
    </Grid>
  );
}

export function BagDetailPage() {
  const { id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { data: bag, isLoading } = useBag(id);
  const { data: reports } = useQualityReports(id);
  const moveBag = useMoveBag();
  const damageBag = useDamageBag();
  const createReport = useCreateQualityReport();

  const [moveOpen, setMoveOpen] = useState(false);
  const [damageOpen, setDamageOpen] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);

  const moveForm = useForm();
  const damageForm = useForm();
  const qualityForm = useForm();

  if (isLoading || !bag) return <Skeleton variant="rounded" height={300} />;

  const onMove = moveForm.handleSubmit((values) => {
    moveBag.mutate(
      { id, ...values },
      {
        onSuccess: () => { enqueueSnackbar('Bag moved', { variant: 'success' }); setMoveOpen(false); moveForm.reset(); },
        onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
      },
    );
  });

  const onDamage = damageForm.handleSubmit((values) => {
    damageBag.mutate(
      { id, ...values },
      {
        onSuccess: () => { enqueueSnackbar('Bag marked damaged', { variant: 'success' }); setDamageOpen(false); damageForm.reset(); },
        onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
      },
    );
  });

  const onQuality = qualityForm.handleSubmit((values) => {
    createReport.mutate(
      { bagId: id, ...values, moisture: values.moisture ? Number(values.moisture) : undefined },
      {
        onSuccess: () => { enqueueSnackbar('Quality report recorded', { variant: 'success' }); setQualityOpen(false); qualityForm.reset(); },
        onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
      },
    );
  });

  return (
    <Stack spacing={3}>
      <PageHeader
        title={bag.bagCode}
        breadcrumbs={[{ label: 'Inventory', to: '/inventory' }, { label: bag.bagCode }]}
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setQualityOpen(true)}>Add quality report</Button>
            <Button variant="outlined" onClick={() => setMoveOpen(true)} disabled={bag.status !== 'IN_STORAGE'}>Move</Button>
            <Button variant="outlined" color="error" onClick={() => setDamageOpen(true)} disabled={bag.status !== 'IN_STORAGE'}>
              Mark damaged
            </Button>
          </Stack>
        }
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight={700}>Details</Typography>
                <StatusBadge status={bag.status} />
              </Stack>
              <Grid container spacing={2}>
                <Field label="Farmer" value={bag.farmer?.name} />
                <Field label="Crop" value={bag.crop?.name} />
                <Field label="Bag type" value={bag.bagType?.label} />
                <Field label="Grade" value={bag.grade} />
                <Field label="Weight (kg)" value={bag.weightKg} />
                <Field label="Location" value={bag.position?.locationCode ?? 'Unassigned'} />
                <Field label="Received" value={new Date(bag.receivedAt).toLocaleDateString()} />
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Quality reports</Typography>
              {(reports?.items ?? []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">No quality reports recorded.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {reports.items.map((r) => (
                    <Stack key={r.id} direction="row" spacing={2} alignItems="center">
                      <Chip label={r.grade} size="small" />
                      <Typography variant="body2" color="text.secondary">
                        Moisture {r.moisture ?? '—'}% · {new Date(r.createdAt).toLocaleDateString()}
                      </Typography>
                      {r.remarks && <Typography variant="body2">— {r.remarks}</Typography>}
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>QR code</Typography>
              <QRCodeSVG value={bag.qrCode} size={160} />
              <Typography variant="caption" fontFamily={fontMono} display="block" mt={1.5}>
                {bag.qrCode}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <FormDialog open={moveOpen} title="Move bag" onClose={() => setMoveOpen(false)} onSubmit={onMove} loading={moveBag.isPending} maxWidth="xs">
        <Stack spacing={2}>
          <TextField label="New position ID" required autoFocus {...moveForm.register('toPositionId', { required: true })} />
          <TextField label="Note (optional)" {...moveForm.register('note')} />
        </Stack>
      </FormDialog>

      <FormDialog open={damageOpen} title="Mark bag as damaged" onClose={() => setDamageOpen(false)} onSubmit={onDamage} loading={damageBag.isPending} maxWidth="xs">
        <TextField label="Note" required fullWidth autoFocus {...damageForm.register('note', { required: true })} />
      </FormDialog>

      <FormDialog open={qualityOpen} title="Add quality report" onClose={() => setQualityOpen(false)} onSubmit={onQuality} loading={createReport.isPending}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField label="Moisture %" type="number" fullWidth {...qualityForm.register('moisture')} />
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Grade" required fullWidth defaultValue="A" {...qualityForm.register('grade', { required: true })}>
              {['PREMIUM', 'A', 'B', 'C', 'REJECTED'].map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Remarks" fullWidth multiline rows={2} {...qualityForm.register('remarks')} />
          </Grid>
        </Grid>
      </FormDialog>
    </Stack>
  );
}
