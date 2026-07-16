import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const STAFF_ROLES = ['super_admin', 'admin', 'it_manager', 'team_lead', 'technician', 'it_staff'];
const MANAGER_ROLES = ['super_admin', 'admin', 'it_manager'];

export function AuthProvider({ children }) {
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            api.get('/auth/me')
                .then(res => setUser(res.data))
                .catch(() => {
                    localStorage.removeItem('token');
                    delete api.defaults.headers.common['Authorization'];
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await api.post('auth/login', { email, password });
        const { token, user: userData } = res.data;
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        return userData;
    };

    const logout = async () => {
        try { await api.post('auth/logout'); } catch (e) { /* ignore */ }
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const hasRole = useCallback((role) => {
        if (!user) return false;
        const userRoles = user.roles?.map(r => r.name) || [user.role].filter(Boolean);
        if (Array.isArray(role)) return role.some(r => userRoles.includes(r));
        return userRoles.includes(role);
    }, [user]);

    const hasPermission = useCallback((permission) => {
        if (!user) return false;
        const permissions = user.permissions?.map(p => p.name) || [];
        return permissions.includes(permission);
    }, [user]);

    const isStaff = useCallback(() => hasRole(STAFF_ROLES), [hasRole]);
    const isManager = useCallback(() => hasRole(MANAGER_ROLES), [hasRole]);
    const isSuperAdmin = useCallback(() => hasRole('super_admin'), [hasRole]);

    const getUserRoleName = useCallback(() => {
        if (!user) return 'User';
        const roles = user.roles?.map(r => r.name) || [user.role].filter(Boolean);
        return roles[0]?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'User';
    }, [user]);

    return (
        <AuthContext.Provider value={{
            user, login, logout, loading,
            hasRole, hasPermission, isStaff, isManager, isSuperAdmin, getUserRoleName
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
