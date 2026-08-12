import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { EmptyState } from './EmptyState';

/**
 * Wraps MUI X DataGrid with the conventions every module screen shares:
 * server-side pagination (rows/rowCount/page come from a React Query hook,
 * not local state), the built-in toolbar (search, column visibility,
 * density, CSV export — all free in the Community package), and a
 * consistent empty state instead of DataGrid's bare default.
 */
export function DataTable({
  rows,
  columns,
  loading,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  pageSizeOptions = [10, 20, 50, 100],
  onRowClick,
  getRowId,
  emptyTitle = 'No records yet',
  emptyDescription,
  height = 560,
  checkboxSelection = false,
  onRowSelectionModelChange,
  toolbar = true,
  ...rest
}) {
  return (
    <Box sx={{ height, width: '100%' }}>
      <DataGrid
        rows={rows ?? []}
        columns={columns}
        loading={loading}
        getRowId={getRowId}
        paginationMode="server"
        rowCount={rowCount ?? 0}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        pageSizeOptions={pageSizeOptions}
        onRowClick={onRowClick}
        checkboxSelection={checkboxSelection}
        onRowSelectionModelChange={onRowSelectionModelChange}
        disableRowSelectionOnClick
        slots={{
          toolbar: toolbar ? GridToolbar : null,
          noRowsOverlay: () => <EmptyState title={emptyTitle} description={emptyDescription} />,
        }}
        slotProps={{
          toolbar: { showQuickFilter: true, printOptions: { disableToolbarButton: true } },
        }}
        sx={{
          border: 'none',
          borderRadius: 3,
          '& .MuiDataGrid-columnHeaders': { borderRadius: 0, backgroundColor: 'action.hover' },
          '& .MuiDataGrid-row': {
            cursor: onRowClick ? 'pointer' : 'default',
            transition: 'background-color 140ms ease',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: (theme) =>
              theme.palette.mode === 'light' ? 'rgba(18,47,44,0.05)' : 'rgba(143,191,182,0.10)',
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
        }}
        {...rest}
      />
    </Box>
  );
}
