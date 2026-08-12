import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { forgotPasswordSchema } from '../authSchemas';
import { useForgotPassword } from '../auth.api';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const forgotPassword = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit((values) => forgotPassword.mutate(values.email));

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        {t('auth.resetPasswordTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {t('auth.resetPasswordSubtitle')}
      </Typography>

      {forgotPassword.isSuccess ? (
        <Alert severity="success" sx={{ borderRadius: 2 }}>{t('auth.resetLinkSent')}</Alert>
      ) : (
        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label={t('auth.email')}
              fullWidth
              autoFocus
              error={!!errors.email}
              helperText={errors.email ? t(errors.email.message) : ''}
              {...register('email')}
            />
            <Button type="submit" variant="contained" size="large" disabled={forgotPassword.isPending}>
              {forgotPassword.isPending ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
            </Button>
          </Stack>
        </Box>
      )}

      <Stack direction="row" justifyContent="center" mt={2.5}>
        <Link component={RouterLink} to="/login" variant="body2">
          {t('auth.backToLogin')}
        </Link>
      </Stack>
    </Box>
  );
}
