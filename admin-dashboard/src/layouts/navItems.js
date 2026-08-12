import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import WarehouseIcon from '@mui/icons-material/WarehouseOutlined';
import GroupsIcon from '@mui/icons-material/GroupsOutlined';
import GrassIcon from '@mui/icons-material/GrassOutlined';
import Inventory2Icon from '@mui/icons-material/Inventory2Outlined';
import ScaleIcon from '@mui/icons-material/ScaleOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined';
import PaymentsIcon from '@mui/icons-material/PaymentsOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined';
import VideocamIcon from '@mui/icons-material/VideocamOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';

// requiredPermission is checked against GET /auth/permissions — a nav item
// with no requiredPermission is always shown (Dashboard, plus anything not
// yet covered by a dedicated permission module). This is UI politeness
// only; the backend's RbacGuard is the real enforcement point regardless.
//
// Settings, Employees, Reports, Audit Log, and Users & Roles are reached
// from the Profile page (avatar menu -> Profile) instead of the sidebar —
// keeps the sidebar to day-to-day operational modules. Notifications has
// no sidebar entry either since the header bell already opens it.
export const navItems = [
  { labelKey: 'nav.dashboard', path: '/dashboard', icon: DashboardIcon },
  { labelKey: 'nav.warehouses', path: '/warehouses', icon: WarehouseIcon, requiredPermission: { module: 'warehouses', action: 'read' } },
  { labelKey: 'nav.farmers', path: '/farmers', icon: GroupsIcon, requiredPermission: { module: 'farmers', action: 'read' } },
  { labelKey: 'nav.crops', path: '/crops', icon: GrassIcon, requiredPermission: { module: 'settings', action: 'read' } },
  { labelKey: 'nav.inventory', path: '/inventory', icon: Inventory2Icon, requiredPermission: { module: 'inventory', action: 'read' } },
  { labelKey: 'nav.weighbridge', path: '/weighbridge', icon: ScaleIcon, requiredPermission: { module: 'weighbridge', action: 'read' } },
  { labelKey: 'nav.billing', path: '/billing', icon: ReceiptLongIcon, requiredPermission: { module: 'billing', action: 'read' } },
  { labelKey: 'nav.payments', path: '/payments', icon: PaymentsIcon, requiredPermission: { module: 'payments', action: 'read' } },
  { labelKey: 'nav.dispatch', path: '/dispatch', icon: LocalShippingIcon, requiredPermission: { module: 'dispatch', action: 'read' } },
  { labelKey: 'nav.cctv', path: '/cctv', icon: VideocamIcon, requiredPermission: { module: 'cctv', action: 'read' } },
  { labelKey: 'nav.documents', path: '/documents', icon: FolderIcon, requiredPermission: { module: 'settings', action: 'read' } },
];
