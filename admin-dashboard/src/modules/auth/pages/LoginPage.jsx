import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, IconButton, InputAdornment, Link, Stack, TextField, Typography } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { loginSchema } from '../authSchemas';
import { useLogin } from '../auth.api';
import { apiErrorMessage } from '../../../api/apiClient';

export function LoginPage() {
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
    const parsed = loginSchema.parse(values);
    login.mutate(parsed, {
      onSuccess: () => {
        enqueueSnackbar('Welcome back', { variant: 'success' });
        navigate('/dashboard');
      },
    });
  });

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Sign in
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Use your email or mobile number to continue.
      </Typography>

      {login.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiErrorMessage(login.error, 'Invalid credentials')}
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField
          label="Email or mobile number"
          fullWidth
          autoFocus
          error={!!errors.identifier}
          helperText={errors.identifier?.message}
          {...register('identifier')}
        />
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          error={!!errors.password}
          helperText={errors.password?.message}
          {...register('password')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" tabIndex={-1}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button type="submit" variant="contained" size="large" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </Stack>

      <Stack direction="row" justifyContent="space-between" mt={2.5}>
        <Link component={RouterLink} to="/login/otp" variant="body2">
          Sign in with OTP instead
        </Link>
        <Link component={RouterLink} to="/forgot-password" variant="body2">
          Forgot password?
        </Link>
      </Stack>
    </Box>
  );
}
