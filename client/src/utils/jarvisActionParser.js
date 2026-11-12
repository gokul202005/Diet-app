// Jarvis Voice Action Controller & Intent Engine
// Parses natural speech into autonomous client and server execution actions

export function parseJarvisVoiceAction(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  // Clean trigger words like "Jarvis", "Hey Jarvis", "Please", etc.
  const clean = rawText
    .replace(/^(hey|yo|ok|okay)?\s*jarvis[,.]?\s*/i, '')
    .replace(/^please\s*/i, '')
    .trim();
  const lower = clean.toLowerCase();

  // 1. REST TIMER INTENTS
  // e.g. "start a 90-second rest timer", "start 2 minute timer", "set rest timer for 60 seconds", "cancel timer"
  if (lower.includes('timer') || lower.includes('countdown') || lower.includes('rest timer')) {
    if (lower.includes('stop') || lower.includes('cancel') || lower.includes('reset') || lower.includes('clear')) {
      return {
        type: 'timer',
        subAction: 'cancel',
        speechReply: "Rest timer cancelled, sir."
      };
    }

    if (lower.includes('pause')) {
      return {
        type: 'timer',
        subAction: 'pause',
        speechReply: "Timer paused, sir."
      };
    }

    if (lower.includes('resume')) {
      return {
        type: 'timer',
        subAction: 'resume',
        speechReply: "Timer resumed, sir."
      };
    }

    // Extract duration
    let seconds = 90; // Default rest period
    const minMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:minute|min|minutes|mins)\b/i);
    const secMatch = lower.match(/(\d+)\s*(?:second|sec|seconds|secs)\b/i);

    if (minMatch) {
      seconds = Math.round(parseFloat(minMatch[1]) * 60);
    } else if (secMatch) {
      seconds = parseInt(secMatch[1], 10);
    } else {
      const numMatch = lower.match(/\b(\d+)\b/);
      if (numMatch) {
        const val = parseInt(numMatch[1], 10);
        seconds = val > 10 ? val : val * 60;
      }
    }

    const durationDisplay = seconds >= 60 
      ? `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) > 1 ? 's' : ''}${seconds % 60 ? ` and ${seconds % 60} seconds` : ''}`
      : `${seconds} seconds`;

    return {
      type: 'timer',
      subAction: 'start',
      seconds: Math.max(5, Math.min(3600, seconds)),
      speechReply: `Rest timer initiated for ${durationDisplay}, sir. I'll alert you when it's time for the next set.`
    };
  }

  // 2. APP NAVIGATION & SCREEN SWITCHING INTENTS
  // e.g. "switch to my workout logger", "go to dashboard", "open diet tracker", "show settings"
  const isNavPattern = /^(switch to|go to|open|show|navigate to|view|take me to)\b/i.test(lower);
  if (isNavPattern) {
    if (lower.includes('workout') || lower.includes('gym') || lower.includes('exercise') || lower.includes('lifting')) {
      return {
        type: 'navigate',
        tab: 'workouts',
        speechReply: "Switching to your workout logger now, sir."
      };
    }

    if (lower.includes('diet') || lower.includes('meal') || lower.includes('food') || lower.includes('nutrition') || lower.includes('calorie')) {
      return {
        type: 'navigate',
        tab: 'diet',
        speechReply: "Navigating to your diet tracker, sir."
      };
    }

    if (lower.includes('dash') || lower.includes('home') || lower.includes('summary') || lower.includes('overview')) {
      return {
        type: 'navigate',
        tab: 'dashboard',
        speechReply: "Opening your main command dashboard, sir."
      };
    }

    if (lower.includes('watch') || lower.includes('fastrack') || lower.includes('heart') || lower.includes('step')) {
      return {
        type: 'navigate',
        tab: 'fastrack',
        speechReply: "Accessing Fastrack smartwatch telemetry, sir."
      };
    }

    if (lower.includes('planner') || lower.includes('recipe') || lower.includes('meal plan')) {
      return {
        type: 'navigate',
        tab: 'planner',
        speechReply: "Opening the South Indian AI Meal Blueprint planner, sir."
      };
    }

    if (lower.includes('hunter') || lower.includes('quest') || lower.includes('rank') || lower.includes('system')) {
      return {
        type: 'navigate',
        tab: 'hunter',
        speechReply: "Opening the Hunter System conditioning matrix, sir."
      };
    }

    if (lower.includes('progress') || lower.includes('analytics') || lower.includes('chart') || lower.includes('graph')) {
      return {
        type: 'navigate',
        tab: 'progress',
        speechReply: "Switching to your biometric progress analytics, sir."
      };
    }

    if (lower.includes('coach') || lower.includes('chat') || lower.includes('console')) {
      return {
        type: 'navigate',
        tab: 'coach',
        speechReply: "Opening your central JARVIS intelligence console, sir."
      };
    }

    if (lower.includes('setting')) {
      return {
        type: 'navigate',
        modal: 'settings',
        speechReply: "Opening system settings, sir."
      };
    }

    if (lower.includes('profile') || lower.includes('onboarding') || lower.includes('wizard')) {
      return {
        type: 'navigate',
        modal: 'profile',
        speechReply: "Opening your biometric profile setup, sir."
      };
    }
  }

  // 3. AUTONOMOUS DATA LOGGING INTENTS
  // e.g. "log 3 idlis with sambar for breakfast", "i drank 2 glasses of water", "100 meters walking", "1000m run"
  const isExplicitLogAction = /^(log|record|add|track)\b/i.test(lower) ||
    /\b(i ate|i had|i drank|drank|weighed myself at|morning weight)\b/i.test(lower);

  const isWaterLogging = (lower.includes('water') || lower.includes('thanni') || lower.includes('drank')) && 
    (lower.includes('ml') || lower.includes('glass') || lower.includes('bottle') || lower.includes('liter'));

  const isCardioLogging = /\b(walk|walking|walked|run|running|ran|jog|jogging|sprint|sprinting|cycling|cycle|cardio|treadmill)\b/i.test(lower) ||
    /\b\d+\s*(?:m|meters?|metres?|km|kms?|kilometers?|kilometres?|miles?|steps?)\b/i.test(lower);

  const isWorkoutLogging = (lower.includes('bench') || lower.includes('squat') || lower.includes('deadlift') || lower.includes('press') || lower.includes('curl')) &&
    (/\b\d+\s*sets?\b/i.test(lower) || /\b\d+\s*reps?\b/i.test(lower) || /\b\d+\s*kg\b/i.test(lower));

  const isFoodLogging = isExplicitLogAction && !isCardioLogging && !isWorkoutLogging && !isWaterLogging && !lower.includes('timer') && !isNavPattern;

  if (isFoodLogging || isWaterLogging || isWorkoutLogging || isCardioLogging) {
    return {
      type: 'log_data',
      payloadText: clean,
      rawText
    };
  }

  // 4. Default: Standard Conversational / General Intelligence Query
  return {
    type: 'chat',
    query: rawText
  };
}
