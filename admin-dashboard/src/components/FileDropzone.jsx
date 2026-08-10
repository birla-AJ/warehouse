import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUploadOutlined';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFileOutlined';

export function FileDropzone({ onFileSelected, file, onClear, accept, label = 'Drag a file here, or click to browse' }) {
  const onDrop = useCallback(
    (accepted) => {
      if (accepted[0]) onFileSelected(accepted[0]);
    },
    [onFileSelected],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, multiple: false });

  if (file) {
    return (
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <InsertDriveFileIcon color="action" />
          <Typography variant="body2" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }} noWrap>
            {file.name}
          </Typography>
          <IconButton size="small" onClick={onClear}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '1.5px dashed',
        borderColor: isDragActive ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        cursor: 'pointer',
        bgcolor: isDragActive ? 'action.hover' : 'transparent',
        transition: 'all 120ms ease',
      }}
    >
      <input {...getInputProps()} />
      <CloudUploadIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.5 }} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
