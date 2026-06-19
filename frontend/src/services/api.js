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
      const path = window.location.pathname;
      const isAdminRoute = path.startsWith('/admin');
      const isLoginPage = path === '/admin/login';
      const isAuthCheck = error.config?.url === '/auth/me';
      if (isAdminRoute && !isLoginPage && !isAuthCheck) {
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
  submitEmail: (slug, email) => api.post(`/galleries/${slug}/submit-email`, { email }),

  listAll: () => api.get('/admin/galleries'),
  create: (data) => api.post('/admin/galleries', data),
  get: (id) => api.get(`/admin/galleries/${id}`),
  update: (id, data) => api.put(`/admin/galleries/${id}`, data),
  delete: (id) => api.delete(`/admin/galleries/${id}`),
  getAccessLogs: (id, page = 1, perPage = 50) => api.get(`/admin/galleries/${id}/access-logs`, { params: { page, per_page: perPage } })
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
  deleteAll: (galleryId) => api.delete(`/admin/galleries/${galleryId}/images`),
  regenerateThumbnails: (galleryId) => api.post(`/admin/galleries/${galleryId}/regenerate-thumbnails`),
  updateVisibility: (id, isHidden) => api.put(`/admin/images/${id}/visibility`, { is_hidden: isHidden }),
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

export const siteSettingsAPI = {
  getPublic: () => api.get('/site-settings'),
  get: () => api.get('/admin/site-settings'),
  update: (data) => api.put('/admin/site-settings', data),
  uploadFavicon: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/site-settings/favicon', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteFavicon: () => api.delete('/admin/site-settings/favicon')
};
