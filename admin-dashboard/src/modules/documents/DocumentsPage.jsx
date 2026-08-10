import { useState } from 'react';
import { Alert, Button, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { FormDialog } from '../../components/FormDialog';
import { FileDropzone } from '../../components/FileDropzone';
import { usePaginationModel } from '../../hooks/usePaginationModel';
import { useDocuments, useUploadDocument } from './documents.api';
import { apiErrorMessage } from '../../api/apiClient';

const columns = [
  { field: 'type', headerName: 'Type', width: 160 },
  { field: 'fileName', headerName: 'File name', flex: 1, minWidth: 200 },
  { field: 'entityType', headerName: 'Linked to', width: 140 },
  { field: 'createdAt', headerName: 'Uploaded', width: 180, valueFormatter: (p) => new Date(p.value).toLocaleString() },
];

export function DocumentsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { paginationModel, setPaginationModel, page, limit } = usePaginationModel();
  const { data, isLoading } = useDocuments({ page, limit });
  const uploadDocument = useUploadDocument();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  const onUpload = handleSubmit((values) => {
    if (!file) {
      enqueueSnackbar('Choose a file first', { variant: 'warning' });
      return;
    }
    uploadDocument.mutate(
      { file, ...values },
      {
        onSuccess: () => {
          enqueueSnackbar('Document uploaded', { variant: 'success' });
          setDialogOpen(false);
          reset();
          setFile(null);
        },
        onError: (err) => enqueueSnackbar(apiErrorMessage(err, 'Upload failed — check AWS S3 is configured on the backend'), { variant: 'error' }),
      },
    );
  });

  return (
    <>
      <PageHeader
        title="Documents"
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>Upload document</Button>}
      />

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        rowCount={data?.meta?.total ?? 0}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        emptyTitle="No documents yet"
      />

      <FormDialog open={dialogOpen} title="Upload document" onClose={() => { setDialogOpen(false); setFile(null); }} onSubmit={onUpload} loading={uploadDocument.isPending}>
        <Stack spacing={2}>
          <Alert severity="info">
            The file uploads directly to S3 via a presigned URL, then only its metadata is registered here. Requires
            AWS S3 to be configured on the backend (<code>AWS_REGION</code>/<code>AWS_S3_BUCKET</code>).
          </Alert>
          <FileDropzone file={file} onFileSelected={setFile} onClear={() => setFile(null)} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField select label="Type" required fullWidth defaultValue="" {...register('type', { required: true })}>
                {['AADHAAR', 'PAN', 'INVOICE', 'GATE_PASS', 'QUALITY_REPORT', 'OTHER'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Farmer ID (optional)" fullWidth {...register('farmerId')} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Linked entity type (optional)" fullWidth placeholder="dispatch / bag / invoice" {...register('entityType')} />
            </Grid>
          </Grid>
        </Stack>
      </FormDialog>
    </>
  );
}
