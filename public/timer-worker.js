// Timer Web Worker - Runs in background thread, not affected by tab throttling

let timerInterval = null;
let timeRemaining = 0;
let isRunning = false;

self.onmessage = function(e) {
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
  }
};

function startTimer() {
  stopTimer(); // Clear any existing interval
  
  timerInterval = setInterval(() => {
    if (isRunning && timeRemaining > 0) {
      timeRemaining--;
      self.postMessage({ type: 'TICK', timeLeft: timeRemaining });
      
      if (timeRemaining === 0) {
        self.postMessage({ type: 'COMPLETE' });
        stopTimer();
      }
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}
