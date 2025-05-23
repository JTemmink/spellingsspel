// Client-side utility functions

// Speech synthesis for word pronunciation
export function speakWord(word: string): void {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'nl-NL'; // Dutch language
    utterance.rate = 0.8; // Slightly slower for clarity
    utterance.pitch = 1.2; // Slightly higher pitch for kids
    utterance.volume = 1.0; // Full volume
    
    speechSynthesis.speak(utterance);
  } else {
    console.warn('Speech synthesis not supported in this browser');
  }
}

// Format time for display
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Shuffle array utility function
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate random ID for client-side use
export function generateClientId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get total points from database API with localStorage fallback
export async function getTotalPointsFromAPI(): Promise<number> {
  try {
    const response = await fetch('/api/points?userId=user_1');
    if (response.ok) {
      const data = await response.json();
      return data.totalPoints || 0;
    }
  } catch (error) {
    console.error('Error fetching points from API:', error);
  }
  
  // Fallback to localStorage
  return getTotalPoints();
}

// Synchronous version for localStorage (backward compatibility)
export function getTotalPoints(): number {
  if (typeof window !== 'undefined') {
    return parseInt(localStorage.getItem('totalPoints') || '0');
  }
  return 0;
}

// Add points to database and sync with localStorage
export async function addPointsToAPI(points: number): Promise<number> {
  try {
    const response = await fetch('/api/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user_1', pointsToAdd: points })
    });
    
    if (response.ok) {
      const data = await response.json();
      // Sync with localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('totalPoints', data.totalPoints.toString());
      }
      return data.totalPoints;
    }
  } catch (error) {
    console.error('Error adding points via API:', error);
  }
  
  // Fallback to localStorage only
  return addPoints(points);
}

// Update total points in database
export async function updateTotalPointsAPI(totalPoints: number): Promise<boolean> {
  try {
    const response = await fetch('/api/points', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user_1', totalPoints })
    });
    
    if (response.ok) {
      // Sync with localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('totalPoints', totalPoints.toString());
      }
      return true;
    }
  } catch (error) {
    console.error('Error updating points via API:', error);
  }
  
  return false;
}

// Legacy function for backward compatibility
export function addPoints(points: number): number {
  if (typeof window !== 'undefined') {
    const currentPoints = getTotalPoints();
    const newTotal = currentPoints + points;
    localStorage.setItem('totalPoints', newTotal.toString());
    return newTotal;
  }
  return 0;
}

// Sync points between localStorage and database
export async function syncPoints(): Promise<void> {
  try {
    const localPoints = getTotalPoints();
    const apiPoints = await getTotalPointsFromAPI();
    
    // Use the higher value (in case local has newer data)
    const maxPoints = Math.max(localPoints, apiPoints);
    
    if (maxPoints !== apiPoints) {
      await updateTotalPointsAPI(maxPoints);
    }
    
    if (maxPoints !== localPoints && typeof window !== 'undefined') {
      localStorage.setItem('totalPoints', maxPoints.toString());
    }
  } catch (error) {
    console.error('Error syncing points:', error);
  }
}

// Check if browser supports speech synthesis
export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window;
}

// Debounce function for input handling
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 