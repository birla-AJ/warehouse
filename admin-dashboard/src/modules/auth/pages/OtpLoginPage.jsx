import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { otpRequestSchema, otpVerifySchema } from '../authSchemas';
import { useRequestOtp, useVerifyOtp } from '../auth.api';
import { useApiErrorMessage } from '../../../hooks/useApiErrorMessage';

export function OtpLoginPage() {
  const { t } = useTranslation();
  const getErrorMessage = useApiErrorMessage();
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
        enqueueSnackbar(t('auth.otpSentTo', { mobile: values.mobile }), { variant: 'success' });
      },
    });
  });

  const onVerify = verifyForm.handleSubmit((values) => {
    verifyOtp.mutate(values, {
      onSuccess: () => {
        enqueueSnackbar(t('auth.welcomeBack'), { variant: 'success' });
        navigate('/dashboard');
      },
    });
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        {t('auth.otpLoginTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {step === 'request' ? t('auth.otpRequestSubtitle') : t('auth.otpVerifySubtitle', { mobile })}
      </Typography>

      {step === 'request' ? (
        <Box component="form" onSubmit={onRequest} noValidate>
          {requestOtp.isError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {getErrorMessage(requestOtp.error, t('auth.couldNotSendOtp'))}
            </Alert>
          )}
          <Stack spacing={2}>
            <TextField
              label={t('auth.mobileNumber')}
              fullWidth
              autoFocus
              error={!!requestForm.formState.errors.mobile}
              helperText={requestForm.formState.errors.mobile ? t(requestForm.formState.errors.mobile.message) : ''}
              {...requestForm.register('mobile')}
            />
            <Button type="submit" variant="contained" size="large" disabled={requestOtp.isPending}>
              {requestOtp.isPending ? t('auth.sendingOtp') : t('auth.sendOtp')}
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box component="form" onSubmit={onVerify} noValidate>
          {verifyOtp.isError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {getErrorMessage(verifyOtp.error, t('auth.invalidOrExpiredOtp'))}
            </Alert>
          )}
          <Stack spacing={2}>
            <TextField
              label={t('auth.sixDigitOtp')}
              fullWidth
              autoFocus
              inputProps={{ maxLength: 6, inputMode: 'numeric' }}
              error={!!verifyForm.formState.errors.otp}
              helperText={verifyForm.formState.errors.otp ? t(verifyForm.formState.errors.otp.message) : ''}
              {...verifyForm.register('otp')}
            />
            <Button type="submit" variant="contained" size="large" disabled={verifyOtp.isPending}>
              {verifyOtp.isPending ? t('auth.verifyingOtp') : t('auth.verifyAndSignIn')}
            </Button>
            <Button variant="text" onClick={() => setStep('request')}>
              {t('auth.useDifferentNumber')}
            </Button>
          </Stack>
        </Box>
      )}

      <Stack direction="row" justifyContent="center" mt={2.5}>
        <Link component={RouterLink} to="/login" variant="body2">
          {t('auth.backToPasswordLogin')}
        </Link>
      </Stack>
    </Box>
  );
}
