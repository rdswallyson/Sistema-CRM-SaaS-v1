import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    const loadUser = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await authAPI.getMe();
            // Backend returns { success, data: { ...user } }
            const userData = response.data?.data || response.data;
            setUser(userData);
        } catch (error) {
            console.error('Failed to load user:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const login = async (email, password) => {
        const response = await authAPI.login(email, password);
        // Backend returns { success: true, data: { token, user, ... } }
        const responseData = response.data?.data || response.data;
        const newToken = responseData.token || responseData.access_token;
        const userData = responseData.user;
        
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        
        return userData;
    };

    const register = async (data) => {
        const response = await authAPI.register(data);
        // Backend returns { success: true, data: { token, user, ... } }
        const responseData = response.data?.data || response.data;
        const newToken = responseData.token || responseData.access_token;
        const userData = responseData.user;
        
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const isSuperAdmin = () => user?.role === 'super_admin';
    const isChurchAdmin = () => ['super_admin', 'admin_church'].includes(user?.role);
    const isTreasurer = () => ['super_admin', 'admin_church', 'treasurer'].includes(user?.role);
    const isMinistryLeader = () => ['super_admin', 'admin_church', 'ministry_leader'].includes(user?.role);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            register,
            logout,
            isSuperAdmin,
            isChurchAdmin,
            isTreasurer,
            isMinistryLeader,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;
