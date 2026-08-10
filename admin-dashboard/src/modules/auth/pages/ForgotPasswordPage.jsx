import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { forgotPasswordSchema } from '../authSchemas';
import { useForgotPassword } from '../auth.api';

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit((values) => forgotPassword.mutate(values.email));

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Reset your password
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Enter the email on your account and we'll send a reset link.
      </Typography>

      {forgotPassword.isSuccess ? (
        <Alert severity="success">{forgotPassword.data.message} — check your inbox for the reset link.</Alert>
      ) : (
        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Email"
              fullWidth
              autoFocus
              error={!!errors.email}
              helperText={errors.email?.message}
              {...register('email')}
            />
            <Button type="submit" variant="contained" size="large" disabled={forgotPassword.isPending}>
              {forgotPassword.isPending ? 'Sending…' : 'Send reset link'}
            </Button>
          </Stack>
        </Box>
      )}

      <Stack direction="row" justifyContent="center" mt={2.5}>
        <Link component={RouterLink} to="/login" variant="body2">
          Back to sign in
        </Link>
      </Stack>
    </Box>
  );
}
