'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Points settings
  const [pointsSettings, setPointsSettings] = useState({
    correct_word_points: 10,
    perfect_list_points: 50,
    streak_points: 20,
    time_points: 30,
    time_threshold: 15
  });
  const [pointsError, setPointsError] = useState('');
  const [pointsSuccess, setPointsSuccess] = useState('');
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);
  
  // Total points adjustment
  const [currentTotalPoints, setCurrentTotalPoints] = useState(0);
  const [newTotalPoints, setNewTotalPoints] = useState(0);
  const [totalPointsError, setTotalPointsError] = useState('');
  const [totalPointsSuccess, setTotalPointsSuccess] = useState('');
  const [isLoadingTotalPoints, setIsLoadingTotalPoints] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Check authentication
    const auth = localStorage.getItem('parentAuth');
    if (auth !== 'true') {
      router.push('/parent-portal/login');
      return;
    }
    
    // Load current points settings and total points
    loadPointsSettings();
    loadTotalPoints();
  }, [router]);

  const loadPointsSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setPointsSettings({
            correct_word_points: data.settings.correct_word_points,
            perfect_list_points: data.settings.perfect_list_points,
            streak_points: data.settings.streak_points,
            time_points: data.settings.time_points,
            time_threshold: data.settings.time_threshold
          });
        }
      }
    } catch (error) {
      console.error('Error loading points settings:', error);
    }
  };

  const loadTotalPoints = async () => {
    try {
      const response = await fetch('/api/points?userId=user_1');
      if (response.ok) {
        const data = await response.json();
        const totalPoints = data.totalPoints || 0;
        setCurrentTotalPoints(totalPoints);
        setNewTotalPoints(totalPoints);
      }
    } catch (error) {
      console.error('Error loading total points:', error);
    }
  };

  const handleSavePointsSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingPoints(true);
    setPointsError('');
    setPointsSuccess('');

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pointsSettings)
      });

      const data = await response.json();

      if (response.ok) {
        setPointsSuccess('Punten instellingen succesvol opgeslagen!');
      } else {
        setPointsError(data.error || 'Er ging iets mis');
      }
    } catch (error) {
      console.error('Error saving points settings:', error);
      setPointsError('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setIsLoadingPoints(false);
    }
  };

  const handleUpdateTotalPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingTotalPoints(true);
    setTotalPointsError('');
    setTotalPointsSuccess('');

    if (newTotalPoints < 0) {
      setTotalPointsError('Punten kunnen niet negatief zijn');
      setIsLoadingTotalPoints(false);
      return;
    }

    try {
      const response = await fetch('/api/points', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_1', totalPoints: newTotalPoints })
      });

      if (response.ok) {
        setCurrentTotalPoints(newTotalPoints);
        setTotalPointsSuccess(`Totaal punten aangepast naar ${newTotalPoints}!`);
        
        // Update localStorage for sync
        if (typeof window !== 'undefined') {
          localStorage.setItem('totalPoints', newTotalPoints.toString());
        }
      } else {
        const data = await response.json();
        setTotalPointsError(data.error || 'Er ging iets mis');
      }
    } catch (error) {
      console.error('Error updating total points:', error);
      setTotalPointsError('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setIsLoadingTotalPoints(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Alle velden zijn verplicht');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Nieuwe wachtwoorden komen niet overeen');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 4) {
      setError('Nieuw wachtwoord moet minimaal 4 karakters zijn');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/parent-auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Wachtwoord succesvol gewijzigd!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Er ging iets mis');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-800 ml-4">⚙️ Instellingen</h1>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        {/* Password Change */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-white shadow-xl"
        >
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">🔒 Wachtwoord Wijzigen</h2>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Huidig Wachtwoord</span>
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Voer huidig wachtwoord in"
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Nieuw Wachtwoord</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Voer nieuw wachtwoord in"
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Bevestig Nieuw Wachtwoord</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Bevestig nieuw wachtwoord"
                  className="input input-bordered w-full"
                  required
                />
              </div>

              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Wijzigen...
                  </>
                ) : (
                  'Wachtwoord Wijzigen'
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Total Points Adjustment */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-white shadow-xl mt-6"
        >
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">🏆 Totaal Punten Aanpassen</h2>
            
            <div className="bg-info/10 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-info">ℹ️</span>
                <span className="font-medium">Huidige Totaal Punten: {currentTotalPoints}</span>
              </div>
              <p className="text-sm text-gray-600">
                Hier kunt u de totaal behaalde punten van uw kind aanpassen. 
                Dit kan handig zijn voor correcties of als beloning.
              </p>
            </div>
            
            <form onSubmit={handleUpdateTotalPoints} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Nieuwe Totaal Punten</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="999999"
                  value={newTotalPoints}
                  onChange={(e) => setNewTotalPoints(parseInt(e.target.value) || 0)}
                  placeholder="Voer nieuwe totaal punten in"
                  className="input input-bordered w-full"
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">
                    Verschil: {newTotalPoints - currentTotalPoints >= 0 ? '+' : ''}{newTotalPoints - currentTotalPoints} punten
                  </span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setNewTotalPoints(currentTotalPoints + 100)}
                  className="btn btn-outline btn-sm flex-1"
                >
                  +100 punten
                </button>
                <button
                  type="button"
                  onClick={() => setNewTotalPoints(Math.max(0, currentTotalPoints - 100))}
                  className="btn btn-outline btn-sm flex-1"
                >
                  -100 punten
                </button>
                <button
                  type="button"
                  onClick={() => setNewTotalPoints(0)}
                  className="btn btn-outline btn-warning btn-sm flex-1"
                >
                  Reset naar 0
                </button>
              </div>

              {totalPointsError && (
                <div className="alert alert-error">
                  <span>{totalPointsError}</span>
                </div>
              )}

              {totalPointsSuccess && (
                <div className="alert alert-success">
                  <span>{totalPointsSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoadingTotalPoints || newTotalPoints === currentTotalPoints}
                className="btn btn-primary w-full"
              >
                {isLoadingTotalPoints ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Opslaan...
                  </>
                ) : (
                  'Totaal Punten Bijwerken'
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Points Settings */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-white shadow-xl mt-6"
        >
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">🎯 Punten Systeem</h2>
            
            <form onSubmit={handleSavePointsSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Punten per Correct Woord</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={pointsSettings.correct_word_points}
                    onChange={(e) => setPointsSettings({
                      ...pointsSettings,
                      correct_word_points: parseInt(e.target.value) || 10
                    })}
                    className="input input-bordered w-full"
                  />
                  <label className="label">
                    <span className="label-text-alt text-gray-500">Standaard: 10 punten</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Bonus Perfecte Lijst</span>
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={pointsSettings.perfect_list_points}
                    onChange={(e) => setPointsSettings({
                      ...pointsSettings,
                      perfect_list_points: parseInt(e.target.value) || 50
                    })}
                    className="input input-bordered w-full"
                  />
                  <label className="label">
                    <span className="label-text-alt text-gray-500">Standaard: 50 punten</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Streak Bonus</span>
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={pointsSettings.streak_points}
                    onChange={(e) => setPointsSettings({
                      ...pointsSettings,
                      streak_points: parseInt(e.target.value) || 20
                    })}
                    className="input input-bordered w-full"
                  />
                  <label className="label">
                    <span className="label-text-alt text-gray-500">Standaard: 20 punten</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Tijd Bonus</span>
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={pointsSettings.time_points}
                    onChange={(e) => setPointsSettings({
                      ...pointsSettings,
                      time_points: parseInt(e.target.value) || 30
                    })}
                    className="input input-bordered w-full"
                  />
                  <label className="label">
                    <span className="label-text-alt text-gray-500">Standaard: 30 punten</span>
                  </label>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Tijd Limiet (minuten)</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={pointsSettings.time_threshold}
                  onChange={(e) => setPointsSettings({
                    ...pointsSettings,
                    time_threshold: parseInt(e.target.value) || 15
                  })}
                  className="input input-bordered w-full"
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">
                    Sessies korter dan deze tijd krijgen een tijd bonus. Standaard: 15 minuten
                  </span>
                </label>
              </div>

              {pointsError && (
                <div className="alert alert-error">
                  <span>{pointsError}</span>
                </div>
              )}

              {pointsSuccess && (
                <div className="alert alert-success">
                  <span>{pointsSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoadingPoints}
                className="btn btn-primary w-full"
              >
                {isLoadingPoints ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Opslaan...
                  </>
                ) : (
                  'Punten Instellingen Opslaan'
                )}
              </button>
            </form>
          </div>
        </motion.div>

                {/* Reset Data */}        <motion.div          initial={{ opacity: 0, y: 50 }}          animate={{ opacity: 1, y: 0 }}          transition={{ delay: 0.3 }}          className="card bg-white shadow-xl mt-6 border-2 border-red-200"        >          <div className="card-body">            <h2 className="card-title text-xl mb-4 text-red-600">🗑️ Data Resetten</h2>                        <div className="bg-warning/10 p-4 rounded-lg mb-4">              <div className="flex items-center gap-2 mb-2">                <span className="text-warning">⚠️</span>                <span className="font-medium text-warning">Let op: Deze actie is onomkeerbaar!</span>              </div>              <p className="text-sm text-gray-600">                Deze functie wist alle speldata inclusief pogingen, sessies, punten en statistieken.              </p>            </div>            <button              onClick={async () => {                if (confirm('Weet je zeker dat je alle speldata wilt resetten?')) {                  try {                    const response = await fetch('/api/reset-data', { method: 'POST' });                    const data = await response.json();                    if (data.success) {                      alert('Data gereset!');                      window.location.reload();                    } else {                      alert('Error: ' + data.error);                    }                  } catch (error) {                    alert('Er ging iets mis');                  }                }              }}              className="btn btn-error w-full"            >              🗑️ Alle Speldata Resetten            </button>          </div>        </motion.div>        {/* Security Tips */}        <motion.div          initial={{ opacity: 0, y: 50 }}          animate={{ opacity: 1, y: 0 }}          transition={{ delay: 0.4 }}          className="card bg-info/10 shadow-lg mt-6"        >          <div className="card-body">            <h2 className="card-title text-lg">💡 Tips voor Ouders</h2>            <div className="space-y-2 text-sm">              <p>• <strong>Wachtwoord:</strong> Kies een wachtwoord dat alleen u kent</p>              <p>• <strong>Punten:</strong> Gebruik punten aanpassing spaarzaam als motivatie</p>              <p>• <strong>Systeem:</strong> Lagere punten per woord verhogen de motivatie om meer te oefenen</p>              <p>• <strong>Tijd Bonus:</strong> Stimuleert korte, frequente oefensessies</p>              <p>• <strong>Reset:</strong> Gebruik alleen als je helemaal opnieuw wilt beginnen</p>            </div>          </div>        </motion.div>
      </div>
    </div>
  );
} 