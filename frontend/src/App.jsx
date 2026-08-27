import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import CourseAssignments from './pages/CourseAssignments';
import GroupManagement from './pages/GroupManagement';
import AdminDashboard from './pages/AdminDashboard';
import AdminOverview from './pages/AdminOverview';
import ProfessorCourseDetail from './pages/ProfessorCourseDetail';
import AdminGroups from './pages/AdminGroups';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} replace />}
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:id"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <CourseAssignments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <GroupManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/overview"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses/:id"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ProfessorCourseDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/groups"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminGroups />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}