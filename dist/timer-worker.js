// Timer Web Worker - Runs in background thread, not affected by tab throttling

let timerInterval = null;
let timeRemaining = 0;
let isRunning = false;
let lastTickTime = Date.now();

self.onmessage = function(e) {
  try {
    if (!e || !e.data) {
      console.error('Worker: Invalid message received');
      return;
    }
    
    const { type, payload } = e.data;
  
  switch (type) {
    case 'START':
      timeRemaining = payload.timeLeft;
      isRunning = true;
      startTimer();
      break;
      
    case 'PAUSE':
      isRunning = false;
      stopTimer();
      break;
      
    case 'RESET':
      isRunning = false;
      stopTimer();
      timeRemaining = payload.timeLeft;
      self.postMessage({ type: 'TICK', timeLeft: timeRemaining });
      break;
      
    case 'SYNC':
      // Sync time from main thread (in case of drift)
      timeRemaining = payload.timeLeft;
      break;
      
    case 'STOP':
      isRunning = false;
      stopTimer();
      break;
      
    default:
      console.warn('Worker: Unknown message type:', type);
  }
  } catch (error) {
    console.error('Worker: Error handling message:', error);
    self.postMessage({ type: 'ERROR', error: error.message });
  }
};

function startTimer() {
  stopTimer(); // Clear any existing interval
  lastTickTime = Date.now();
  
  timerInterval = setInterval(() => {
    try {
      // Check for drift (in case browser throttled us)
      const now = Date.now();
      const drift = now - lastTickTime;
      lastTickTime = now;
      
      // If drift is too large (>2s), we might have been suspended
      if (drift > 2000) {
        console.warn('Worker: Large drift detected:', drift, 'ms');
      }
      
      if (isRunning && timeRemaining > 0) {
        timeRemaining--;
        self.postMessage({ type: 'TICK', timeLeft: timeRemaining });
        
        if (timeRemaining === 0) {
          self.postMessage({ type: 'COMPLETE' });
          stopTimer();
        }
      }
    } catch (error) {
      console.error('Worker: Error in timer tick:', error);
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Handle worker errors globally
self.onerror = function(error) {
  console.error('Worker: Global error:', error);
  return true; // Prevent default error handling
};
