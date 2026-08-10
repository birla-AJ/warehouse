import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ListScreen } from '../../components/ListScreen';
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
      // Silently ignore — a toast/snackbar library isn't wired up in this
      // scaffold; add one (e.g. react-native-toast-message) if you want
      // inline error feedback here instead of nothing happening.
    }
  };

  return (
    <ListScreen
      title={t('dispatch.title')}
      queryKey={['dispatch']}
      queryFn={() => fetchDispatches({ page: 1, limit: 50 })}
      emptyIcon="truck-outline"
      emptyTitleKey="dispatch.noDispatchesFound"
      renderItem={({ item }) => (
        <TouchableOpacity activeOpacity={0.7} onPress={() => handlePress(item)}>
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
