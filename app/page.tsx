"use client";

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import HostelGrid from '@/components/main/hostelGrid';
import FilterSection from '@/components/main/FilterSection';
import TabSection from '@/components/main/TabSection';
// import Footer from '@/components/Footer';
// import LoadingScreen from "@/components/loadingScrenn";
import Link from 'next/link';

  
export default function Home() {
  const [activeTab, setActiveTab] = useState("All");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(false); // State to trigger hostel re-fetch
  // const [loading, setLoading] = useState(true); // Track loading state

  useEffect(() => {
    // Simulate a loading delay
    // const timer = setTimeout(() => setLoading(false), 1500);
    // return () => clearTimeout(timer);
    setRefreshTrigger(prev => !prev); // Trigger re-fetch when component mounts

  }, []);


  const handleClearFilters = () => {
    // Clear all filters
    setFilters({});
  };

  // Show the loading screen first
  // if (loading) {
  //   return <LoadingScreen />;
  // }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col md:flex-row p-4 md:p-0">
        <FilterSection onFilterSubmit={setFilters} onClearFilters={handleClearFilters} />
        <div className="flex-1 max-w-7xl px-4 py-6 space-y-8 w-full">
          {/* <TabSection activeTab={activeTab} onTabChange={setActiveTab} /> */}
          <HostelGrid activeTab={activeTab} filters={filters} refreshTrigger={refreshTrigger} />
        </div>
      </div>
      {/* <Footer /> */}
    </main>
  );
}
