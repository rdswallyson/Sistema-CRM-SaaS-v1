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
    
    // Groups
    getGroups: (params) => api.get('/church/groups', { params }),
    getGroup: (id) => api.get(`/church/groups/${id}`),
    createGroup: (data) => api.post('/church/groups', data),
    updateGroup: (id, data) => api.put(`/church/groups/${id}`, data),
    deleteGroup: (id) => api.delete(`/church/groups/${id}`),
    addGroupMembers: (id, memberIds) => api.post(`/church/groups/${id}/members`, { member_ids: memberIds }),
    removeGroupMember: (groupId, memberId) => api.delete(`/church/groups/${groupId}/members/${memberId}`),
    getGroupsStrategicDashboard: () => api.get('/church/groups/strategic-dashboard'),
    getGroupCategories: () => api.get('/church/group-categories'),
    createGroupCategory: (data) => api.post('/church/group-categories', data),
    updateGroupCategory: (id, data) => api.put(`/church/group-categories/${id}`, data),
    deleteGroupCategory: (id) => api.delete(`/church/group-categories/${id}`),

    // Ensino (Teaching)
    getEstudos: (params) => api.get('/church/estudos', { params }),
    getEstudo: (id) => api.get(`/church/estudos/${id}`),
    createEstudo: (data) => api.post('/church/estudos', data),
    updateEstudo: (id, data) => api.put(`/church/estudos/${id}`, data),
    deleteEstudo: (id) => api.delete(`/church/estudos/${id}`),

    getEscolas: (params) => api.get('/church/escolas', { params }),
    getEscola: (id) => api.get(`/church/escolas/${id}`),
    createEscola: (data) => api.post('/church/escolas', data),
    updateEscola: (id, data) => api.put(`/church/escolas/${id}`, data),
    deleteEscola: (id) => api.delete(`/church/escolas/${id}`),

    getTurmas: (params) => api.get('/church/turmas', { params }),
    getTurma: (id) => api.get(`/church/turmas/${id}`),
    createTurma: (data) => api.post('/church/turmas', data),
    updateTurma: (id, data) => api.put(`/church/turmas/${id}`, data),
    deleteTurma: (id) => api.delete(`/church/turmas/${id}`),
    addTurmaMembers: (id, memberIds) => api.post(`/church/turmas/${id}/membros`, { member_ids: memberIds }),
    removeTurmaMember: (turmaId, memberId) => api.delete(`/church/turmas/${turmaId}/membros/${memberId}`),

    getProgressoMembro: (memberId) => api.get(`/church/progresso-ensino/membro/${memberId}`),
    createProgresso: (data) => api.post('/church/progresso-ensino', data),
    updateProgresso: (id, data) => api.put(`/church/progresso-ensino/${id}`, data),
    deleteProgresso: (id) => api.delete(`/church/progresso-ensino/${id}`),

    getPainelAcademico: () => api.get('/church/ensino/painel-academico'),

    // Financial
    getFinContas: () => api.get('/church/fin/contas'),
    createFinConta: (data) => api.post('/church/fin/contas', data),
    updateFinConta: (id, data) => api.put(`/church/fin/contas/${id}`, data),
    deleteFinConta: (id) => api.delete(`/church/fin/contas/${id}`),

    getFinCategorias: (params) => api.get('/church/fin/categorias', { params }),
    createFinCategoria: (data) => api.post('/church/fin/categorias', data),
    updateFinCategoria: (id, data) => api.put(`/church/fin/categorias/${id}`, data),
    deleteFinCategoria: (id) => api.delete(`/church/fin/categorias/${id}`),

    getFinCentrosCusto: () => api.get('/church/fin/centros-custo'),
    createFinCentro: (data) => api.post('/church/fin/centros-custo', data),
    updateFinCentro: (id, data) => api.put(`/church/fin/centros-custo/${id}`, data),
    deleteFinCentro: (id) => api.delete(`/church/fin/centros-custo/${id}`),

    getFinContatos: (params) => api.get('/church/fin/contatos', { params }),
    createFinContato: (data) => api.post('/church/fin/contatos', data),
    updateFinContato: (id, data) => api.put(`/church/fin/contatos/${id}`, data),
    deleteFinContato: (id) => api.delete(`/church/fin/contatos/${id}`),

    getFinTransacoes: (params) => api.get('/church/fin/transacoes', { params }),
    getFinTransacao: (id) => api.get(`/church/fin/transacoes/${id}`),
    createFinTransacao: (data) => api.post('/church/fin/transacoes', data),
    updateFinTransacao: (id, data) => api.put(`/church/fin/transacoes/${id}`, data),
    deleteFinTransacao: (id) => api.delete(`/church/fin/transacoes/${id}`),

    getFinLogs: () => api.get('/church/fin/logs'),

    getFinPeriodosBloqueados: () => api.get('/church/fin/periodos-bloqueados'),
    createFinPeriodoBloqueado: (data) => api.post('/church/fin/periodos-bloqueados', data),
    deleteFinPeriodoBloqueado: (id) => api.delete(`/church/fin/periodos-bloqueados/${id}`),

    getFinResumo: () => api.get('/church/fin/resumo'),
    getFinPainelEstrategico: () => api.get('/church/fin/painel-estrategico'),
    importarTransacoes: (data) => api.post('/church/fin/importar', data),

    // Ministries (legacy)
    getMinistries: () => api.get('/church/ministries'),
    createMinistry: (data) => api.post('/church/ministries', data),
    updateMinistry: (id, data) => api.put(`/church/ministries/${id}`, data),
    deleteMinistry: (id) => api.delete(`/church/ministries/${id}`),
    
    // Events (Enhanced Agenda)
    getEvents: (params) => api.get('/church/events', { params }),
    getEvent: (id) => api.get(`/church/events/${id}`),
    createEvent: (data) => api.post('/church/events', data),
    updateEvent: (id, data) => api.put(`/church/events/${id}`, data),
    deleteEvent: (id) => api.delete(`/church/events/${id}`),
    eventCheckin: (eventId, memberId) => api.post(`/church/events/${eventId}/checkin?member_id=${memberId}`),
    
    // Event Inscriptions
    getEventInscricoes: (eventId) => api.get(`/church/events/${eventId}/inscricoes`),
    createEventInscricao: (eventId, data) => api.post(`/church/events/${eventId}/inscricoes`, data),
    deleteEventInscricao: (eventId, inscricaoId) => api.delete(`/church/events/${eventId}/inscricoes/${inscricaoId}`),
    confirmarPagamentoInscricao: (eventId, inscricaoId) => api.put(`/church/events/${eventId}/inscricoes/${inscricaoId}/confirmar-pagamento`),
    
    // Avisos (Announcements)
    getAvisos: (params) => api.get('/church/avisos', { params }),
    createAviso: (data) => api.post('/church/avisos', data),
    updateAviso: (id, data) => api.put(`/church/avisos/${id}`, data),
    deleteAviso: (id) => api.delete(`/church/avisos/${id}`),
    
    // Anotacoes (Personal Notes)
    getAnotacoes: () => api.get('/church/anotacoes'),
    createAnotacao: (data) => api.post('/church/anotacoes', data),
    updateAnotacao: (id, data) => api.put(`/church/anotacoes/${id}`, data),
    deleteAnotacao: (id) => api.delete(`/church/anotacoes/${id}`),
    
    // Notificacoes
    getNotificacoes: (params) => api.get('/church/notificacoes', { params }),
    getNotificacoesCount: () => api.get('/church/notificacoes/count'),
    marcarNotificacaoLida: (id) => api.put(`/church/notificacoes/${id}/lida`),
    marcarTodasLidas: () => api.put('/church/notificacoes/marcar-todas-lidas'),
    deleteNotificacao: (id) => api.delete(`/church/notificacoes/${id}`),
    
    // Calendario
    getCalendario: (params) => api.get('/church/calendario', { params }),
    
    // Agenda Export
    exportarEventos: (params) => api.get('/church/agenda/exportar/eventos', { params }),
    exportarInscricoes: (eventId) => api.get(`/church/agenda/exportar/inscricoes/${eventId}`),
    
    // Donations
    getDonations: () => api.get('/church/donations'),
    createDonation: (data) => api.post('/church/donations', data),
    getFinancialSummary: () => api.get('/church/financial/summary'),
    
    // Communication
    sendCommunication: (channel, recipientIds, message, subject) => 
        api.post('/church/communication/send', null, { 
            params: { channel, recipient_ids: recipientIds, message, subject } 
        }),

    // Patrimony
    getPatrimony: (params) => api.get('/church/patrimony', { params }),
    getPatrimonyItem: (id) => api.get(`/church/patrimony/${id}`),
    createPatrimony: (data) => api.post('/church/patrimony', data),
    updatePatrimony: (id, data) => api.put(`/church/patrimony/${id}`, data),
    movePatrimony: (id, data) => api.post(`/church/patrimony/${id}/move`, data),
    registerMaintenance: (id, data) => api.post(`/church/patrimony/${id}/maintenance`, data),
    getPatrimonyDashboard: () => api.get('/church/patrimony/dashboard/stats'),
    getPatrimonyCategories: () => api.get('/church/patrimony/categories'),
    createPatrimonyCategory: (data) => api.post('/church/patrimony/categories', data),
    getPatrimonyLocations: () => api.get('/church/patrimony/locations'),
    createPatrimonyLocation: (data) => api.post('/church/patrimony/locations', data),

    // Support
    getTickets: (params) => api.get('/support/tickets', { params }),
    getTicket: (id) => api.get(`/support/tickets/${id}`),
    createTicket: (data) => api.post('/support/tickets', data),
    addTicketMessage: (id, data) => api.post(`/support/tickets/${id}/messages`, data),
    getSLAConfigs: () => api.get('/support/sla-config'),
    saveSLAConfig: (data) => api.post('/support/sla-config', data),
    getSupportDashboard: () => api.get('/support/dashboard/stats'),
    getTutorials: () => api.get('/support/tutorials'),
    getKnowledgeBase: () => api.get('/support/knowledge-base'),
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
