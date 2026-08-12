import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ListScreen, PAGE_SIZE } from '../../components/ListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import { fetchDispatches } from '../../api/domain.api';
import { openPdf } from '../../utils/pdf';

export function DispatchScreen() {
  const { t } = useTranslation();

  const handlePress = async (dispatch) => {
    if (dispatch.status !== 'COMPLETED') return;
    try {
      await openPdf(`/dispatch/${dispatch.id}/gate-pass/pdf`, `${dispatch.dispatchNumber}.pdf`);
    } catch {
      Alert.alert(t('common.somethingWentWrong'), t('common.networkError'));
    }
  };

  return (
    <ListScreen
      title={t('dispatch.title')}
      queryKey={['dispatch']}
      queryFn={(page) => fetchDispatches({ page, limit: PAGE_SIZE })}
      emptyIcon="truck-outline"
      emptyTitleKey="dispatch.noDispatchesFound"
      renderItem={({ item }) => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handlePress(item)}
          disabled={item.status !== 'COMPLETED'}
          accessibilityRole="button"
          accessibilityLabel={`${t('dispatch.gatePass')} ${item.dispatchNumber}`}
        >
          <ListItemCard
            title={item.dispatchNumber}
            status={item.status}
            rows={[
              { label: t('dispatch.vehicleNo'), value: item.vehicleNo ?? '—' },
              { label: t('dispatch.driverName'), value: item.driverName ?? '—' },
            ]}
          />
        </TouchableOpacity>
      )}
    />
  );
}
