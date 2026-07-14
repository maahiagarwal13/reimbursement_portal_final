import { get, post, del } from './httpClient';

export const getVaultFiles = async (empId) => {
  return get(`/api/my-files/${empId}`);
};

export const uploadVaultFile = async (empId, fileType, file) => {
  const formData = new FormData();
  formData.append('empId', empId);
  formData.append('fileType', fileType || 'other');
  formData.append('file', file);

  return post('/api/my-files/upload', formData);
};

export const deleteVaultFile = async (id) => {
  return del(`/api/my-files/${id}`);
};
