import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { otpRequestSchema, otpVerifySchema } from '../authSchemas';
import { useRequestOtp, useVerifyOtp } from '../auth.api';
import { apiErrorMessage } from '../../../api/apiClient';

export function OtpLoginPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [step, setStep] = useState('request');
  const [mobile, setMobile] = useState('');

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  const requestForm = useForm({ resolver: zodResolver(otpRequestSchema) });
  const verifyForm = useForm({ resolver: zodResolver(otpVerifySchema) });

  const onRequest = requestForm.handleSubmit((values) => {
    requestOtp.mutate(values.mobile, {
      onSuccess: () => {
        setMobile(values.mobile);
        verifyForm.setValue('mobile', values.mobile);
        setStep('verify');
        enqueueSnackbar('OTP sent to your mobile', { variant: 'success' });
      },
    });
  });

  const onVerify = verifyForm.handleSubmit((values) => {
    verifyOtp.mutate(values, {
      onSuccess: () => {
        enqueueSnackbar('Welcome back', { variant: 'success' });
        navigate('/dashboard');
      },
    });
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Sign in with OTP
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {step === 'request' ? "We'll text a one-time code to your phone." : `Enter the 6-digit code sent to ${mobile}.`}
      </Typography>

      {step === 'request' ? (
        <Box component="form" onSubmit={onRequest} noValidate>
          {requestOtp.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiErrorMessage(requestOtp.error, 'Could not send OTP')}
            </Alert>
          )}
          <Stack spacing={2}>
            <TextField
              label="Mobile number"
              fullWidth
              autoFocus
              error={!!requestForm.formState.errors.mobile}
              helperText={requestForm.formState.errors.mobile?.message}
              {...requestForm.register('mobile')}
            />
            <Button type="submit" variant="contained" size="large" disabled={requestOtp.isPending}>
              {requestOtp.isPending ? 'Sending…' : 'Send OTP'}
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box component="form" onSubmit={onVerify} noValidate>
          {verifyOtp.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiErrorMessage(verifyOtp.error, 'Invalid or expired OTP')}
            </Alert>
          )}
          <Stack spacing={2}>
            <TextField
              label="6-digit OTP"
              fullWidth
              autoFocus
              inputProps={{ maxLength: 6, inputMode: 'numeric' }}
              error={!!verifyForm.formState.errors.otp}
              helperText={verifyForm.formState.errors.otp?.message}
              {...verifyForm.register('otp')}
            />
            <Button type="submit" variant="contained" size="large" disabled={verifyOtp.isPending}>
              {verifyOtp.isPending ? 'Verifying…' : 'Verify & sign in'}
            </Button>
            <Button variant="text" onClick={() => setStep('request')}>
              Use a different number
            </Button>
          </Stack>
        </Box>
      )}

      <Stack direction="row" justifyContent="center" mt={2.5}>
        <Link component={RouterLink} to="/login" variant="body2">
          Sign in with password instead
        </Link>
      </Stack>
    </Box>
  );
}
