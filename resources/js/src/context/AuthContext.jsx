import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

/**
 * Roles with staff-level access (fallback when permission list is unavailable).
 * These are NOT used as the sole source of truth — backend permissions take priority.
 */
const STAFF_ROLES    = ['super_admin', 'admin', 'it_manager', 'team_lead', 'technician', 'it_staff'];
const MANAGER_ROLES  = ['super_admin', 'admin', 'it_manager'];

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

    /**
     * Check if the current user has a specific role (or one from an array).
     * Handles both string[] and [{name:...}] role formats from the backend.
     */
    const hasRole = useCallback((role) => {
        if (!user) return false;
        const userRoles = Array.isArray(user.roles)
            ? user.roles.map(r => (typeof r === 'string' ? r : r.name)).filter(Boolean)
            : [user.role].filter(Boolean);
        if (Array.isArray(role)) return role.some(r => userRoles.includes(r));
        return userRoles.includes(role);
    }, [user]);

    /**
     * Check if the current user has a specific permission.
     * Permissions are loaded from the backend at login/me endpoint.
     * Super Admin bypasses all permission checks (has all permissions).
     */
    const hasPermission = useCallback((permission) => {
        if (!user) return false;
        // Super admin bypass
        if (hasRole('super_admin') || hasRole('admin')) return true;
        const permissions = Array.isArray(user.permissions)
            ? user.permissions.map(p => (typeof p === 'string' ? p : p.name)).filter(Boolean)
            : [];
        return permissions.includes(permission);
    }, [user, hasRole]);

    /**
     * True if user has any staff-level role OR any manage permission.
     * This makes isStaff() dynamic — a role with manage-tickets permission
     * would also qualify as staff even if not in STAFF_ROLES.
     */
    const isStaff = useCallback(() => {
        if (!user) return false;
        if (hasRole(STAFF_ROLES)) return true;
        // Also check for permission-based staff access
        return hasPermission('manage-tickets') || hasPermission('view-tickets');
    }, [hasRole, hasPermission, user]);

    /**
     * True if user has manager-level role OR manage-users/manage-departments permissions.
     */
    const isManager = useCallback(() => {
        if (!user) return false;
        if (hasRole(MANAGER_ROLES)) return true;
        return hasPermission('manage-users') || hasPermission('manage-roles');
    }, [hasRole, hasPermission, user]);

    const isSuperAdmin = useCallback(() => hasRole('super_admin'), [hasRole]);

    const getUserRoleName = useCallback(() => {
        if (!user) return 'User';
        const roles = Array.isArray(user.roles)
            ? user.roles.map(r => (typeof r === 'string' ? r : r.name)).filter(Boolean)
            : [user.role].filter(Boolean);
        return roles[0]?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'User';
    }, [user]);

    /** Refresh user data (e.g. after role/permission changes) */
    const refreshUser = useCallback(async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
        } catch {
            /* ignore */
        }
    }, []);

    return (
        <AuthContext.Provider value={{
            user, login, logout, loading,
            hasRole, hasPermission, isStaff, isManager, isSuperAdmin, getUserRoleName,
            refreshUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
