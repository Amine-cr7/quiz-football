// app/admin/page.jsx
'use client'
import { useAdminProtection } from '@/hooks/useAdminProtection';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const { isVerified, isVerifying } = useAdminProtection();
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalCategories: 0,
    totalUsers: 0,
    totalGames: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isVerified) {
      fetchStats();
    }
  }, [isVerified]);

  const fetchStats = async () => {
    try {
      // You can implement these API endpoints to get actual stats
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isVerified) {
    return null; // Will be redirected by the hook
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of your application statistics and quick actions.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Questions"
          value={stats.totalQuestions}
          loading={loading}
          color="blue"
        />
        <StatCard
          title="Categories"
          value={stats.totalCategories}
          loading={loading}
          color="green"
        />
        <StatCard
          title="Users"
          value={stats.totalUsers}
          loading={loading}
          color="purple"
        />
        <StatCard
          title="Games Played"
          value={stats.totalGames}
          loading={loading}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionButton
            href="/admin/questions/new"
            label="Add Question"
            icon="➕"
          />
          <QuickActionButton
            href="/admin/categories/new"
            label="Add Category"
            icon="📁"
          />
          <QuickActionButton
            href="/admin/bulk-upload"
            label="Bulk Upload"
            icon="📤"
          />
          <QuickActionButton
            href="/admin/questions"
            label="Manage Questions"
            icon="📝"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-gray-500 text-center py-8">
          <p>Activity tracking coming soon...</p>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, loading, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              value.toLocaleString()
            )}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <div className="w-6 h-6"></div>
        </div>
      </div>
    </div>
  );
}

// Quick Action Button Component
function QuickActionButton({ href, label, icon }) {
  return (
    <a
      href={href}
      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <span className="text-2xl mr-3">{icon}</span>
      <span className="font-medium text-gray-900">{label}</span>
    </a>
  );
}