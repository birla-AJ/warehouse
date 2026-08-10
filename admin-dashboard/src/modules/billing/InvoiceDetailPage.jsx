import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Button, Card, CardContent, Divider, Grid, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useInvoice } from './billing.api';
import { openPdfInNewTab } from '../../api/pdf';
import { apiErrorMessage } from '../../api/apiClient';

export function InvoiceDetailPage() {
  const { id } = useParams();
  const { data: invoice, isLoading } = useInvoice(id);
  const { enqueueSnackbar } = useSnackbar();
  const [downloading, setDownloading] = useState(false);

  if (isLoading || !invoice) return <Skeleton variant="rounded" height={300} />;

  const lineItems = invoice.charges?.lineItems ?? [];

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await openPdfInNewTab(`/invoices/${id}/pdf`, `${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      enqueueSnackbar(apiErrorMessage(error, 'Could not generate the invoice PDF'), { variant: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title={invoice.invoiceNumber}
        breadcrumbs={[{ label: 'Billing', to: '/billing' }, { label: invoice.invoiceNumber }]}
        actions={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? 'Preparing…' : 'Download PDF'}
            </Button>
            <StatusBadge status={invoice.status} />
          </Stack>
        }
      />

      <Card>
        <CardContent>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Farmer</Typography>
              <Typography variant="body2" fontWeight={600}>{invoice.farmer?.name}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Period</Typography>
              <Typography variant="body2" fontWeight={600}>
                {new Date(invoice.periodFrom).toLocaleDateString()} – {new Date(invoice.periodTo).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Total</Typography>
              <Typography variant="body2" fontWeight={600}>{invoice.totalAmount}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">GST</Typography>
              <Typography variant="body2" fontWeight={600}>{invoice.gstAmount}</Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight={700} gutterBottom>Line items</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bag</TableCell>
                <TableCell>Crop</TableCell>
                <TableCell align="right">Days</TableCell>
                <TableCell align="right">Rate/day</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lineItems.map((item, i) => (
                <TableRow key={i}>
                  <TableCell>{item.bagCode}</TableCell>
                  <TableCell>{item.cropName}</TableCell>
                  <TableCell align="right">{item.days}</TableCell>
                  <TableCell align="right">{item.ratePerDay}</TableCell>
                  <TableCell align="right">{item.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Stack spacing={0.5} sx={{ mt: 2, ml: 'auto', maxWidth: 260 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography variant="body2">{invoice.subtotal}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">GST</Typography>
              <Typography variant="body2">{invoice.gstAmount}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Discount</Typography>
              <Typography variant="body2">-{invoice.discount}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Penalty</Typography>
              <Typography variant="body2">+{invoice.penalty}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle2" fontWeight={700}>Total</Typography>
              <Typography variant="subtitle2" fontWeight={700}>{invoice.totalAmount}</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
