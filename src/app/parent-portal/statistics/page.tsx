'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface StatisticsData {
  totalPoints: number;
  totalSessions: number;
  totalWords: number;
  accuracy: number;
  currentStreak: number;
  totalPracticeTime: number;
  averageSessionTime: number;
  lastPracticeDate: string | null;
  recentSessions: Array<{
    date: string;
    correct: number;
    total: number;
    accuracy: number;
    duration: number;
  }>;
  difficultWords: Array<{
    word: string;
    attempts: number;
    correct: number;
    accuracy: number;
  }>;
}

export default function StatisticsPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<StatisticsData>({
    totalPoints: 0,
    totalSessions: 0,
    totalWords: 0,
    accuracy: 0,
    currentStreak: 0,
    totalPracticeTime: 0,
    averageSessionTime: 0,
    lastPracticeDate: null,
    recentSessions: [],
    difficultWords: []
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

    loadStatistics();
  }, [router]);

  const loadStatistics = async () => {
    try {
      setIsLoading(true);
      
      // Get real statistics from API
      const statsResponse = await fetch('/api/statistics?userId=user_1');
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        
        if (statsData.statistics) {
          setStats(statsData.statistics);
        } else {
          // Reset to empty stats if no data
          setStats({
            totalPoints: 0,
            totalSessions: 0,
            totalWords: 0,
            accuracy: 0,
            currentStreak: 0,
            totalPracticeTime: 0,
            averageSessionTime: 0,
            lastPracticeDate: null,
            recentSessions: [],
            difficultWords: []
          });
        }
      } else {
        console.error('Failed to fetch statistics:', statsResponse.status);
      }
      
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
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
          <Link href="/parent-portal/dashboard">
            <button className="btn btn-ghost">← Dashboard</button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 ml-4">📊 Statistieken</h1>
        </div>
        <div className="navbar-end">
          <button 
            onClick={loadStatistics}
            className="btn btn-outline btn-sm"
            disabled={isLoading}
          >
            🔄 Ververs
          </button>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
            >
              <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl col-span-2">
                <div className="card-body">
                  <h2 className="card-title text-lg">🏆 Totale Punten</h2>
                  <p className="text-3xl font-bold">{stats.totalPoints}</p>
                </div>
              </div>
              
              <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl">
                <div className="card-body">
                  <h2 className="card-title text-sm">🎯 Nauwkeurigheid</h2>
                  <p className="text-2xl font-bold">{stats.accuracy}%</p>
                </div>
              </div>
              
              <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl">
                <div className="card-body">
                  <h2 className="card-title text-sm">📚 Woorden</h2>
                  <p className="text-2xl font-bold">{stats.totalWords}</p>
                </div>
              </div>
              
              <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl">
                <div className="card-body">
                  <h2 className="card-title text-sm">🎮 Sessies</h2>
                  <p className="text-2xl font-bold">{stats.totalSessions}</p>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-xl">
                <div className="card-body">
                  <h2 className="card-title text-sm">🔥 Streak</h2>
                  <p className="text-2xl font-bold">{stats.currentStreak}</p>
                  <p className="text-xs opacity-80">dagen</p>
                </div>
              </div>
            </motion.div>

            {/* Time Stats */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="card bg-white shadow-xl">
                <div className="card-body text-center">
                  <h2 className="card-title justify-center text-lg">⏱️ Totale Oefentijd</h2>
                  <p className="text-2xl font-bold text-indigo-600">{formatTime(stats.totalPracticeTime)}</p>
                </div>
              </div>
              
              <div className="card bg-white shadow-xl">
                <div className="card-body text-center">
                  <h2 className="card-title justify-center text-lg">📊 Gem. Sessie</h2>
                  <p className="text-2xl font-bold text-teal-600">{formatTime(stats.averageSessionTime)}</p>
                </div>
              </div>
              
              <div className="card bg-white shadow-xl">
                <div className="card-body text-center">
                  <h2 className="card-title justify-center text-lg">📅 Laatst Geoefend</h2>
                  <p className="text-lg font-medium text-gray-600">
                    {stats.lastPracticeDate || 'Nog niet geoefend'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Recent Sessions */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card bg-white shadow-xl"
            >
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">📈 Recente Sessies</h2>
                <div className="overflow-x-auto">
                  {stats.recentSessions.length > 0 ? (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Datum</th>
                          <th>Correct</th>
                          <th>Totaal</th>
                          <th>Nauwkeurigheid</th>
                          <th>Duur</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentSessions.map((session, index) => (
                          <tr key={index}>
                            <td className="font-medium">{session.date}</td>
                            <td>
                              <span className="text-success font-semibold">{session.correct}</span>
                            </td>
                            <td>{session.total}</td>
                            <td>
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${
                                  session.accuracy >= 80 
                                    ? 'text-success' 
                                    : session.accuracy >= 60 
                                    ? 'text-warning' 
                                    : 'text-error'
                                }`}>
                                  {session.accuracy}%
                                </span>
                                <div className={`badge badge-sm ${
                                  session.accuracy >= 80 
                                    ? 'badge-success' 
                                    : session.accuracy >= 60 
                                    ? 'badge-warning' 
                                    : 'badge-error'
                                }`}>
                                  {session.accuracy >= 80 ? 'Goed' : session.accuracy >= 60 ? 'Matig' : 'Oefenen'}
                                </div>
                              </div>
                            </td>
                            <td>{formatTime(session.duration)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📈</div>
                      <p>Nog geen sessies voltooid.</p>
                      <p className="text-sm">Begin met oefenen om statistieken te zien!</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Difficult Words */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card bg-white shadow-xl"
            >
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">😰 Moeilijkste Woorden</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.difficultWords.length > 0 ? (
                    stats.difficultWords.map((word, index) => (
                      <div key={index} className="card bg-red-50 shadow-md">
                        <div className="card-body">
                          <h3 className="font-bold text-lg text-red-700">{word.word}</h3>
                          <div className="stats stats-horizontal shadow-sm">
                            <div className="stat">
                              <div className="stat-title text-xs">Pogingen</div>
                              <div className="stat-value text-lg">{word.attempts}</div>
                            </div>
                            <div className="stat">
                              <div className="stat-title text-xs">Nauwkeurigheid</div>
                              <div className="stat-value text-lg text-red-600">{word.accuracy}%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🎉</div>
                      <p>Geen moeilijke woorden gevonden!</p>
                      <p className="text-sm">Geweldig! Alle woorden gaan goed.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Tips Based on Stats */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card bg-info/10 shadow-xl"
            >
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">💡 Aanbevelingen</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.accuracy < 70 && (
                    <div className="alert alert-warning">
                      <span>🎯 Focus op nauwkeurigheid: probeer langzamer te spellen</span>
                    </div>
                  )}
                  {stats.currentStreak === 0 && stats.totalSessions > 0 && (
                    <div className="alert alert-info">
                      <span>🔥 Start een nieuwe streak: oefen vandaag!</span>
                    </div>
                  )}
                  {stats.averageSessionTime < 300 && stats.totalSessions > 2 && (
                    <div className="alert alert-success">
                      <span>⏱️ Korte sessies zijn perfect voor leren!</span>
                    </div>
                  )}
                  {stats.difficultWords.length > 3 && (
                    <div className="alert alert-warning">
                      <span>📚 Focus op de moeilijke woorden - herhaling helpt!</span>
                    </div>
                  )}
                  {stats.accuracy >= 90 && (
                    <div className="alert alert-success">
                      <span>🌟 Uitstekende nauwkeurigheid! Blijf zo doorgaan!</span>
                    </div>
                  )}
                  {stats.totalSessions === 0 && (
                    <div className="alert alert-info">
                      <span>🚀 Begin met je eerste oefensessie om statistieken te zien!</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
} 