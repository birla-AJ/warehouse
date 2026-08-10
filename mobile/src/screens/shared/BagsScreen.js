import React from 'react';
import { useTranslation } from 'react-i18next';
import { ListScreen } from '../../components/ListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import { fetchBags } from '../../api/domain.api';

export function BagsScreen() {
  const { t } = useTranslation();

  return (
    <ListScreen
      title={t('bags.title')}
      queryKey={['bags']}
      queryFn={() => fetchBags({ page: 1, limit: 50 })}
      emptyIcon="package-variant-closed"
      emptyTitleKey="bags.noBagsFound"
      renderItem={({ item }) => (
        <ListItemCard
          title={item.bagCode}
          status={item.status}
          rows={[
            { label: t('bags.crop'), value: item.crop?.name ?? '—' },
            { label: t('bags.weight'), value: `${item.weightKg} ${t('common.kg')}` },
            { label: t('bags.position'), value: item.position?.code ?? '—' },
          ]}
        />
      )}
    />
  );
}
