'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { syncPoints } from '@/lib/utils';

interface DashboardStats {
  totalPoints: number;
  wordListsCount: number;
  lastPlayTime: string;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalPoints: 0,
    wordListsCount: 0,
    lastPlayTime: 'Nog niet gespeeld'
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Check authentication
    const auth = localStorage.getItem('parentAuth');
    if (auth !== 'true') {
      router.push('/parent-portal/login');
      return;
    }

    // Load stats and sync points
    loadStats();
  }, [router]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      
      // Sync points between localStorage and database
      await syncPoints();
      
      // Get points from API
      const [pointsResponse, wordListsResponse] = await Promise.all([
        fetch('/api/points?userId=user_1'),
        fetch('/api/word-lists?userId=user_1')
      ]);
      
      let totalPoints = 0;
      if (pointsResponse.ok) {
        const pointsData = await pointsResponse.json();
        totalPoints = pointsData.totalPoints || 0;
      }
      
      let wordListsCount = 0;
      if (wordListsResponse.ok) {
        const wordListsData = await wordListsResponse.json();
        wordListsCount = wordListsData.wordLists ? wordListsData.wordLists.length : 0;
      }
      
      setStats({
        totalPoints,
        wordListsCount,
        lastPlayTime: localStorage.getItem('lastPlayTime') || 'Nog niet gespeeld'
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('parentAuth');
    router.push('/parent-portal/login');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 p-4" data-theme="light">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="navbar bg-white/80 backdrop-blur-sm shadow-lg rounded-lg mb-6"
      >
        <div className="navbar-start">
          <h1 className="text-2xl font-bold text-gray-800">👨‍👩‍👧‍👦 Ouderportaal</h1>
        </div>
        <div className="navbar-end gap-2">
          <Link href="/">
            <button className="btn btn-ghost">🏠 Spellingsspel</button>
          </Link>
          <button onClick={handleLogout} className="btn btn-outline">
            Uitloggen
          </button>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="card bg-white shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-primary">🏆 Totale Punten</h2>
              {isLoading ? (
                <div className="loading loading-spinner loading-md"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-800">{stats.totalPoints}</p>
              )}
            </div>
          </div>
          
          <div className="card bg-white shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-secondary">📚 Woordlijsten</h2>
              {isLoading ? (
                <div className="loading loading-spinner loading-md"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-800">{stats.wordListsCount}</p>
              )}
            </div>
          </div>
          
          <div className="card bg-white shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-accent">⏰ Laatst Gespeeld</h2>
              <p className="text-lg font-medium text-gray-800">{stats.lastPlayTime}</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <Link href="/parent-portal/word-lists">
            <div className="card bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer">
              <div className="card-body">
                <h2 className="card-title">📝 Woordlijsten Beheren</h2>
                <p>Voeg nieuwe woorden toe, bewerk bestaande lijsten en organiseer de spellingsoefeningen.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-sm bg-white/20 border-white/30 text-white hover:bg-white/30">
                    Openen →
                  </button>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/parent-portal/statistics">
            <div className="card bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer">
              <div className="card-body">
                <h2 className="card-title">📊 Statistieken</h2>
                <p>Bekijk voortgang, prestaties en trends van de spellingsoefeningen van uw kind.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-sm bg-white/20 border-white/30 text-white hover:bg-white/30">
                    Bekijken →
                  </button>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/parent-portal/settings">
            <div className="card bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer">
              <div className="card-body">
                <h2 className="card-title">⚙️ Instellingen</h2>
                <p>Pas punten systeem, moeilijkheidsgraad en andere spelinstellingen aan.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-sm bg-white/20 border-white/30 text-white hover:bg-white/30">
                    Openen →
                  </button>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="card bg-white shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-info">💡 Tips voor Ouders</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📅</div>
                  <div>
                    <h3 className="font-semibold">Dagelijkse Routine</h3>
                    <p className="text-sm text-gray-600">15 minuten per dag spellingsoefening geeft de beste resultaten.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <h3 className="font-semibold">Duidelijke Doelen</h3>
                    <p className="text-sm text-gray-600">Stel realistische doelen en vier successen samen.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📚</div>
                  <div>
                    <h3 className="font-semibold">Eigen Woordlijsten</h3>
                    <p className="text-sm text-gray-600">Voeg woorden toe die uw kind moeilijk vindt op school.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⭐</div>
                  <div>
                    <h3 className="font-semibold">Positieve Feedback</h3>
                    <p className="text-sm text-gray-600">Moedig aan en focus op vooruitgang, niet op perfectie.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 