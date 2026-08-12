import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { resetPasswordSchema } from '../authSchemas';
import { useResetPassword } from '../auth.api';
import { useApiErrorMessage } from '../../../hooks/useApiErrorMessage';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const getErrorMessage = useApiErrorMessage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const resetPassword = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: searchParams.get('token') ?? '' },
  });

  const onSubmit = handleSubmit(({ confirmPassword, ...payload }) => {
    resetPassword.mutate(payload, {
      onSuccess: () => {
        enqueueSnackbar(t('auth.passwordResetSignInAgain'), { variant: 'success' });
        navigate('/login');
      },
    });
  });

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        {t('auth.setNewPassword')}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {t('auth.resetLinkValidity')}
      </Typography>

      {resetPassword.isError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {getErrorMessage(resetPassword.error, t('auth.resetLinkInvalidOrExpired'))}
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField type="hidden" sx={{ display: 'none' }} {...register('token')} />
        <TextField
          label={t('auth.newPassword')}
          type="password"
          fullWidth
          autoFocus
          error={!!errors.newPassword}
          helperText={errors.newPassword ? t(errors.newPassword.message) : ''}
          {...register('newPassword')}
        />
        <TextField
          label={t('auth.confirmPassword')}
          type="password"
          fullWidth
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword ? t(errors.confirmPassword.message) : ''}
          {...register('confirmPassword')}
        />
        <Button type="submit" variant="contained" size="large" disabled={resetPassword.isPending}>
          {resetPassword.isPending ? t('auth.resettingPassword') : t('auth.resetPassword')}
        </Button>
      </Stack>

      <Stack direction="row" justifyContent="center" mt={2.5}>
        <Link component={RouterLink} to="/login" variant="body2">
          {t('auth.backToLogin')}
        </Link>
      </Stack>
    </Box>
  );
}
