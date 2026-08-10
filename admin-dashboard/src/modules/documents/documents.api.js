import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

export function useDocuments(params) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => apiClient.get('/documents', { params }).then((r) => r.data),
    keepPreviousData: true,
  });
}

export function useRegisterDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/documents/upload', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

/** Full upload flow: get a presigned S3 URL, PUT the file straight to S3, then register the metadata. */
export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, ...meta }) => {
      const { data: presigned } = await apiClient.post('/documents/upload-url', {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
      });
      await axios.put(presigned.uploadUrl, file, { headers: { 'Content-Type': file.type || 'application/octet-stream' } });
      const { data: document } = await apiClient.post('/documents/upload', {
        ...meta,
        fileUrl: presigned.fileUrl,
        fileName: file.name,
        mimeType: file.type,
      });
      return document;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}
