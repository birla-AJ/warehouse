import React, { useState } from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ListScreen, PAGE_SIZE } from '../../components/ListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import { fetchInvoices } from '../../api/domain.api';
import { openPdf } from '../../utils/pdf';

export function InvoicesScreen() {
  const { t } = useTranslation();
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (invoice) => {
    if (downloadingId) return; // ignore taps on other rows mid-download
    setDownloadingId(invoice.id);
    try {
      await openPdf(`/invoices/${invoice.id}/pdf`, `${invoice.invoiceNumber}.pdf`);
    } catch {
      Alert.alert(t('common.somethingWentWrong'), t('common.networkError'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <ListScreen
      title={t('invoices.title')}
      queryKey={['invoices']}
      queryFn={(page) => fetchInvoices({ page, limit: PAGE_SIZE })}
      emptyIcon="file-document-outline"
      emptyTitleKey="invoices.noInvoicesFound"
      renderItem={({ item }) => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleDownload(item)}
          disabled={downloadingId === item.id}
          accessibilityRole="button"
          accessibilityLabel={`${t('invoices.downloadPdf')} ${item.invoiceNumber}`}
        >
          <ListItemCard
            title={item.invoiceNumber}
            status={item.status}
            rows={[
              { label: t('invoices.totalAmount'), value: `${t('common.rupee')}${item.totalAmount}` },
              {
                label: t('invoices.period'),
                value: `${new Date(item.periodFrom).toLocaleDateString()} - ${new Date(item.periodTo).toLocaleDateString()}`,
              },
              { label: t('invoices.downloadPdf'), value: downloadingId === item.id ? '…' : '⬇' },
            ]}
          />
        </TouchableOpacity>
      )}
    />
  );
}
