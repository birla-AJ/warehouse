import React from 'react';
import { useTranslation } from 'react-i18next';
import { ListScreen } from '../../components/ListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import { fetchFarmers } from '../../api/domain.api';

export function AdminFarmersScreen() {
  const { t } = useTranslation();

  return (
    <ListScreen
      title={t('farmers.title')}
      queryKey={['farmers']}
      queryFn={() => fetchFarmers({ page: 1, limit: 50 })}
      emptyIcon="account-group-outline"
      emptyTitleKey="farmers.noFarmersFound"
      renderItem={({ item }) => (
        <ListItemCard
          title={item.name}
          rows={[
            { label: t('farmers.farmerCode'), value: item.farmerCode },
            { label: t('farmers.mobile'), value: item.mobile },
            { label: t('farmers.village'), value: item.village ?? '—' },
          ]}
        />
      )}
    />
  );
}
