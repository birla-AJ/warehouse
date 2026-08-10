import { Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import { PageHeader } from '../../components/PageHeader';
import { apiClient } from '../../api/apiClient';

const REPORTS = [
  { key: 'inventory', label: 'Inventory', description: 'All bags currently in storage.' },
  { key: 'farmers', label: 'Farmers', description: 'Bags, weight, and outstanding balance per farmer.' },
  { key: 'crops', label: 'Crops', description: 'Bag count and total weight by crop.' },
  { key: 'warehouses', label: 'Warehouse occupancy', description: 'Position occupancy per warehouse.' },
  { key: 'revenue', label: 'Revenue', description: 'All payments received.' },
  { key: 'pending-bills', label: 'Pending bills', description: 'Outstanding invoices.' },
  { key: 'damage', label: 'Damage', description: 'Bags marked damaged, with reported reason.' },
  { key: 'dispatch', label: 'Dispatch', description: 'Completed dispatches.' },
];

async function downloadReport(key, format) {
  const response = await apiClient.get(`/reports/${key}`, { params: { format }, responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${key}-report.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports" />
      <Grid container spacing={2}>
        {REPORTS.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.key}>
            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" fontWeight={700}>{report.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{report.description}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => downloadReport(report.key, 'csv')}
                    >
                      CSV
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<TableChartIcon />}
                      onClick={() => downloadReport(report.key, 'xlsx')}
                    >
                      Excel
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
