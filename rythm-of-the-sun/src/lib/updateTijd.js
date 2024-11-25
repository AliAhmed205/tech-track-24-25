
  let intervalId;

  export function startTimeUpdater(callback) {
      stopTimeUpdater(); 
      intervalId = setInterval(() => {
          const now = new Date();
          callback(now);
      }, 10); 
  }

  export function stopTimeUpdater() {
      if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
      }
  }
