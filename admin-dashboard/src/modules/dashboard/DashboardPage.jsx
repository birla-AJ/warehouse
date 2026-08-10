import { Box, Card, CardContent, Grid, LinearProgress, Skeleton, Stack, Typography } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import GroupsIcon from '@mui/icons-material/Groups';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useDashboardSummary } from './dashboard.api';
import { occupancyColor } from '../../theme/theme';
import { StatCard } from '../../components/StatCard';
import { PageHeader } from '../../components/PageHeader';

const CHART_COLORS = ['#2B4C5C', '#C8963E', '#3F8F5F', '#B24A3D', '#87A3B3', '#8C6221'];

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || !data) {
    return (
      <Grid container spacing={2}>
        {[...Array(4)].map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rounded" height={120} />
          </Grid>
        ))}
      </Grid>
    );
  }

  const occupancy = data.warehouseOccupancy;

  return (
    <Stack spacing={3}>
      <PageHeader title="Overview" />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Today's revenue"
            value={formatCurrency(data.todayRevenue)}
            icon={<TrendingUpIcon />}
            sub={`${formatCurrency(data.monthlyRevenue)} this month`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Bags in storage"
            value={data.inventoryCount.toLocaleString('en-IN')}
            icon={<Inventory2Icon />}
            sub={`${data.todayEntries} received today`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Farmers"
            value={data.farmerCount.toLocaleString('en-IN')}
            icon={<GroupsIcon />}
            sub={`${data.todayDispatch} dispatches today`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Pending bills"
            value={formatCurrency(data.pendingBillsTotal)}
            icon={<ReceiptLongIcon />}
            sub={`${data.pendingBillsCount} invoice(s) outstanding`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Warehouse occupancy
              </Typography>
              <Stack direction="row" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="text.secondary">
                  {occupancy.occupiedPositions} of {occupancy.totalPositions} positions occupied
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {occupancy.occupancyPercent}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={occupancy.occupancyPercent}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    bgcolor:
                      occupancy.occupancyPercent > 90
                        ? occupancyColor.FULL
                        : occupancy.occupancyPercent > 50
                          ? occupancyColor.PARTIAL
                          : occupancyColor.EMPTY,
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {occupancy.availablePositions} positions available across all warehouses
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Crop distribution (in storage)
              </Typography>
              {data.cropDistribution.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No bags in storage yet.
                </Typography>
              ) : (
                <Box sx={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.cropDistribution}
                        dataKey="bagCount"
                        nameKey="cropName"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {data.cropDistribution.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
