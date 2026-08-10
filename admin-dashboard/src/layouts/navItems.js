import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import WarehouseIcon from '@mui/icons-material/WarehouseOutlined';
import GroupsIcon from '@mui/icons-material/GroupsOutlined';
import GrassIcon from '@mui/icons-material/GrassOutlined';
import Inventory2Icon from '@mui/icons-material/Inventory2Outlined';
import ScaleIcon from '@mui/icons-material/ScaleOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined';
import PaymentsIcon from '@mui/icons-material/PaymentsOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined';
import AssessmentIcon from '@mui/icons-material/AssessmentOutlined';
import VideocamIcon from '@mui/icons-material/VideocamOutlined';
import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import NotificationsIcon from '@mui/icons-material/NotificationsOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import HistoryIcon from '@mui/icons-material/HistoryOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettingsOutlined';

// requiredPermission is checked against GET /auth/permissions — a nav item
// with no requiredPermission is always shown (Dashboard, plus anything not
// yet covered by a dedicated permission module). This is UI politeness
// only; the backend's RbacGuard is the real enforcement point regardless.
export const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
  { label: 'Warehouses', path: '/warehouses', icon: WarehouseIcon, requiredPermission: { module: 'warehouses', action: 'read' } },
  { label: 'Farmers', path: '/farmers', icon: GroupsIcon, requiredPermission: { module: 'farmers', action: 'read' } },
  { label: 'Crops', path: '/crops', icon: GrassIcon, requiredPermission: { module: 'settings', action: 'read' } },
  { label: 'Inventory', path: '/inventory', icon: Inventory2Icon, requiredPermission: { module: 'inventory', action: 'read' } },
  { label: 'Weighbridge', path: '/weighbridge', icon: ScaleIcon, requiredPermission: { module: 'weighbridge', action: 'read' } },
  { label: 'Billing', path: '/billing', icon: ReceiptLongIcon, requiredPermission: { module: 'billing', action: 'read' } },
  { label: 'Payments', path: '/payments', icon: PaymentsIcon, requiredPermission: { module: 'payments', action: 'read' } },
  { label: 'Dispatch', path: '/dispatch', icon: LocalShippingIcon, requiredPermission: { module: 'dispatch', action: 'read' } },
  { label: 'Reports', path: '/reports', icon: AssessmentIcon, requiredPermission: { module: 'reports', action: 'read' } },
  { label: 'CCTV', path: '/cctv', icon: VideocamIcon, requiredPermission: { module: 'cctv', action: 'read' } },
  { label: 'Employees', path: '/employees', icon: BadgeIcon, requiredPermission: { module: 'employees', action: 'read' } },
  { label: 'Notifications', path: '/notifications', icon: NotificationsIcon },
  { label: 'Documents', path: '/documents', icon: FolderIcon, requiredPermission: { module: 'settings', action: 'read' } },
  { label: 'Users & Roles', path: '/admin/users', icon: AdminPanelSettingsIcon, requiredPermission: { module: 'settings', action: 'update' } },
  { label: 'Settings', path: '/settings', icon: SettingsIcon, requiredPermission: { module: 'settings', action: 'read' } },
  { label: 'Audit Log', path: '/audit-log', icon: HistoryIcon, requiredPermission: { module: 'audit-log', action: 'read' } },
];
