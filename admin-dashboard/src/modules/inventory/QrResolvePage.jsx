import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useResolveQr } from './inventory.api';

export function QrResolvePage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const { data: bag, isError, isLoading } = useResolveQr(code);

  return (
    <Stack spacing={3}>
      <PageHeader title="Scan / Resolve QR" breadcrumbs={[{ label: 'Inventory', to: '/inventory' }, { label: 'Scan QR' }]} />

      <Card sx={{ maxWidth: 480 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Enter or paste a bag's QR code value to look it up. (Camera-based scanning needs HTTPS and camera
            permission — wire up a live scanner component here once deployed behind SSL.)
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="AWMS-BAG-00000001-A1B2C3"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button variant="contained" onClick={() => setCode(input.trim())}>
              Resolve
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {isError && <Alert severity="error">No bag found for this QR code.</Alert>}

      {bag && !isLoading && (
        <Card sx={{ maxWidth: 480, cursor: 'pointer' }} onClick={() => navigate(`/inventory/bags/${bag.id}`)}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight={700}>{bag.bagCode}</Typography>
              <StatusBadge status={bag.status} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {bag.farmer?.name} · {bag.crop?.name} · {bag.weightKg} kg
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {bag.position?.locationCode ?? 'Unassigned'}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
