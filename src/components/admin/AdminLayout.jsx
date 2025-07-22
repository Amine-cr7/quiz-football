'use client'
import Link from 'next/link';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-container">
      <nav className="admin-sidebar">
        <h2>Quiz Admin</h2>
        <ul>
          <li><Link href="/admin">Dashboard</Link></li>
          <li><Link href="/admin/questions">Questions</Link></li>
          <li><Link href="/admin/categories">Categories</Link></li>
          <li><Link href="/admin/bulk-upload">Bulk Upload</Link></li>
        </ul>
      </nav>
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}