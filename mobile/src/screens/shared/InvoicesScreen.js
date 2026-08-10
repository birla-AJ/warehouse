import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ListScreen } from '../../components/ListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import { fetchInvoices } from '../../api/domain.api';
import { openPdf } from '../../utils/pdf';

export function InvoicesScreen() {
  const { t } = useTranslation();

  const handleDownload = async (invoice) => {
    try {
      await openPdf(`/invoices/${invoice.id}/pdf`, `${invoice.invoiceNumber}.pdf`);
    } catch {
      Alert.alert(t('common.somethingWentWrong'));
    }
  };

  return (
    <ListScreen
      title={t('invoices.title')}
      queryKey={['invoices']}
      queryFn={() => fetchInvoices({ page: 1, limit: 50 })}
      emptyIcon="file-document-outline"
      emptyTitleKey="invoices.noInvoicesFound"
      renderItem={({ item }) => (
        <TouchableOpacity activeOpacity={0.7} onPress={() => handleDownload(item)}>
          <ListItemCard
            title={item.invoiceNumber}
            status={item.status}
            rows={[
              { label: t('invoices.totalAmount'), value: `${t('common.rupee')}${item.totalAmount}` },
              {
                label: t('invoices.period'),
                value: `${new Date(item.periodFrom).toLocaleDateString()} - ${new Date(item.periodTo).toLocaleDateString()}`,
              },
              { label: t('invoices.downloadPdf'), value: '⬇' },
            ]}
          />
        </TouchableOpacity>
      )}
    />
  );
}
