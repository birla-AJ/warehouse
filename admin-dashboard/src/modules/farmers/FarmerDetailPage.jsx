import { useParams } from 'react-router-dom';
import { Card, CardContent, Grid, Skeleton, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { useFarmer } from './farmers.api';
import { apiClient } from '../../api/apiClient';
import PaymentsIcon from '@mui/icons-material/PaymentsOutlined';
import Inventory2Icon from '@mui/icons-material/Inventory2Outlined';

function useFarmerOutstanding(id) {
  return useQuery({
    queryKey: ['farmers', id, 'outstanding'],
    queryFn: () => apiClient.get(`/farmers/${id}/outstanding`).then((r) => r.data),
    enabled: !!id,
  });
}

function Field({ label, value }) {
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value ?? '—'}
      </Typography>
    </Grid>
  );
}

export function FarmerDetailPage() {
  const { id } = useParams();
  const { data: farmer, isLoading } = useFarmer(id);
  const { data: outstanding } = useFarmerOutstanding(id);

  if (isLoading || !farmer) return <Skeleton variant="rounded" height={300} />;

  return (
    <Stack spacing={3}>
      <PageHeader
        title={farmer.name}
        breadcrumbs={[{ label: 'Farmers', to: '/farmers' }, { label: farmer.farmerCode }]}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <StatCard
            label="Outstanding balance"
            value={
              outstanding
                ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(outstanding.totalOutstanding)
                : '—'
            }
            icon={<PaymentsIcon />}
            sub={outstanding ? `${outstanding.invoices.length} invoice(s) pending` : undefined}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard label="Farmer code" value={farmer.farmerCode} icon={<Inventory2Icon />} />
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Profile
          </Typography>
          <Grid container spacing={2}>
            <Field label="Father's name" value={farmer.fatherName} />
            <Field label="Village" value={farmer.village} />
            <Field label="District" value={farmer.district} />
            <Field label="State" value={farmer.state} />
            <Field label="Mobile" value={farmer.mobile} />
            <Field label="Alternate mobile" value={farmer.altMobile} />
            <Field label="Email" value={farmer.email} />
            <Field label="Aadhaar" value={farmer.aadhaarNumberMasked} />
            <Field label="Bank account" value={farmer.bankAccountNoMasked} />
            <Field label="IFSC" value={farmer.bankIfsc} />
            <Field label="UPI ID" value={farmer.upiId} />
            <Field label="Nominee" value={farmer.nomineeName} />
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
