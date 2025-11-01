'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from '@/lib/firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { signOut, getAuth } from 'firebase/auth';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  // useEffect(() => {
  //   const checkAuth = async () => {
  //     const unsubscribe = onAuthStateChanged(async (authUser) => {
  //       if (authUser) {
  //         const userDocRef = doc(firestore, 'adminemail', authUser.email as string);
  //         const userDoc = await getDoc(userDocRef);

  //         if (userDoc.exists()) {
  //           const role = userDoc.data()?.role;
  //                     if (role === 'admin' || role === 'superadmin') {
  //           setIsAuthenticated(true);
  //           setUserRole(role);
  //         } else {
  //           setIsAuthenticated(false);
  //           router.push('/login');
  //         }
  //                 } else {
  //         setIsAuthenticated(false);
  //         router.push('/login');
  //       }
  //       } else {
  //         setIsAuthenticated(false);
  //         router.push('/login');
  //       }
  //       setLoading(false);
  //     });

  //     return () => unsubscribe();
  //   };

  //   checkAuth();
  // }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col py-6 px-4 min-h-screen sticky top-0 z-30">
        <div className="flex items-center mb-8">
          <Avatar className="mr-3" />
          <span className="font-bold text-lg">Admin Panel</span>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          <Link href="/admin" passHref legacyBehavior>
            <Button variant="ghost" className="justify-start w-full">Dashboard</Button>
          </Link>
          <Link href="/manage-hostels" passHref legacyBehavior>
            <Button variant="ghost" className="justify-start w-full">Manage Hostels</Button>
          </Link>
          <Link href="/manage-categories" passHref legacyBehavior>
            <Button variant="ghost" className="justify-start w-full">Manage Categories</Button>
          </Link>
          <Link href="/manage-comments" passHref legacyBehavior>
            <Button variant="ghost" className="justify-start w-full">Manage Comments</Button>
          </Link>
          <Link href="/admin/reports-blocked" passHref legacyBehavior>
            <Button variant="ghost" className="justify-start w-full">Reports & Blocked Users</Button>
          </Link>
          {userRole === 'superadmin' && (
            <Link href="/admin/super-admin" passHref legacyBehavior>
              <Button variant="ghost" className="justify-start w-full">Super Admin</Button>
            </Link>
          )}
        </nav>
        <Button onClick={handleLogout} variant="destructive" className="mt-8">Logout</Button>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <Card className="p-6 shadow-md min-h-full bg-white">
          {children}
        </Card>
      </main>
    </div>
  );
};

export default AdminLayout; 