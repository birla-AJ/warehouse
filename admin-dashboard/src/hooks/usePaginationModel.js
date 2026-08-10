import { useState } from 'react';

export function usePaginationModel(initialPageSize = 20) {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: initialPageSize });

  return {
    paginationModel,
    setPaginationModel,
    // backend query params (1-based page)
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
  };
}
