import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Avatar, Badge, Box, Dialog, Divider, Drawer, IconButton, InputBase, List,
  ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Toolbar, Tooltip, Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/NotificationsOutlined';
import PersonIcon from '@mui/icons-material/PersonOutline';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { toggleThemeMode, toggleDrawer } from '../app/slices/uiSlice';
import { useLogout } from '../modules/auth/auth.api';
import { useMyPermissions } from '../modules/auth/auth.api';
import { navItems } from './navItems';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { AwmsLogo } from '../assets/AwmsLogo';
import { brandGradient } from '../theme/theme';

const DRAWER_WIDTH = 248;

function CommandPalette({ open, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => navItems.filter((item) => t(item.labelKey).toLowerCase().includes(query.toLowerCase())),
    [query, t],
  );

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <SearchIcon color="action" />
          <InputBase
            autoFocus
            fullWidth
            placeholder={t('layout.jumpToModulePlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Stack>
      </Box>
      <List sx={{ maxHeight: 360, overflowY: 'auto', py: 0.5 }}>
        {filtered.map((item) => {
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t(item.labelKey)} />
            </ListItemButton>
          );
        })}
        {filtered.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 3, textAlign: 'center' }}>
            {t('layout.noMatchingModule')}
          </Typography>
        )}
      </List>
    </Dialog>
  );
}

export function AppShell() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const themeMode = useAppSelector((s) => s.ui.themeMode);
  const drawerOpen = useAppSelector((s) => s.ui.drawerOpen);
  const user = useAppSelector((s) => s.auth.user);
  const logout = useLogout();
  useMyPermissions(true);
  const permissions = useAppSelector((s) => s.auth.permissions);

  const visibleNavItems = permissions
    ? navItems.filter((item) => !item.requiredPermission || permissions.some((p) => p.module === item.requiredPermission.module && p.action === item.requiredPermission.action))
    : navItems;

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton edge="start" onClick={() => dispatch(toggleDrawer())}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ mr: 2 }}>
            <AwmsLogo size={30} textSx={{ fontSize: '1.15rem' }} />
          </Box>

          <Box
            onClick={() => setPaletteOpen(true)}
            sx={{
              flexGrow: 1,
              maxWidth: 360,
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              color: 'text.secondary',
              cursor: 'pointer',
              '&:hover': { borderColor: 'text.secondary' },
            }}
          >
            <SearchIcon fontSize="small" />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {t('layout.searchModulesPlaceholder')}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              ⌘K
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <LanguageSwitcher />
          <Tooltip title={themeMode === 'light' ? t('layout.switchToDarkMode') : t('layout.switchToLightMode')}>
            <IconButton onClick={() => dispatch(toggleThemeMode())}>
              {themeMode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={t('layout.notifications')}>
            <IconButton component={RouterLink} to="/notifications">
              <Badge
                color="secondary"
                variant="dot"
                sx={{ '& .MuiBadge-dot': { animation: 'awmsPulse 2s ease-in-out infinite' } }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: 14,
                backgroundImage: brandGradient,
                color: '#fff',
                boxShadow: '0 4px 12px -3px rgba(11,31,26,0.5)',
              }}
            >
              <PersonIcon fontSize="small" />
            </Avatar>
          </IconButton>
          <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
            <MenuItem disabled>{user?.roleName ?? t('auth.unknownRole')}</MenuItem>
            <Divider />
            <MenuItem component={RouterLink} to="/profile" onClick={() => setMenuAnchor(null)}>
              {t('layout.profileAndPassword')}
            </MenuItem>
            <MenuItem onClick={logout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              {t('auth.signOut')}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <List sx={{ px: 1, py: 1.5 }}>
          {visibleNavItems.map((item) => {
            const selected = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <ListItemButton
                key={item.path}
                component={RouterLink}
                to={item.path}
                selected={selected}
                sx={{ borderRadius: 1.5, mb: 0.25 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={t(item.labelKey)}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: selected ? 700 : 500 }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, minWidth: 0 }}>
        <Toolbar />
        <Outlet />
      </Box>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </Box>
  );
}
