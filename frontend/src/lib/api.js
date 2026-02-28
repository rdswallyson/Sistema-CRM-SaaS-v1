import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (data) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
};

// Super Admin API
export const adminAPI = {
    // Tenants
    getTenants: () => api.get('/admin/tenants'),
    getTenant: (id) => api.get(`/admin/tenants/${id}`),
    createTenant: (data) => api.post('/admin/tenants', data),
    updateTenant: (id, data) => api.put(`/admin/tenants/${id}`, data),
    deleteTenant: (id) => api.delete(`/admin/tenants/${id}`),
    
    // Plans
    getPlans: () => api.get('/admin/plans'),
    createPlan: (data) => api.post('/admin/plans', data),
    
    // Promotions
    getPromotions: () => api.get('/admin/promotions'),
    createPromotion: (data) => api.post('/admin/promotions', data),
    
    // Metrics
    getMetrics: () => api.get('/admin/metrics'),
};

// Church API
export const churchAPI = {
    // Dashboard
    getDashboard: () => api.get('/church/dashboard'),
    
    // Members
    getMembers: (params = {}) => api.get('/church/members', { params }),
    getMember: (id) => api.get(`/church/members/${id}`),
    createMember: (data) => api.post('/church/members', data),
    updateMember: (id, data) => api.put(`/church/members/${id}`, data),
    deleteMember: (id) => api.delete(`/church/members/${id}`),
    getMemberBirthdays: (month) => api.get('/church/members/birthdays', { params: { month } }),
    
    // Member Categories
    getMemberCategories: () => api.get('/church/member-categories'),
    createMemberCategory: (data) => api.post('/church/member-categories', data),
    updateMemberCategory: (id, data) => api.put(`/church/member-categories/${id}`, data),
    deleteMemberCategory: (id) => api.delete(`/church/member-categories/${id}`),
    
    // Member Positions (Cargos)
    getMemberPositions: () => api.get('/church/member-positions'),
    createMemberPosition: (data) => api.post('/church/member-positions', data),
    updateMemberPosition: (id, data) => api.put(`/church/member-positions/${id}`, data),
    deleteMemberPosition: (id) => api.delete(`/church/member-positions/${id}`),
    
    // Custom Fields
    getCustomFields: () => api.get('/church/custom-fields'),
    createCustomField: (data) => api.post('/church/custom-fields', data),
    updateCustomField: (id, data) => api.put(`/church/custom-fields/${id}`, data),
    deleteCustomField: (id) => api.delete(`/church/custom-fields/${id}`),
    
    // Menu Customization
    getMenuCustomization: () => api.get('/church/menu-customization'),
    updateMenuCustomization: (items) => api.put('/church/menu-customization', items),
    
    // Departments (replaces Ministries)
    getDepartments: (params) => api.get('/church/departments', { params }),
    getDepartment: (id) => api.get(`/church/departments/${id}`),
    createDepartment: (data) => api.post('/church/departments', data),
    updateDepartment: (id, data) => api.put(`/church/departments/${id}`, data),
    deleteDepartment: (id) => api.delete(`/church/departments/${id}`),
    addDepartmentMembers: (id, memberIds) => api.post(`/church/departments/${id}/members`, { member_ids: memberIds }),
    removeDepartmentMember: (deptId, memberId) => api.delete(`/church/departments/${deptId}/members/${memberId}`),
    getDepartmentMembers: (id) => api.get(`/church/departments/${id}/members`),
    migrateMinistriesToDepartments: () => api.post('/migrate/ministries-to-departments'),
    
    // Ministries (legacy)
    getMinistries: () => api.get('/church/ministries'),
    createMinistry: (data) => api.post('/church/ministries', data),
    updateMinistry: (id, data) => api.put(`/church/ministries/${id}`, data),
    deleteMinistry: (id) => api.delete(`/church/ministries/${id}`),
    
    // Events
    getEvents: () => api.get('/church/events'),
    getEvent: (id) => api.get(`/church/events/${id}`),
    createEvent: (data) => api.post('/church/events', data),
    updateEvent: (id, data) => api.put(`/church/events/${id}`, data),
    deleteEvent: (id) => api.delete(`/church/events/${id}`),
    eventCheckin: (eventId, memberId) => api.post(`/church/events/${eventId}/checkin?member_id=${memberId}`),
    
    // Donations
    getDonations: () => api.get('/church/donations'),
    createDonation: (data) => api.post('/church/donations', data),
    getFinancialSummary: () => api.get('/church/financial/summary'),
    
    // Communication
    sendCommunication: (channel, recipientIds, message, subject) => 
        api.post('/church/communication/send', null, { 
            params: { channel, recipient_ids: recipientIds, message, subject } 
        }),
    getCommunicationHistory: () => api.get('/church/communication/history'),
    
    // Birthday Greetings
    getBirthdayTemplate: () => api.get('/church/birthday-greetings/template'),
    updateBirthdayTemplate: (data) => api.put('/church/birthday-greetings/template', data),
    getBirthdayGreetingStatus: () => api.get('/church/birthday-greetings/status'),
    sendBirthdayGreetings: () => api.post('/church/birthday-greetings/send'),
    
    // Discipleship
    getDiscipleshipTrails: () => api.get('/church/discipleship/trails'),
    getDiscipleshipTrail: (id) => api.get(`/church/discipleship/trails/${id}`),
    createDiscipleshipTrail: (data) => api.post('/church/discipleship/trails', data),
    updateDiscipleshipTrail: (id, data) => api.put(`/church/discipleship/trails/${id}`, data),
    deleteDiscipleshipTrail: (id) => api.delete(`/church/discipleship/trails/${id}`),
    addTrailStep: (trailId, stepData) => api.post(`/church/discipleship/trails/${trailId}/steps`, stepData),
    
    getDiscipleshipProgress: () => api.get('/church/discipleship/progress'),
    getMemberProgress: (memberId) => api.get(`/church/discipleship/progress/member/${memberId}`),
    enrollInTrail: (memberId, trailId, mentorId) => 
        api.post('/church/discipleship/enroll', null, { 
            params: { member_id: memberId, trail_id: trailId, mentor_id: mentorId } 
        }),
    completeTrailStep: (progressId, stepId) => 
        api.put(`/church/discipleship/progress/${progressId}/complete-step`, null, { 
            params: { step_id: stepId } 
        }),
    completeDiscipleshipTrail: (progressId) => api.put(`/church/discipleship/progress/${progressId}/complete`),
    
    getDiscipleshipStats: () => api.get('/church/discipleship/stats'),
    getMentorships: () => api.get('/church/discipleship/mentorship'),
    createMentorship: (data) => api.post('/church/discipleship/mentorship', data),
};

// Public API
export const publicAPI = {
    getPlans: () => api.get('/plans'),
    seedSuperAdmin: () => api.post('/seed/super-admin'),
    seedPlans: () => api.post('/seed/plans'),
    seedDiscipleshipTrails: () => api.post('/seed/discipleship-trails'),
};

// Payments API
export const paymentsAPI = {
    createCheckout: (planType, billingCycle) => 
        api.post('/payments/checkout', null, { 
            params: { plan_type: planType, billing_cycle: billingCycle },
            headers: { origin: window.location.origin }
        }),
    getPaymentStatus: (sessionId) => api.get(`/payments/status/${sessionId}`),
};

export default api;
