import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, IconButton, InputAdornment, Link, Stack, TextField, Typography } from '@mui/material';
import { Visibility, VisibilityOff, PersonOutline, LockOutlined, ArrowForward } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { loginSchema } from '../authSchemas';
import { useLogin } from '../auth.api';
import { useApiErrorMessage } from '../../../hooks/useApiErrorMessage';

export function LoginPage() {
  const { t } = useTranslation();
  const getErrorMessage = useApiErrorMessage();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

const onSubmit = handleSubmit((values) => {

    login.mutate(values, {
      onSuccess: () => {
        enqueueSnackbar('Welcome back', { variant: 'success' });
        navigate('/dashboard');
      },
    });
  });

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        {t('auth.signIn')}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {t('auth.signInSubtitle')}
      </Typography>

      {login.isError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {getErrorMessage(login.error, t('auth.invalidCredentials'))}
        </Alert>
      )}

      <Stack spacing={2.25}>
        <TextField
          label={t('auth.emailOrMobile')}
          fullWidth
          autoFocus
          error={!!errors.identifier}
          helperText={errors.identifier ? t(errors.identifier.message) : ''}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonOutline sx={{ color: 'primary.main' }} fontSize="small" />
              </InputAdornment>
            ),
          }}
          {...register('identifier')}
        />
        <TextField
          label={t('auth.password')}
          type={showPassword ? 'text' : 'password'}
          fullWidth
          error={!!errors.password}
          helperText={errors.password ? t(errors.password.message) : ''}
          {...register('password')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlined sx={{ color: 'primary.main' }} fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((v) => !v)}
                  edge="end"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={login.isPending}
          endIcon={!login.isPending && <ArrowForward />}
          sx={{ py: 1.3, fontSize: 15.5 }}
        >
          {login.isPending ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </Stack>

      <Stack direction="row" justifyContent="space-between" mt={2.5}>
        <Link component={RouterLink} to="/login/otp" variant="body2" underline="hover" fontWeight={600}>
          {t('auth.signInWithOtpInstead')}
        </Link>
        <Link component={RouterLink} to="/forgot-password" variant="body2" underline="hover" fontWeight={600}>
          {t('auth.forgotPassword')}
        </Link>
      </Stack>
    </Box>
  );
}
