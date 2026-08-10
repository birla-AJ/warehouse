import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';
import { AppHeader } from '../../components/AppHeader';
import { useAppTheme } from '../../hooks/useAppTheme';
import { downloadReport } from '../../api/domain.api';
import { arrayBufferToBase64 } from '../../utils/base64';
import { radius, spacing, typography } from '../../theme/theme';

const REPORT_KEYS = ['inventory', 'farmers', 'crops', 'warehouses', 'revenue', 'pending-bills', 'damage', 'dispatch'];

export function AdminReportsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [downloadingKey, setDownloadingKey] = useState(null);

  const handleExport = async (key, format) => {
    setDownloadingKey(`${key}-${format}`);
    try {
      const buffer = await downloadReport(key, format);
      const base64 = arrayBufferToBase64(buffer);
      const path = `${RNFS.DocumentDirectoryPath}/${key}-report.${format}`;
      await RNFS.writeFile(path, base64, 'base64');
      Alert.alert(t('common.confirm'), path);
    } catch {
      Alert.alert(t('common.somethingWentWrong'));
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={t('reports.title')} />
      <ScrollView contentContainerStyle={styles.list}>
        {REPORT_KEYS.map((key) => (
          <View key={key} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.bodyBold, { color: colors.text, marginBottom: spacing.sm }]}>
              {t(`reports.${toCamel(key)}`)}
            </Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.pill, { borderColor: colors.primary }]}
                onPress={() => handleExport(key, 'csv')}
                disabled={downloadingKey === `${key}-csv`}
              >
                <Icon name="file-delimited-outline" size={16} color={colors.primary} />
                <Text style={[typography.caption, { color: colors.primary, marginLeft: 4 }]}>{t('reports.exportCsv')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pill, { borderColor: colors.primary }]}
                onPress={() => handleExport(key, 'xlsx')}
                disabled={downloadingKey === `${key}-xlsx`}
              >
                <Icon name="file-excel-outline" size={16} color={colors.primary} />
                <Text style={[typography.caption, { color: colors.primary, marginLeft: 4 }]}>{t('reports.exportExcel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function toCamel(key) {
  return key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
