import { useState } from 'react';
import { Alert, Button, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CameraAltIcon from '@mui/icons-material/CameraAltOutlined';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { FormDialog } from '../../components/FormDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { useCameras, useCreateCamera, useRequestSnapshot } from './cctv.api';
import { useWarehouses } from '../warehouses/warehouses.api';
import { apiErrorMessage } from '../../api/apiClient';

export function CctvPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { data: cameras, isLoading } = useCameras();
  const { data: warehouses } = useWarehouses(1, 100);
  const createCamera = useCreateCamera();
  const requestSnapshot = useRequestSnapshot();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const onCreate = handleSubmit((values) => {
    createCamera.mutate(values, {
      onSuccess: () => { enqueueSnackbar('Camera registered', { variant: 'success' }); setDialogOpen(false); reset(); },
      onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
    });
  });

  return (
    <>
      <PageHeader
        title="CCTV"
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>Add camera</Button>}
      />

      <Alert severity="info" sx={{ mb: 2 }}>
        Live video playback isn't wired up in this build — camera registry, health status, and motion alerts are.
        Streaming needs an RTSP-to-WebRTC bridge (e.g. MediaMTX) in front of the camera feeds.
      </Alert>

      {!isLoading && (cameras ?? []).length === 0 && (
        <EmptyState icon={<VideocamOffIcon sx={{ fontSize: 40 }} />} title="No cameras registered" actionLabel="Add camera" onAction={() => setDialogOpen(true)} />
      )}

      <Grid container spacing={2}>
        {(cameras ?? []).map((cam) => (
          <Grid item xs={12} sm={6} md={4} key={cam.id}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography variant="subtitle1" fontWeight={700}>{cam.name}</Typography>
                  <StatusBadge status={cam.status} />
                </Stack>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {cam.assignedTo ?? 'Unassigned location'}
                </Typography>
                <Button
                  size="small"
                  startIcon={<CameraAltIcon />}
                  onClick={() =>
                    requestSnapshot.mutate(cam.id, {
                      onSuccess: () => enqueueSnackbar('Snapshot requested', { variant: 'info' }),
                    })
                  }
                >
                  Request snapshot
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <FormDialog open={dialogOpen} title="Add camera" onClose={() => setDialogOpen(false)} onSubmit={onCreate} loading={createCamera.isPending}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField select label="Warehouse" required fullWidth defaultValue="" {...register('warehouseId', { required: true })}>
              {(warehouses?.items ?? []).map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField label="Camera name" required fullWidth {...register('name', { required: true })} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Assigned to (location)" fullWidth {...register('assignedTo')} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="RTSP URL" required fullWidth {...register('rtspUrl', { required: true })} />
          </Grid>
        </Grid>
      </FormDialog>
    </>
  );
}
