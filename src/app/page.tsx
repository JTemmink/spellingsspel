'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [totalPoints, setTotalPoints] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load total points from localStorage or API
    const savedPoints = localStorage.getItem('totalPoints');
    if (savedPoints) {
      setTotalPoints(parseInt(savedPoints));
    }
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 via-base-200 to-base-300 relative overflow-hidden" data-theme="spellingsspel">
      {/* Animated background stars */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        
        {/* Points display */}
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute top-8 right-8"
        >
          <div className="card bg-primary/20 backdrop-blur-sm shadow-xl">
            <div className="card-body py-3 px-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <div>
                  <div className="text-sm text-primary-content/70">Totaal punten</div>
                  <div className="text-2xl font-bold text-primary-content">{totalPoints}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl md:text-8xl font-bubblegum font-bold text-primary mb-4">
            🚀 Spellingsspel
          </h1>
          <p className="text-xl md:text-2xl text-base-content/80">
            Ga op reis door de ruimte en leer spellen! ⭐
          </p>
        </motion.div>

        {/* Floating astronaut */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0] 
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="text-8xl mb-8"
        >
          👨‍🚀
        </motion.div>

        {/* Action buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-6 mb-12"
        >
          <Link href="/play">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-primary btn-lg text-xl px-12 py-4 rounded-full shadow-2xl"
            >
              🎮 Start Spelen
            </motion.button>
          </Link>
          
          <Link href="/parent-portal/login">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-secondary btn-lg text-xl px-12 py-4 rounded-full shadow-2xl"
            >
              👨‍👩‍👧‍👦 Ouderportaal
            </motion.button>
          </Link>
        </motion.div>

        {/* Features */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full"
        >
          {[
            { icon: "🎯", title: "Spelling Oefenen", desc: "Oefen je spelling met leuke woorden" },
            { icon: "⭐", title: "Punten Verdienen", desc: "Verdien punten voor elk goed antwoord" },
            { icon: "📊", title: "Voortgang Bijhouden", desc: "Zie hoe goed je het doet" }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 + index * 0.2 }}
              className="card bg-base-100/50 backdrop-blur-sm shadow-xl"
            >
              <div className="card-body text-center">
                <div className="text-4xl mb-2">{feature.icon}</div>
                <h3 className="card-title justify-center text-lg">{feature.title}</h3>
                <p className="text-base-content/70">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Floating planets */}
        <motion.div
          animate={{ 
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="absolute top-1/4 left-8 text-6xl opacity-20"
        >
          🪐
        </motion.div>

        <motion.div
          animate={{ 
            x: [0, -40, 0],
            y: [0, 25, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/4 right-12 text-4xl opacity-30"
        >
          🌙
        </motion.div>
      </div>
    </div>
  );
}
