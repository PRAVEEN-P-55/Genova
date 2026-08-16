import axios from 'axios';

export const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('genova-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 1. Auth APIs
export const authApi = {
  login: async (role: string, email?: string, password?: string) => {
    const res = await apiClient.post('/auth/login', { role, email, password });
    if (res.data.token) {
      sessionStorage.setItem('genova-token', res.data.token);
    }
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  getDemoUsers: async () => {
    const res = await apiClient.get('/auth/demo-users');
    return res.data;
  },
};

// 2. Samples APIs
export const samplesApi = {
  getAll: async (params?: { site_id?: string; status?: string }) => {
    const res = await apiClient.get('/samples', { params });
    return res.data.samples;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/samples/${id}`);
    return res.data;
  },
  getStatus: async (id: string) => {
    const res = await apiClient.get(`/samples/${id}/status`);
    return res.data;
  },
  upload: async (formData: FormData) => {
    const res = await apiClient.post('/samples/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

// 3. Taxonomy APIs
export const taxonomyApi = {
  getBySampleId: async (sampleId: string, params?: { kingdom?: string; iucn_status?: string; is_invasive?: number }) => {
    const res = await apiClient.get(`/taxonomy/${sampleId}`, { params });
    return res.data.classifications;
  },
  getSpeciesDetail: async (classificationId: string) => {
    const res = await apiClient.get(`/taxonomy/species/${classificationId}`);
    return res.data.species;
  },
};

// 4. Biodiversity APIs
export const biodiversityApi = {
  getDashboard: async (site_id?: string) => {
    const res = await apiClient.get('/biodiversity/dashboard', { params: { site_id } });
    return res.data;
  },
  getAllSites: async () => {
    const res = await apiClient.get('/biodiversity/sites');
    return res.data.sites;
  },
};

// 5. Alerts APIs
export const alertsApi = {
  getAll: async (params?: { site_id?: string; severity?: string; is_resolved?: number }) => {
    const res = await apiClient.get('/alerts', { params });
    return res.data.alerts;
  },
  acknowledge: async (alertId: string) => {
    const res = await apiClient.post(`/alerts/${alertId}/acknowledge`);
    return res.data;
  },
  resolve: async (alertId: string) => {
    const res = await apiClient.post(`/alerts/${alertId}/resolve`);
    return res.data;
  },
};

// 6. Predictions APIs
export const predictionsApi = {
  getSitePrediction: async (siteId: string) => {
    const res = await apiClient.get(`/predictions/${siteId}`);
    return res.data.prediction;
  },
  simulate: async (data: { site_id: string; invasiveReductionPct: number; pollutionChangePct: number; reforestationPct: number }) => {
    const res = await apiClient.post('/predictions/simulate', data);
    return res.data.simulation_results;
  },
};

// 7. Assistant APIs
export const assistantApi = {
  chat: async (message: string) => {
    const res = await apiClient.post('/assistant/chat', { message });
    return res.data;
  },
  getHistory: async () => {
    const res = await apiClient.get('/assistant/history');
    return res.data.messages;
  },
};

// 8. Reports APIs
export const reportsApi = {
  getAll: async (params?: { site_id?: string; report_type?: string }) => {
    const res = await apiClient.get('/reports', { params });
    return res.data.reports;
  },
  generate: async (data: { title: string; report_type: string; site_id?: string; sample_id?: string }) => {
    const res = await apiClient.post('/reports/generate', data);
    return res.data.report;
  },
};
