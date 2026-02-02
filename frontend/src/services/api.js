import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      if (isAdminRoute) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;


export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me')
};

export const galleriesAPI = {
  listPublic: () => api.get('/galleries'),
  getBySlug: (slug) => api.get(`/galleries/${slug}`),
  authenticate: (slug, password) => api.post(`/galleries/${slug}/authenticate`, { password }),

  listAll: () => api.get('/admin/galleries'),
  create: (data) => api.post('/admin/galleries', data),
  get: (id) => api.get(`/admin/galleries/${id}`),
  update: (id, data) => api.put(`/admin/galleries/${id}`, data),
  delete: (id) => api.delete(`/admin/galleries/${id}`)
};

export const imagesAPI = {
  upload: (galleryId, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(`/admin/galleries/${galleryId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
    });
  },
  delete: (id) => api.delete(`/admin/images/${id}`),
  updateOrder: (id, order) => api.put(`/admin/images/${id}/order`, { order })
};

export const downloadsAPI = {
  requestZip: (slug) => api.post(`/galleries/${slug}/download`),
  checkStatus: (taskId) => api.get(`/downloads/${taskId}/status`),
  downloadFile: (taskId) => `/api/downloads/${taskId}/file`
};

export const adminAPI = {
  getMetrics: () => api.get('/auth/admin/metrics'),
  getAuditLogs: (page = 1, perPage = 50) => api.get('/auth/admin/audit-logs', { params: { page, per_page: perPage } })
};
