import React from 'react';
import { useTranslation } from 'react-i18next';
import { ListScreen, PAGE_SIZE } from '../../components/ListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import { fetchWarehouses } from '../../api/domain.api';

export function AdminWarehousesScreen() {
  const { t } = useTranslation();

  return (
    <ListScreen
      title={t('warehouses.title')}
      queryKey={['warehouses']}
      queryFn={(page) => fetchWarehouses({ page, limit: PAGE_SIZE })}
      emptyIcon="warehouse"
      emptyTitleKey="warehouses.noWarehousesFound"
      renderItem={({ item }) => (
        <ListItemCard
          title={item.name}
          rows={[
            { label: t('warehouses.location'), value: item.city ?? item.address ?? '—' },
            { label: t('warehouses.capacity'), value: `${item.totalCapacity ?? '—'}` },
          ]}
        />
      )}
    />
  );
}
