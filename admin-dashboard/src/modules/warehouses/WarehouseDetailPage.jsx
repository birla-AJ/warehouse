import { useParams, Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, Grid, Skeleton, Stack, Typography } from '@mui/material';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { useWarehouse, useWarehouseLayout } from './warehouses.api';
import { WarehouseMap } from './WarehouseMap';
import PercentIcon from '@mui/icons-material/PercentOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import GridViewIcon from '@mui/icons-material/GridViewOutlined';

export function WarehouseDetailPage() {
  const { id } = useParams();
  const { data: warehouse, isLoading: loadingWarehouse } = useWarehouse(id);
  const { data: layout, isLoading: loadingLayout } = useWarehouseLayout(id);

  if (loadingWarehouse || !warehouse) {
    return <Skeleton variant="rounded" height={200} />;
  }

  const occupancy = layout?.occupancy;

  return (
    <Stack spacing={3}>
      <PageHeader
        title={warehouse.name}
        breadcrumbs={[{ label: 'Warehouses', to: '/warehouses' }, { label: warehouse.code }]}
      />

      {occupancy && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <StatCard label="Total positions" value={occupancy.totalPositions} icon={<GridViewIcon />} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard label="Occupied" value={occupancy.occupiedPositions} icon={<CheckCircleOutlineIcon />} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard label="Occupancy" value={`${occupancy.occupancyPercent}%`} icon={<PercentIcon />} />
          </Grid>
        </Grid>
      )}

      <Card>
        <CardContent>
          {loadingLayout ? <Skeleton variant="rounded" height={300} /> : <WarehouseMap warehouseId={id} layout={layout} />}
        </CardContent>
      </Card>
    </Stack>
  );
}
