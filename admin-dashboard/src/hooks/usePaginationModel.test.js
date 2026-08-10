import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePaginationModel } from './usePaginationModel';

describe('usePaginationModel', () => {
  it('defaults to page 1 (1-based) with the given page size', () => {
    const { result } = renderHook(() => usePaginationModel(20));
    expect(result.current.page).toBe(1);
    expect(result.current.limit).toBe(20);
  });

  it('converts MUI 0-based paginationModel.page to a 1-based page param', () => {
    const { result } = renderHook(() => usePaginationModel(20));

    act(() => {
      result.current.setPaginationModel({ page: 2, pageSize: 20 });
    });

    expect(result.current.page).toBe(3);
  });
});
