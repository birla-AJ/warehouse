import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { resetPasswordSchema } from '../authSchemas';
import { useResetPassword } from '../auth.api';
import { apiErrorMessage } from '../../../api/apiClient';

export function ResetPasswordPage() {
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
        enqueueSnackbar('Password reset — please sign in again', { variant: 'success' });
        navigate('/login');
      },
    });
  });

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Set a new password
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        This link is valid for 30 minutes from when it was sent.
      </Typography>

      {resetPassword.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiErrorMessage(resetPassword.error, 'Reset link invalid or expired')}
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField type="hidden" sx={{ display: 'none' }} {...register('token')} />
        <TextField
          label="New password"
          type="password"
          fullWidth
          autoFocus
          error={!!errors.newPassword}
          helperText={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <TextField
          label="Confirm new password"
          type="password"
          fullWidth
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" variant="contained" size="large" disabled={resetPassword.isPending}>
          {resetPassword.isPending ? 'Resetting…' : 'Reset password'}
        </Button>
      </Stack>

      <Stack direction="row" justifyContent="center" mt={2.5}>
        <Link component={RouterLink} to="/login" variant="body2">
          Back to sign in
        </Link>
      </Stack>
    </Box>
  );
}
