import { Alert, Button, Card, CardContent, List, ListItem, ListItemSecondaryAction, ListItemText, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { UserAvatar } from '../../components/UserAvatar';
import { useAppSelector } from '../../hooks/redux';
import { useDevices, useRevokeDevice, useChangePassword, useLogout } from '../auth/auth.api';
import { apiErrorMessage } from '../../api/apiClient';

export function ProfilePage() {
  const { enqueueSnackbar } = useSnackbar();
  const user = useAppSelector((s) => s.auth.user);
  const { data: devices, isLoading } = useDevices();
  const revokeDevice = useRevokeDevice();
  const changePassword = useChangePassword();
  const logout = useLogout();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onChangePassword = handleSubmit((values) => {
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          enqueueSnackbar('Password changed — please sign in again', { variant: 'success' });
          reset();
          logout();
        },
        onError: (err) => enqueueSnackbar(apiErrorMessage(err), { variant: 'error' }),
      },
    );
  });

  return (
    <Stack spacing={3}>
      <PageHeader title="Profile" />

      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <UserAvatar roleName={user?.roleName} size={56} />
            <div>
              <Typography variant="subtitle1" fontWeight={700}>{user?.roleName ?? 'Unknown role'}</Typography>
              <Typography variant="body2" color="text.secondary">User ID: {user?.id}</Typography>
            </div>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Change password</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Changing your password signs you out of every other session — you'll need to sign in again here too.
          </Alert>
          <Stack component="form" onSubmit={onChangePassword} spacing={2} sx={{ maxWidth: 380 }}>
            <TextField
              label="Current password"
              type="password"
              required
              error={!!errors.currentPassword}
              helperText={errors.currentPassword?.message}
              {...register('currentPassword', { required: 'Required' })}
            />
            <TextField
              label="New password"
              type="password"
              required
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message ?? 'At least 8 characters, with upper, lower, number, and symbol.'}
              {...register('newPassword', { required: 'Required', minLength: { value: 8, message: 'At least 8 characters' } })}
            />
            <Button type="submit" variant="contained" sx={{ alignSelf: 'flex-start' }} disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Updating…' : 'Update password'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Active sessions</Typography>
          {!isLoading && (
            <List dense>
              {(devices ?? []).map((d) => (
                <ListItem key={d.id} disableGutters>
                  <ListItemText
                    primary={d.deviceName ?? 'Unknown device'}
                    secondary={`${d.ipAddress ?? ''} · last active ${new Date(d.lastActiveAt).toLocaleString()}`}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => revokeDevice.mutate(d.id, { onSuccess: () => enqueueSnackbar('Session revoked', { variant: 'success' }) })}
                    >
                      Revoke
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
