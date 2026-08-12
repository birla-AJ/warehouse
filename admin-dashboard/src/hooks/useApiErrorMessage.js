import { useTranslation } from 'react-i18next';
import { apiErrorMessage } from '../api/apiClient';

const OUR_FALLBACK_KEYS = ['common.somethingWentWrong', 'common.networkError'];

/**
 * Wraps apiErrorMessage() with translation: our own fallback keys
 * ('common.networkError' etc.) get translated, while an actual message
 * from the backend response passes through unchanged — it's plain English
 * from the NestJS DTO layer, not an i18n key, so there's nothing to
 * translate (see apiClient.js docblock for why).
 */
export function useApiErrorMessage() {
  const { t } = useTranslation();
  return (error, fallback) => {
    const msg = apiErrorMessage(error, fallback);
    return OUR_FALLBACK_KEYS.includes(msg) ? t(msg) : msg;
  };
}
