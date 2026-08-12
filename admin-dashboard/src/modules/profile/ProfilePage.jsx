import {
  Alert, Box, Button, Card, CardContent, Chip, Grid, List, ListItem, ListItemButton, ListItemIcon,
  ListItemSecondaryAction, ListItemText, Stack, TextField, Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import AssessmentIcon from '@mui/icons-material/AssessmentOutlined';
import HistoryIcon from '@mui/icons-material/HistoryOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { UserAvatar } from '../../components/UserAvatar';
import { PermissionGate } from '../../components/PermissionGate';
import { useAppSelector } from '../../hooks/redux';
import { useDevices, useRevokeDevice, useChangePassword, useLogout } from '../auth/auth.api';
import { apiErrorMessage } from '../../api/apiClient';
import { brandGradientSoft, brandGradientSoftDark } from '../../theme/theme';

/**
 * Workspace shortcuts consolidated here instead of the sidebar — Settings,
 * Employees, Reports, Audit Log, and Users & Roles are all
 * "manage the workspace" actions rather than day-to-day operational
 * screens, so they live one click away from the account menu. Each is
 * still gated by the same permission the old sidebar entry checked.
 */
const WORKSPACE_LINKS = [
  { label: 'Reports & analytics', description: 'Export inventory, revenue, and dispatch reports', to: '/reports', icon: AssessmentIcon, permission: { module: 'reports', action: 'read' } },
  { label: 'Employees', description: 'Staff directory, roles, and attendance', to: '/employees', icon: BadgeIcon, permission: { module: 'employees', action: 'read' } },
  { label: 'Users & roles', description: 'Manage accounts and permission roles', to: '/admin/users', icon: AdminPanelSettingsIcon, permission: { module: 'settings', action: 'update' } },
  { label: 'Company settings', description: 'Legal name, GST, tax defaults', to: '/settings', icon: SettingsIcon, permission: { module: 'settings', action: 'read' } },
  { label: 'Audit log', description: 'Full history of changes across AWMS', to: '/audit-log', icon: HistoryIcon, permission: { module: 'audit-log', action: 'read' } },
];

function WorkspaceLink({ label, description, to, icon: Icon }) {
  return (
    <ListItemButton
      component={RouterLink}
      to={to}
      sx={{
        borderRadius: 2,
        mb: 0.75,
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          backgroundImage: (theme) => (theme.palette.mode === 'light' ? brandGradientSoft : brandGradientSoftDark),
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>
        <Icon fontSize="small" color="primary" />
      </ListItemIcon>
      <ListItemText
        primary={label}
        secondary={description}
        primaryTypographyProps={{ fontWeight: 700, fontSize: 14.5 }}
        secondaryTypographyProps={{ fontSize: 12.5 }}
      />
      <ChevronRightIcon fontSize="small" color="disabled" />
    </ListItemButton>
  );
}

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

      {/* Identity banner */}
      <Card
        sx={{
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: (theme) => (theme.palette.mode === 'light' ? brandGradientSoft : brandGradientSoftDark),
        }}
      >
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <UserAvatar roleName={user?.roleName} size={68} />
            <Box sx={{ flexGrow: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" fontWeight={800}>{user?.roleName ?? 'Unknown role'}</Typography>
                <Chip label={user?.roleName ?? 'ROLE'} size="small" color="secondary" />
              </Stack>
              <Typography variant="body2" color="text.secondary">User ID: {user?.id}</Typography>
            </Box>
            <Button variant="outlined" color="error" onClick={logout}>
              Sign out
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Workspace shortcuts — replaces the removed Settings / Employees /
          Reports / Audit Log / Users & Roles sidebar entries */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Workspace
          </Typography>
          <List disablePadding>
            {WORKSPACE_LINKS.map((link) => (
              <PermissionGate key={link.to} module={link.permission.module} action={link.permission.action}>
                <WorkspaceLink {...link} />
              </PermissionGate>
            ))}
          </List>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Change password</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Changing your password signs you out of every other session — you'll need to sign in again here too.
              </Alert>
              <Stack component="form" onSubmit={onChangePassword} spacing={2}>
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
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Active sessions</Typography>
              {!isLoading && (
                <List dense disablePadding>
                  {(devices ?? []).map((d) => (
                    <ListItem
                      key={d.id}
                      disableGutters
                      sx={{
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-of-type': { borderBottom: 'none' },
                      }}
                    >
                      <ListItemText
                        primary={d.deviceName ?? 'Unknown device'}
                        secondary={`${d.ipAddress ?? ''} · last active ${new Date(d.lastActiveAt).toLocaleString()}`}
                        primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
                        secondaryTypographyProps={{ fontSize: 12.5 }}
                        sx={{ pr: 8 }}
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
        </Grid>
      </Grid>
    </Stack>
  );
}
