import { GoogleGenerativeAI } from '@google/generative-ai';
import { localParseMealText, searchFoodDatabase } from '../data/foodDatabase.js';

// Cache to prevent duplicate token costs
const queryCache = new Map();

function extractJSON(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {}
    }
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch (e3) {}
    }
  }
  return null;
}

export class AIService {
  constructor(apiKey = process.env.GEMINI_API_KEY) {
    this.apiKey = apiKey;
    this.modelName = 'gemini-3.5-flash-lite';
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  getGenAI() {
    if (!this.apiKey) return null;
    return new GoogleGenerativeAI(this.apiKey);
  }

  // Resilient multi-model executor with automatic failover to prevent 404 / 503 errors
  // Uses low-token Gemini 3.5 Flash Lite & 3.1 Flash Lite with 500 RPD rate limits
  async callModel(contentParts, config = {}, customModels = null) {
    if (!this.apiKey) return null;
    const genAI = this.getGenAI();
    if (!genAI) return null;

    const candidateModels = customModels && customModels.length > 0
      ? customModels
      : [
          this.modelName || 'gemini-3.5-flash-lite',
          'gemini-3.5-flash-lite',
          'gemini-3.1-flash-lite'
        ];
    const uniqueCandidates = [...new Set(candidateModels)];

    let lastError = null;
    for (const modelId of uniqueCandidates) {
      // 1. Attempt with config
      try {
        const model = genAI.getGenerativeModel({
          model: modelId,
          ...(config && Object.keys(config).length > 0 ? { generationConfig: config } : {})
        });
        const result = await model.generateContent(contentParts);
        return { result, modelId };
      } catch (err) {
        // 2. Retry without generationConfig if config caused error
        if (config && Object.keys(config).length > 0) {
          try {
            const fallbackModel = genAI.getGenerativeModel({ model: modelId });
            const result = await fallbackModel.generateContent(contentParts);
            return { result, modelId };
          } catch (err2) {
            lastError = err2;
          }
        } else {
          lastError = err;
        }
        console.warn(`[AI Model Fallback] ${modelId} returned: ${err.message.slice(0, 80)}, trying next model...`);
      }
    }
    throw lastError;
  }

  // Multimodal Voice Transcription for Universal Voice Logger
  async transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
    if (!this.apiKey) {
      throw new Error('Gemini API key is required for audio transcription');
    }
    const base64Data = audioBuffer.toString('base64');
    const prompt = `Listen to this fitness enthusiast's voice audio recording. They are speaking about South Indian food, gym exercises, scale weight, or water intake in Indian English or Tamil English.
Transcribe what they said word-for-word into English text (e.g. "I ate 3 idlis with sambar and 2 boiled eggs", "drank 500ml water", "flat bench press 3 sets 10 reps 60kg", "my weight is 110 kg").
Return ONLY the transcribed sentence as plain text without quotation marks, bullet points, or markdown formatting.`;

    const { result } = await this.callModel([
      {
        inlineData: {
          mimeType: mimeType || 'audio/webm',
          data: base64Data
        }
      },
      prompt
    ], {}, ['gemini-3.5-transcribe', 'gemini-2.5-flash', 'gemini-3.5-flash-lite']);

    const text = result?.response?.text();
    return (text || '').replace(/^["']|["']$/g, '').trim();
  }

  // 1. Analyze Meal Text (Natural Language)
  async analyzeMealText(text) {
    const cleanText = text.trim();
    const cacheKey = `meal_text:${cleanText.toLowerCase()}`;

    if (queryCache.has(cacheKey)) {
      return { ...queryCache.get(cacheKey), cached: true };
    }

    // Try Gemini if API key available
    if (this.apiKey) {
      try {
        const prompt = `
You are an expert sports nutritionist and food macro calculator.
Analyze the following meal description: "${cleanText}".

Deconstruct it into specific food items, estimate portion sizes, and calculate accurate macronutrients.
Return ONLY valid JSON matching this structure:
{
  "mealName": "Short descriptive title of meal",
  "items": [
    {
      "name": "Food item name",
      "quantity": "estimated portion e.g. 2 pieces or 150g",
      "calories": 250,
      "protein": 20.5,
      "carbs": 30.0,
      "fat": 5.0
    }
  ],
  "totalCalories": 250,
  "totalProtein": 20.5,
  "totalCarbs": 30.0,
  "totalFat": 5.0,
  "healthScore": 85,
  "nutritionNotes": "Short 1-sentence tip or macro observation"
}
`;

        const { result } = await this.callModel(prompt, { responseMimeType: 'application/json' });
        const rawText = result.response.text();
        const parsed = extractJSON(rawText) || JSON.parse(rawText);
        parsed.source = 'gemini-ai';
        queryCache.set(cacheKey, parsed);
        return parsed;
      } catch (err) {
        console.warn('Gemini API call failed or quota reached, falling back to local heuristic:', err.message);
      }
    }

    // Heuristic Fallback (Zero Token Consumption)
    const localItems = localParseMealText(cleanText);
    if (localItems.length > 0) {
      const totalCal = localItems.reduce((acc, it) => acc + it.calories, 0);
      const totalProt = localItems.reduce((acc, it) => acc + it.protein, 0);
      const totalCarb = localItems.reduce((acc, it) => acc + it.carbs, 0);
      const totalFat = localItems.reduce((acc, it) => acc + it.fat, 0);

      // Create a clean readable title from the matched item names
      const shortNames = localItems.map(it => {
        return it.name.split(' (')[0].split(' /')[0].trim();
      });
      const mealTitle = shortNames.join(' + ') || cleanText;

      const fallbackResult = {
        mealName: mealTitle,
        items: localItems,
        totalCalories: totalCal,
        totalProtein: Number(totalProt.toFixed(1)),
        totalCarbs: Number(totalCarb.toFixed(1)),
        totalFat: Number(totalFat.toFixed(1)),
        healthScore: 80,
        nutritionNotes: 'Calculated accurately from verified South Indian & Global Nutrition Database.',
        source: 'local-heuristic'
      };
      queryCache.set(cacheKey, fallbackResult);
      return fallbackResult;
    }

    // Default estimate if unknown
    return {
      mealName: cleanText.length > 35 ? cleanText.slice(0, 32) + '...' : cleanText,
      items: [
        { name: cleanText, quantity: '1 serving', calories: 250, protein: 12, carbs: 30, fat: 8 }
      ],
      totalCalories: 250,
      totalProtein: 12,
      totalCarbs: 30,
      totalFat: 8,
      healthScore: 70,
      nutritionNotes: 'Unrecognized custom food item (Standard portion heuristic).',
      source: 'local-heuristic'
    };
  }

  // 2. Photo/Image Meal Scanner (Multimodal Gemini Vision with strict Food Detection)
  async analyzeMealPhoto(imageBuffer, mimeType) {
    if (!this.apiKey) {
      return {
        isFood: false,
        needsApiKey: true,
        error: 'Google Gemini Vision API key is required to analyze photos. Please click the ⚙️ Settings icon in the top right to paste your free Gemini API key, or use the instant Food Search & Text Logger!'
      };
    }

    try {
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType || 'image/jpeg'
        }
      };

      const prompt = `
You are an expert AI food computer vision system.
Inspect this image carefully.

CRITICAL FIRST CHECK:
Does this image depict EDIBLE FOOD, A MEAL, BEVERAGE, OR GROCERY ITEM?
If the image shows a person, selfie, clothing, plaid/checkered shirt, vehicle, pet, room, document, or ANY NON-FOOD OBJECT:
You MUST return ONLY this JSON:
{
  "isFood": false,
  "detectedObject": "Brief description of what is visible (e.g. A person in a plaid shirt)",
  "error": "No food detected in this image. We detected a person / clothing. Please upload a clear photo of your food plate, meal, or drink."
}

IF AND ONLY IF REAL EDIBLE FOOD OR DRINK IS VISIBLE:
Return this JSON:
{
  "isFood": true,
  "mealName": "Brief descriptive title (e.g. Grilled Chicken Salad with Rice)",
  "items": [
    {
      "name": "Food item",
      "quantity": "estimated amount e.g. 150g or 1 cup",
      "calories": 200,
      "protein": 22.0,
      "carbs": 15.0,
      "fat": 5.0
    }
  ],
  "totalCalories": 450,
  "totalProtein": 35.0,
  "totalCarbs": 40.0,
  "totalFat": 12.0,
  "healthScore": 88,
  "nutritionNotes": "Visual observation: High protein, moderate carb meal with good fiber."
}
`;

      const { result } = await this.callModel(
        [prompt, imagePart], 
        { responseMimeType: 'application/json' }, 
        ['gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-3.1-flash-lite']
      );
      const rawText = result.response.text();
      const parsed = extractJSON(rawText) || JSON.parse(rawText);
      parsed.source = 'gemini-vision';
      return parsed;
    } catch (err) {
      console.error('Vision analysis error:', err);
      return {
        isFood: false,
        error: `Vision analysis failed: ${err.message}. Please try again with a clearer food photo.`
      };
    }
  }

  // 3. AI Workout Plan Analyzer
  async analyzeWorkoutPlan(planText, userProfile = {}) {
    const cacheKey = `workout_plan:${planText.trim().toLowerCase()}`;
    if (queryCache.has(cacheKey)) {
      return { ...queryCache.get(cacheKey), cached: true };
    }

    if (this.apiKey) {
      try {
        const prompt = `
You are an elite strength & conditioning coach and biomechanist.
The user's profile:
- Goal: ${userProfile.goal || 'Hypertrophy / Recomposition'}
- Daily target calories: ${userProfile.dailyTargetCalories || 2200} kcal
- Daily target protein: ${userProfile.dailyTargetProtein || 140} g

Critique this workout plan/split thoroughly:
"""
${planText}
"""

Evaluate:
1. Muscle Balance & Antagonist Ratios (Push vs Pull, Quad vs Hamstring/Posterior chain).
2. Volume & Recovery (Weekly sets per muscle group, frequency, rest days).
3. Progressive Overload Feasibility & Periodization.
4. Nutritional Synergy (Does user's diet fuel this volume? Suggestions).

Return ONLY valid JSON matching this schema:
{
  "planTitle": "Name of split",
  "overallScore": 88, // out of 100
  "summary": "2-3 sentence high level summary of the plan's strengths and weaknesses",
  "strengths": ["Strength point 1", "Strength point 2"],
  "weaknesses": ["Flaw or risk 1", "Missing element 2"],
  "muscleBalance": {
    "pushPullRatio": "Balanced (1:1.1)",
    "quadHamstringRatio": "Needs more hamstring/posterior work",
    "notes": "Detailed observation on muscle symmetry"
  },
  "volumeAndRecovery": {
    "weeklySetsPerMuscle": "12-16 sets (Optimal hypertrophy range)",
    "restDaysAdequacy": "Good: 1-2 rest days per week",
    "overtrainingRisk": "Low" // Low, Moderate, High
  },
  "progressiveOverloadRecommendations": [
    "Tip 1 for adding weight/reps safely",
    "Tip 2 for deload or set progression"
  ],
  "nutritionSynergy": {
    "calorieRecommendation": "Maintain slight surplus (+250 kcal) or recomp at target",
    "proteinAdequacy": "Optimal at 1.8g - 2.2g per kg of bodyweight",
    "timingTip": "Carb focus 60-90 min pre-workout and fast protein post-workout"
  }
}
`;

        const { result } = await this.callModel(prompt, { responseMimeType: 'application/json' });
        const rawText = result.response.text();
        const parsed = extractJSON(rawText) || JSON.parse(rawText);
        parsed.source = 'gemini-ai';
        queryCache.set(cacheKey, parsed);
        return parsed;
      } catch (err) {
        console.warn('Gemini workout analysis failed, running algorithmic analyzer:', err.message);
      }
    }

    // Heuristic Algorithmic Workout Plan Analyzer (Zero Token Consumption)
    const lower = planText.toLowerCase();
    const hasPush = lower.includes('bench') || lower.includes('push') || lower.includes('press') || lower.includes('chest');
    const hasPull = lower.includes('pull') || lower.includes('row') || lower.includes('deadlift') || lower.includes('lat');
    const hasLegs = lower.includes('squat') || lower.includes('leg') || lower.includes('lunge') || lower.includes('calf');
    const hasRest = lower.includes('rest') || lower.includes('recovery');

    let score = 75;
    const strengths = [];
    const weaknesses = [];

    if (hasPush && hasPull && hasLegs) {
      score += 15;
      strengths.push('Comprehensive split covering all major compound movement patterns (Push, Pull, Legs).');
    } else {
      score -= 10;
      weaknesses.push('Imbalanced muscle coverage: Ensure both upper body and lower body have dedicated volume.');
    }

    if (hasRest) {
      strengths.push('Designated rest/active recovery days included to prevent central nervous system fatigue.');
    } else {
      score -= 5;
      weaknesses.push('No explicit rest days detected: Aim for at least 1-2 full rest or active recovery days weekly.');
    }

    if (!lower.includes('rear delt') && !lower.includes('face pull')) {
      weaknesses.push('Potential rear delt & shoulder rotator cuff deficiency; add face pulls or reverse flyes.');
    } else {
      strengths.push('Great shoulder joint longevity work included.');
    }

    const fallbackAnalysis = {
      planTitle: 'Custom Workout Split',
      overallScore: Math.min(100, Math.max(50, score)),
      summary: 'Solid foundational routine with compound movements. Volume is well-structured for building muscle and functional strength.',
      strengths: strengths.length ? strengths : ['Good variety of compound exercises'],
      weaknesses: weaknesses.length ? weaknesses : ['Monitor weekly fatigue and progressive overload'],
      muscleBalance: {
        pushPullRatio: 'Balanced 1:1 ratio target',
        quadHamstringRatio: 'Ensure Romanian Deadlifts or Leg Curls match Squat volume',
        notes: 'Heuristic biomechanical check completed.'
      },
      volumeAndRecovery: {
        weeklySetsPerMuscle: 'Estimated 10-16 weekly sets',
        restDaysAdequacy: hasRest ? 'Adequate recovery' : 'Add 1-2 rest days',
        overtrainingRisk: 'Low'
      },
      progressiveOverloadRecommendations: [
        'Apply double progression: hit top of rep range (e.g. 10 reps) on all sets before increasing weight by 2.5kg.',
        'Track RPE (Rate of Perceived Exertion) and deload every 6-8 weeks.'
      ],
      nutritionSynergy: {
        calorieRecommendation: 'Keep calories aligned with daily targets',
        proteinAdequacy: 'Ensure 1.6 - 2.0g protein per kg bodyweight daily',
        timingTip: 'Eat high-carb meal 1-2 hours prior to heavy lifting'
      },
      source: 'heuristic-engine'
    };

    queryCache.set(cacheKey, fallbackAnalysis);
    return fallbackAnalysis;
  }

  // 3b. AI Dynamic Workout Plan Generator (Gemini + Sports-Science Engine)
  async generateWorkoutPlan({ splitType = 'PPL', goal = 'recomp', daysCount = 4, experienceLevel = 'intermediate', focusAreas = [], userProfile = {} }) {
    const cleanSplit = splitType || 'PPL';
    const cleanGoal = goal || userProfile.goal || 'recomp';
    const cleanDays = Math.min(7, Math.max(3, Number(daysCount) || 4));
    const cacheKey = `gen_workout:${cleanSplit}:${cleanGoal}:${cleanDays}:${(focusAreas || []).join(',')}:${experienceLevel}`;

    if (queryCache.has(cacheKey)) {
      return { ...queryCache.get(cacheKey), cached: true };
    }

    if (this.apiKey) {
      try {
        const prompt = `
You are an elite sports biomechanist and strength coach.
Generate a tailored, high-performance ${cleanDays}-day workout routine for a client:
- Primary Fitness Goal: ${cleanGoal}
- Preferred Split Style: ${cleanSplit}
- Experience Level: ${experienceLevel}
- Focus Areas: ${(focusAreas || []).join(', ') || 'Full body muscular balance'}
- Client Biometrics: Weight: ${userProfile.weightKg || 75}kg, Height: ${userProfile.heightCm || 175}cm, Age: ${userProfile.age || 25}, Gender: ${userProfile.gender || 'male'}

Return ONLY valid JSON with this exact structure:
{
  "planTitle": "${cleanSplit} ${cleanDays}-Day Tailored Split",
  "splitType": "${cleanSplit}",
  "goal": "${cleanGoal}",
  "daysCount": ${cleanDays},
  "rationale": "2-3 sentences explaining why this split maximizes results for ${cleanGoal}.",
  "days": [
    {
      "dayNumber": 1,
      "dayName": "Day 1 - Push Hypertrophy",
      "focus": "Chest, Front Delts, Triceps",
      "estimatedDurationMin": 50,
      "estimatedBurnKcal": 320,
      "warmup": "5 min dynamic shoulder & thoracic mobility",
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "targetMuscle": "Chest (Pectorals)",
          "sets": 4,
          "reps": "8-10",
          "restSec": 90,
          "coachingTip": "Retract scapulae, touch lower sternum, drive through palms.",
          "startingWeightKg": 60
        }
      ]
    }
  ],
  "recoveryTips": [
    "Prioritize 7-8 hours deep sleep for muscle protein synthesis.",
    "Stay hydrated with at least 3 liters of water on lifting days."
  ]
}
`;
        const { result } = await this.callModel(prompt, { responseMimeType: 'application/json' });
        const rawText = result.response.text();
        const parsed = extractJSON(rawText) || JSON.parse(rawText);
        parsed.source = 'gemini-ai';
        queryCache.set(cacheKey, parsed);
        return parsed;
      } catch (err) {
        console.warn('Gemini workout generation failed, using sports-science engine:', err.message);
      }
    }

    const fallbackPlan = this.generateAlgorithmicWorkoutSplit(cleanSplit, cleanGoal, cleanDays, focusAreas, userProfile);
    queryCache.set(cacheKey, fallbackPlan);
    return fallbackPlan;
  }

  // Sports-Science Algorithmic Workout Split Generator
  generateAlgorithmicWorkoutSplit(splitType, goal, daysCount, focusAreas = [], userProfile = {}) {
    const isCut = (goal || '').includes('cut');
    const isBulk = (goal || '').includes('bulk');
    const repRangeCompound = isCut ? '8-10' : isBulk ? '6-8' : '8-12';
    const repRangeIso = isCut ? '12-15' : '10-12';

    const pplDays = [
      {
        dayNumber: 1,
        dayName: 'Day 1 - Push (Chest, Shoulders, Triceps)',
        focus: 'Chest, Anterior Deltoids, Lateral Deltoids, Triceps',
        estimatedDurationMin: 55,
        estimatedBurnKcal: 340,
        warmup: 'Band pull-aparts, arm circles, rotator cuff rotations',
        exercises: [
          { name: 'Barbell Flat Bench Press', targetMuscle: 'Mid/Lower Chest', sets: 4, reps: repRangeCompound, restSec: 90, coachingTip: 'Arch lower back slightly, drive through heels', startingWeightKg: 60 },
          { name: 'Incline Dumbbell Press (30°)', targetMuscle: 'Upper Chest (Clavicular Head)', sets: 3, reps: '8-10', restSec: 75, coachingTip: 'Deep stretch at bottom, tuck elbows at 45°', startingWeightKg: 20 },
          { name: 'Standing Dumbbell Lateral Raises', targetMuscle: 'Lateral Deltoids', sets: 4, reps: repRangeIso, restSec: 60, coachingTip: 'Lead with elbows, slight forward lean', startingWeightKg: 10 },
          { name: 'Cable Tricep Rope Pushdowns', targetMuscle: 'Triceps Lateral/Medial Heads', sets: 3, reps: repRangeIso, restSec: 60, coachingTip: 'Lock elbows at sides, flare rope at bottom', startingWeightKg: 25 },
          { name: 'Overhead Cable Tricep Extension', targetMuscle: 'Triceps Long Head', sets: 3, reps: '10-12', restSec: 60, coachingTip: 'Full overhead stretch for tricep long head growth', startingWeightKg: 20 }
        ]
      },
      {
        dayNumber: 2,
        dayName: 'Day 2 - Pull (Back, Rear Delts, Biceps)',
        focus: 'Lats, Rhomboids, Traps, Rear Delts, Biceps',
        estimatedDurationMin: 55,
        estimatedBurnKcal: 360,
        warmup: 'Cat-cow stretches, thoracic extensions, active hangs',
        exercises: [
          { name: 'Barbell Conventional Deadlift', targetMuscle: 'Posterior Chain & Traps', sets: 3, reps: '5-6', restSec: 150, coachingTip: 'Brace core with Valsalva, push floor away', startingWeightKg: 90 },
          { name: 'Wide-Grip Lat Pulldown', targetMuscle: 'Latissimus Dorsi (Width)', sets: 4, reps: repRangeCompound, restSec: 75, coachingTip: 'Pull elbows straight down into pockets', startingWeightKg: 50 },
          { name: 'Chest-Supported Dumbbell Row', targetMuscle: 'Upper Back & Rhomboids (Thickness)', sets: 3, reps: '10-12', restSec: 75, coachingTip: 'Squeeze shoulder blades together at apex', startingWeightKg: 22 },
          { name: 'Cable Face Pulls', targetMuscle: 'Rear Delts & Rotator Cuff', sets: 4, reps: '15', restSec: 60, coachingTip: 'Pull rope toward eye-level, externally rotate thumbs back', startingWeightKg: 20 },
          { name: 'Incline Dumbbell Bicep Curl', targetMuscle: 'Biceps Long Head', sets: 3, reps: repRangeIso, restSec: 60, coachingTip: 'Supinate wrists at the top of contraction', startingWeightKg: 12 }
        ]
      },
      {
        dayNumber: 3,
        dayName: 'Day 3 - Legs & Core (Quads, Hamstrings, Calves)',
        focus: 'Quadriceps, Hamstrings, Glutes, Calves, Abs',
        estimatedDurationMin: 60,
        estimatedBurnKcal: 420,
        warmup: 'Bodyweight deep squats, leg swings, hip 90/90s',
        exercises: [
          { name: 'Barbell Back Squat', targetMuscle: 'Quadriceps & Glutes', sets: 4, reps: repRangeCompound, restSec: 120, coachingTip: 'Break at hips and knees together, hit parallel depth', startingWeightKg: 75 },
          { name: 'Romanian Deadlift (RDL)', targetMuscle: 'Hamstrings & Glute-Ham Tie-in', sets: 3, reps: '8-10', restSec: 90, coachingTip: 'Hinge hips back, feel hamstring stretch, neutral spine', startingWeightKg: 60 },
          { name: 'Leg Press (45-Degree)', targetMuscle: 'Quad Hypertrophy', sets: 3, reps: '10-12', restSec: 90, coachingTip: 'Do not lock out knees at top, deep knee bend', startingWeightKg: 140 },
          { name: 'Seated Hamstring Leg Curl', targetMuscle: 'Hamstring Hypertrophy', sets: 3, reps: '12-15', restSec: 60, coachingTip: 'Control the release, hold contraction for 1s', startingWeightKg: 40 },
          { name: 'Standing Calf Raise', targetMuscle: 'Gastrocnemius', sets: 4, reps: '15', restSec: 45, coachingTip: '2-second pause at bottom stretch on each rep', startingWeightKg: 50 },
          { name: 'Hanging Knee / Leg Raises', targetMuscle: 'Lower Rectus Abdominis', sets: 3, reps: '15', restSec: 45, coachingTip: 'Curl pelvis up towards chest, don’t swing', startingWeightKg: 0 }
        ]
      },
      {
        dayNumber: 4,
        dayName: 'Day 4 - Upper Body Power & Weak Points',
        focus: 'Upper Chest, Lats, Shoulders, Arms',
        estimatedDurationMin: 50,
        estimatedBurnKcal: 320,
        warmup: 'Band dislocates, scapular push-ups, light cable flyes',
        exercises: [
          { name: 'Standing Overhead Barbell Press (OHP)', targetMuscle: 'Anterior Deltoids & Triceps', sets: 4, reps: '6-8', restSec: 100, coachingTip: 'Squeeze glutes to protect spine, press head through window', startingWeightKg: 40 },
          { name: 'Pull-ups / Neutral-Grip Chin-ups', targetMuscle: 'Lats & Biceps', sets: 3, reps: '8-10', restSec: 90, coachingTip: 'Full extension at dead hang, chin over bar', startingWeightKg: 0 },
          { name: 'Dumbbell Incline Bench Press', targetMuscle: 'Upper Pectorals', sets: 3, reps: '10-12', restSec: 75, coachingTip: 'Slight tuck of elbows, deep active stretch', startingWeightKg: 24 },
          { name: 'Cable Lateral Raises (Behind Back)', targetMuscle: 'Lateral Deltoids', sets: 4, reps: '15', restSec: 45, coachingTip: 'Continuous tension through entire range of motion', startingWeightKg: 7.5 },
          { name: 'Barbell Preacher Curl / Hammer Curl', targetMuscle: 'Brachialis & Forearms', sets: 3, reps: '10-12', restSec: 60, coachingTip: 'Strict form, no swinging', startingWeightKg: 14 }
        ]
      }
    ];

    return {
      planTitle: `${splitType.toUpperCase()} ${daysCount}-Day Personalized Split`,
      splitType,
      goal,
      daysCount,
      rationale: `Algorithmically customized for your ${goal.replace(/_/g, ' ')} goal, balancing compound movements with high-yield isolation exercises for optimal hypertrophy and metabolic stimulus.`,
      days: pplDays.slice(0, daysCount),
      recoveryTips: [
        'Allow 48 hours between training the same muscle group directly.',
        'Drink 3-4 liters of water daily to maintain intracellular muscle volume.',
        'Track reps and loads in your Workout Tracker to enforce progressive overload.'
      ],
      source: 'biomechanics-engine'
    };
  }

  // 4. Interactive AI Fitness Coach Chat
  async askCoachChat(message, chatHistory = [], userProfile = {}, todayStats = {}) {
    if (this.apiKey) {
      try {
        const context = `
You are Antigravity Coach, an empathetic, scientifically grounded fitness & nutrition AI coach.
User Profile:
- Name: ${userProfile.name || 'Friend'}
- Age: ${userProfile.age || 24}, Gender: ${userProfile.gender || 'Male'}
- Weight: ${userProfile.weightKg || 72} kg, Height: ${userProfile.heightCm || 175} cm
- Goal: ${userProfile.goal || 'Body Recomposition'}
- Daily Calorie Target: ${userProfile.dailyTargetCalories || 2200} kcal
- Daily Protein Target: ${userProfile.dailyTargetProtein || 140} g

Today's Live Tracking Status:
- Calories Consumed Today: ${todayStats.consumedCalories || 0} kcal / ${userProfile.dailyTargetCalories || 2200} kcal
- Protein Consumed: ${todayStats.consumedProtein || 0} g / ${userProfile.dailyTargetProtein || 140} g
- Carbs Consumed: ${todayStats.consumedCarbs || 0} g
- Fat Consumed: ${todayStats.consumedFat || 0} g
- Water Drank: ${todayStats.waterMl || 0} ml / ${userProfile.dailyTargetWater || 3000} ml
- Fastrack Smartwatch Stats: ${todayStats.steps || 0} steps, ${todayStats.activeCaloriesBurned || 0} active kcal burned, ${todayStats.sleepHours || 7}h sleep.

Conversation History:
${chatHistory.slice(-6).map(m => `${m.sender}: ${m.text}`).join('\n')}

User's new message: "${message}"

Instructions:
- DIRECT ANSWER FIRST: Directly and specifically answer whatever the user asks. If they ask for dinner under 450 kcal, give the exact dish, portions, and calories immediately. If they ask for a "meals swap", explain exact food swaps (e.g. swapping rice for idli/dosa, or chicken for fish/eggs). If they ask about workouts or recovery, answer the question directly.
- DO NOT give generic boilerplate or canned responses. Never repeat the same generic advice.
- STRICT DIETARY RULE (SOUTH INDIAN ONLY):
  * The user strictly eats ONLY authentic South Indian food (Tamil Nadu, Kerala, Andhra/Telangana, Karnataka).
  * ABSOLUTELY NEVER recommend wheat roti, chapati, phulka, paratha, or North Indian dal tadka / paneer / Greek yogurt. The user cannot eat roti or dal.
  * ONLY recommend South Indian staples: Poondu Kara Kuzhambu (Karakolambu), Ennai Kathirikai Kuzhambu, Vatha Kuzhambu, Mor Kuzhambu, Kollu Rasam, Idli, Dosa (Plain, Egg, Podi, Kal Dosa, Pesarattu), Ven Pongal, Adai Avial, Kuzhi Paniyaram, Appam, Idiyappam, Cooked Ponni/Sona Masoori Rice, Chettinad Chicken, Nattu Kozhi Kuzhambu, Meen/Fish Curry, Muttai Podimas, Egg Thokku, Sambar, Rasam, Curd Rice (Thayir Sadam), Sundal (Kala Chana, Pattani, Pachai Payaru), Filter Coffee, Neer Mor.
  * Keep meals realistic and simple (2-3 items max per meal).
- MACRO PRECISION:
  * Reference their real profile numbers: Calorie target (${userProfile.dailyTargetCalories} kcal), Protein target (${userProfile.dailyTargetProtein}g), consumed calories, consumed protein, remaining macros, and Fastrack steps.
`;

        const { result } = await this.callModel(context);
        return {
          reply: result.response.text(),
          source: 'gemini-ai'
        };
      } catch (err) {
        console.warn('Gemini chat failed, fallback response used:', err.message);
      }
    }

    // Intelligent South Indian Nutrition & Biomechanics Expert Fallback
    return this.heuristicSouthIndianCoach(message, userProfile, todayStats);
  }

  // Context-aware South Indian Rule-Based Coach
  heuristicSouthIndianCoach(message, userProfile = {}, todayStats = {}) {
    const lower = message.toLowerCase().trim();
    const targetCal = Number(userProfile.dailyTargetCalories) || 2200;
    const targetProt = Number(userProfile.dailyTargetProtein) || 140;
    const consumedProt = Number(todayStats.consumedProtein) || 0;
    const consumedCal = Number(todayStats.consumedCalories) || 0;
    const remainingProt = Math.max(0, targetProt - consumedProt);
    const remainingCal = Math.max(0, targetCal - consumedCal);
    const name = userProfile.name || 'Friend';

    // 1. Meal Swaps & Alternatives
    if (lower.includes('swap') || lower.includes('change') || lower.includes('replace') || lower.includes('alternative') || lower.includes('substitute')) {
      return {
        reply: `Here is your high-protein South Indian **Macro Swap Guide**, ${name}!\n\n` +
          `Whenever you want to swap a meal or ingredient while maintaining your **${targetCal} kcal** and **${targetProt}g protein** targets, use these 1-to-1 equivalent swaps:\n\n` +
          `**Protein Swaps (~35g Protein):**\n` +
          `* **150g Chettinad Chicken Breast** (~220 kcal, 36g protein)\n` +
          `* **6 Boiled Egg Whites + 1 Whole Egg** (~170 kcal, 28g protein) or **Egg Podimas / Muttai Roast**\n` +
          `* **160g Vanjaram / Ayala Fish Curry** (~210 kcal, 32g protein)\n` +
          `* **1 Scoop Whey Protein in Water / Neer Mor** (~120 kcal, 25g protein)\n\n` +
          `**Carb Swaps (~45g Carbs / ~200 kcal):**\n` +
          `* **1.5 cups Cooked Ponni Rice** (210g) ↔ **3 Steamed Idlis** ↔ **2 Medium Plain / Kal Dosas** ↔ **1.5 cups Ven Pongal**\n\n` +
          `*Tip:* In the **AI Meal Planner** tab, you can also toggle between *South Indian Mixed*, *Eggetarian*, or *Non-Veg* to instantly re-roll your entire 7-day blueprint!`,
        source: 'south-indian-smart-engine'
      };
    }

    // 2. Low-Calorie / Specific Dinner (< 450 kcal or dinner under target)
    if (lower.includes('dinner') && (lower.includes('450') || lower.includes('under') || lower.includes('low') || lower.includes('light') || lower.includes('deficit'))) {
      return {
        reply: `Here is a power-packed South Indian dinner that delivers massive satiety and hits peak muscle protein synthesis under **450 kcal**, ${name}:\n\n` +
          `**South Indian Pepper Chicken Sukka with 2 Steamed Idlis**\n` +
          `* **The Protein Star:** 180g skinless chicken breast tossed in a pan with 1 tsp cold-pressed oil, mustard seeds, curry leaves, crushed black pepper, ginger-garlic paste, and turmeric. *(~240 kcal, 42g protein)*\n` +
          `* **The Smart Carb:** 2 medium steamed idlis dipped in a light tomato-rasam or clear drumstick sambar. *(~130 kcal, 4.5g protein)*\n` +
          `* **Fresh Side:** Sliced cucumber with lemon juice and salt. *(~25 kcal, 1g protein)*\n` +
          `* **Total: ~395 kcal | 47.5g Protein | ~30g Carbs | ~8g Fat**\n\n` +
          `*(Eggetarian Option: Swap chicken for **South Indian Muttai Podimas** made with 6 egg whites + 1 whole egg scrambled with onions and green chillies, paired with 1 medium Pesarattu for ~370 kcal and 32g protein).*`,
        source: 'south-indian-smart-engine'
      };
    }

    // 3. Dinner (General)
    if (lower.includes('dinner') || lower.includes('night') || lower.includes('supper')) {
      return {
        reply: `For dinner tonight, ${name}, keep it lean and easy to digest to support your **${targetCal} kcal** target and overnight muscle recovery:\n\n` +
          `**Option 1 (Non-Veg):** 200g South Indian Pepper Chicken Gravy with 1.5 cups Cooked Ponni Rice and a bowl of fresh Pepper Rasam. *(~490 kcal, 48g protein)*\n` +
          `**Option 2 (Egg/Veg):** 2 Egg Dosas with South Indian Tomato-Onion Chutney + 3 Boiled Egg Whites. *(~380 kcal, 28g protein)*\n\n` +
          `Aim to finish dinner 2.5 hours before sleep to maximize natural growth hormone and sleep quality!`,
        source: 'south-indian-smart-engine'
      };
    }

    // 4. Breakfast
    if (lower.includes('breakfast') || lower.includes('morning')) {
      return {
        reply: `Here is a high-protein South Indian breakfast engineered for your morning glycogen and muscle fueling, ${name}:\n\n` +
          `**Pesarattu (Green Moong Dal Dosa) with Boiled Eggs**\n` +
          `* **2 Medium Pesarattus:** Made from whole green gram batter, rich in fiber and sustained carbs. *(~280 kcal, 16g protein)*\n` +
          `* **3 Boiled Eggs (or 5 Egg Whites):** Seasoned with black pepper and salt. *(~216 kcal, 19g protein)*\n` +
          `* **Ginger (Allam) Chutney:** 2 tbsp. *(~45 kcal, 1g protein)*\n` +
          `* **Total: ~540 kcal | 36g Protein | ~44g Carbs | ~16g Fat**\n\n` +
          `*(Lighter Option: 3 Steamed Idlis with Drumstick Sambar + 4 Boiled Egg Whites: ~320 kcal, 23g protein).*`,
        source: 'south-indian-smart-engine'
      };
    }

    // 5. Lunch
    if (lower.includes('lunch') || lower.includes('afternoon')) {
      return {
        reply: `Here is a balanced South Indian lunch to power your afternoon, ${name}:\n\n` +
          `**Ponni Rice with Chettinad Chicken Curry & Thayir (Curd)**\n` +
          `* **Cooked Ponni Rice:** 1.5 cups (240g). *(~220 kcal, 5g protein)*\n` +
          `* **Chettinad Chicken Breast Curry:** 200g in roasted spice gravy. *(~310 kcal, 44g protein)*\n` +
          `* **Beans & Carrot Poriyal:** 1 cup. *(~90 kcal, 3g protein)*\n` +
          `* **Fresh Curd (Thayir):** 1 small bowl (100g). *(~65 kcal, 3.5g protein)*\n` +
          `* **Total: ~685 kcal | 55.5g Protein | ~65g Carbs | ~16g Fat**\n\n` +
          `*(Fish Option: Swap chicken for 180g Vanjaram / Ayala Fish Curry for rich Omega-3 fatty acids).* \n\n` +
          `*(Karakolambu / Egg Option: **Ponni Rice with Poondu Kara Kuzhambu (Garlic Karakolambu) + Muttai Podimas (3-egg scramble)** for ~580 kcal, 28g protein).*`,
        source: 'south-indian-smart-engine'
      };
    }

    // 6. Snacks
    if (lower.includes('snack') || lower.includes('tea') || lower.includes('evening') || lower.includes('coffee')) {
      return {
        reply: `For a clean South Indian evening snack that protects your caloric budget, ${name}:\n\n` +
          `1. **Kala Chana Sundal (Black Chickpeas):** 1 cup boiled and tempered with mustard seeds and curry leaves. *(~220 kcal, 12g protein)*\n` +
          `2. **Masala Neer Mor (Tempered Buttermilk):** Chilled spiced buttermilk with ginger, green chilli, and coriander. *(~45 kcal, 3g protein, zero sugar, high hydration)*\n` +
          `3. **Degree Filter Coffee:** Prepared with toned milk and no refined sugar. *(~65 kcal, 3.5g protein)*\n` +
          `4. **Quick Gym Option:** 4 boiled egg whites sprinkled with podi or black pepper. *(~68 kcal, 14g protein)*`,
        source: 'south-indian-smart-engine'
      };
    }

    // 7. Protein Advice
    if (lower.includes('protein')) {
      return {
        reply: `You currently have **${remainingProt.toFixed(0)}g protein remaining** to reach your **${targetProt}g daily target** today, ${name}.\n\n` +
          `Top authentic South Indian sources to hit that target quickly:\n` +
          `* **Chicken Breast Sukka / Curry (200g):** ~46g lean protein\n` +
          `* **Boiled Egg Whites (6 whites):** ~21g pure protein (~100 kcal)\n` +
          `* **Vanjaram / Ayala Fish (180g):** ~36g protein + Omega-3s\n` +
          `* **South Indian Muttai Podimas (3 eggs):** ~20g protein\n` +
          `* **Kala Chana / Pattani Sundal (1 cup):** ~12g plant protein\n` +
          `* **Whey Protein (1 scoop):** ~25g instant protein in water or Neer Mor.`,
        source: 'south-indian-smart-engine'
      };
    }

    // 8. Workout / Training
    if (lower.includes('workout') || lower.includes('gym') || lower.includes('exercise') || lower.includes('chest') || lower.includes('leg') || lower.includes('back')) {
      return {
        reply: `Scientific training advice for your frame, ${name}:\n\n` +
          `* **Progressive Overload:** Focus on tracking your working weight and reps in the **Workout Logger** tab. Aim to add 1 rep or 1-2.5 kg each week.\n` +
          `* **Rest Periods:** Keep compound lifts (Squat, Bench Press, Deadlift) at **90–120 seconds rest** using the built-in Rest Timer, and isolation moves at **60 seconds**.\n` +
          `* **Hydration:** For your 210 cm height, aim for at least 4.2 Liters of water daily to maintain intracellular muscle hydration and strength output.`,
        source: 'south-indian-smart-engine'
      };
    }

    // 9. Fastrack / Steps
    if (lower.includes('step') || lower.includes('watch') || lower.includes('fastrack') || lower.includes('burn')) {
      const steps = todayStats.steps || 0;
      const activeKcal = todayStats.activeCaloriesBurned || 0;
      return {
        reply: `Your Fastrack Smartwatch live metrics:\n\n` +
          `* **Steps Tracked:** ${steps.toLocaleString()} / 10,000 steps\n` +
          `* **Active Calorie Burn:** +${activeKcal} kcal\n` +
          `* **Heart Rate & Sleep:** Monitored live via direct Bluetooth stream.\n\n` +
          `A 15-minute brisk walk after meals significantly blunts postprandial glucose spikes and boosts your daily neat energy expenditure. Keep stepping, ${name}!`,
        source: 'south-indian-smart-engine'
      };
    }

    // 10. General Comprehensive Catch-All
    return {
      reply: `Hey ${name}! I'm tracking your progress toward your **${targetCal} kcal** and **${targetProt}g protein** targets.\n\n` +
        `* Today's Intake: **${consumedCal} kcal** logged, **${consumedProt.toFixed(0)}g protein**.\n` +
        `* Remaining Target: **${remainingCal} kcal** and **${remainingProt.toFixed(0)}g protein** to hit your goal.\n\n` +
        `Ask me anything specific like: *"Suggest a dinner under 450 kcal"*, *"How do I swap my lunch?"*, *"High protein South Indian snacks"*, or *"Pre-workout meal"* and I'll give you exact dishes and macros!`,
      source: 'south-indian-smart-engine'
    };
  }

  // 5. Instant South Indian Calorie & Macro Target Meal Blueprint Engine (< 5ms calculation)
  async generateDailyMealPlan(userProfile = {}, preference = 'south_indian_mixed', daysCount = 7) {
    const targetCal = Number(userProfile.dailyTargetCalories) || 2100;
    const targetProt = Number(userProfile.dailyTargetProtein) || 140;
    const targetCarb = Number(userProfile.dailyTargetCarbs) || 220;
    const targetFat = Number(userProfile.dailyTargetFat) || 60;
    const goal = userProfile.goal || 'cutting';

    const cacheKey = `meal_plan:${targetCal}:${targetProt}:${preference}:${daysCount}`;
    if (queryCache.has(cacheKey)) {
      return { ...queryCache.get(cacheKey), cached: true };
    }

    // 100% Authentic South Indian 7-Day Instant Calculation Engine (Zero North Indian dishes, Max 2-3 items/meal)
    const isVegOnly = preference === 'south_indian_veg';
    const scale = Math.max(0.7, targetCal / 2400);
    const eggCountMultiplier = Math.max(1, Math.round(targetProt / 100));

    // 7 Distinct 100% Home-Cooked Authentic South Indian Days (Simple everyday home meals, rare chicken/fish)
    const SOUTH_INDIAN_7_DAYS = [
      // Day 1: Monday (Simple Home Chicken Curry & Idli)
      {
        day: 'Monday',
        type: 'non_veg',
        breakfast: {
          title: 'Steamed Idlis with Drumstick Sambar & Boiled Eggs',
          foods: [
            { name: 'Steamed Idli', basePortion: 4, unit: 'pieces', cal: 65, prot: 2.3, carb: 13, fat: 0.3 },
            { name: 'Drumstick Sambar', basePortion: 1, unit: 'bowl (200ml)', cal: 140, prot: 6.5, carb: 22, fat: 2.8 },
            { name: isVegOnly ? 'Roasted Chana Sundal' : 'Boiled Eggs', basePortion: isVegOnly ? 1 : 3, unit: isVegOnly ? 'cup' : 'large eggs', cal: isVegOnly ? 190 : 72, prot: isVegOnly ? 11 : 6.3, carb: isVegOnly ? 30 : 0.4, fat: isVegOnly ? 3 : 5.0 }
          ]
        },
        lunch: {
          title: isVegOnly ? 'Ponni Rice with Paruppu Urundai Kuzhambu & Poriyal' : 'Ponni Rice with Simple Home Chicken Curry & Fresh Thayir',
          foods: [
            { name: 'Cooked Ponni Rice', basePortion: 1.8, unit: 'cups (280g)', cal: 200, prot: 4.2, carb: 45, fat: 0.4 },
            { name: isVegOnly ? 'Paruppu Urundai Kuzhambu' : 'Simple Home Chicken Curry (Veetu Kozhi Curry)', basePortion: 1.2, unit: 'bowls (240g)', cal: isVegOnly ? 230 : 310, prot: isVegOnly ? 11.5 : 32, carb: isVegOnly ? 26 : 7, fat: isVegOnly ? 9 : 16 },
            { name: isVegOnly ? 'Beans & Carrot Poriyal' : 'Fresh Curd (Thayir)', basePortion: 1, unit: isVegOnly ? 'cup (120g)' : 'bowl (150g)', cal: isVegOnly ? 90 : 95, prot: isVegOnly ? 3.0 : 5.0, carb: isVegOnly ? 10 : 6.5, fat: isVegOnly ? 4.5 : 5.5 }
          ]
        },
        snack: {
          title: 'Kala Chana Sundal & Degree Filter Coffee',
          foods: [
            { name: 'Black Chickpea Sundal', basePortion: 1.2, unit: 'cups (150g)', cal: 220, prot: 12.0, carb: 35, fat: 3.5 },
            { name: 'Degree Filter Coffee (with Toned Milk)', basePortion: 1, unit: 'davarah (150ml)', cal: 65, prot: 3.5, carb: 8, fat: 1.5 }
          ]
        },
        dinner: {
          title: isVegOnly ? 'Crispy Plain Dosa with Tomato Chutney & Sundal' : 'Crispy Plain Dosa with Tomato Chutney & Boiled Eggs',
          foods: [
            { name: 'Crispy Plain Dosa', basePortion: 2.5, unit: 'medium dosas', cal: 133, prot: 3.2, carb: 23, fat: 3.0 },
            { name: 'South Indian Tomato Chutney', basePortion: 1, unit: 'serving (60g)', cal: 60, prot: 1.5, carb: 7, fat: 3.0 },
            { name: isVegOnly ? 'Pachai Payaru Sundal' : 'Boiled Eggs', basePortion: isVegOnly ? 1 : 3, unit: isVegOnly ? 'cup' : 'large eggs', cal: isVegOnly ? 210 : 72, prot: isVegOnly ? 13 : 6.3, carb: isVegOnly ? 34 : 0.4, fat: isVegOnly ? 2.5 : 5.0 }
          ]
        }
      },

      // Day 2: Tuesday (Karakolambu Special: Poondu Kara Kuzhambu & Muttai Podimas)
      {
        day: 'Tuesday',
        type: 'veg_egg',
        breakfast: {
          title: 'Ven Pongal with Drumstick Sambar & Boiled Eggs',
          foods: [
            { name: 'South Indian Ven Pongal (Rice & Moong Dal)', basePortion: 1.5, unit: 'cups (250g)', cal: 320, prot: 9.0, carb: 48, fat: 10.5 },
            { name: 'Drumstick Sambar', basePortion: 1, unit: 'bowl (200ml)', cal: 140, prot: 6.5, carb: 22, fat: 2.8 },
            { name: isVegOnly ? 'White Chana Sundal' : 'Boiled Eggs', basePortion: isVegOnly ? 1 : 3, unit: isVegOnly ? 'cup' : 'large eggs', cal: isVegOnly ? 190 : 72, prot: isVegOnly ? 11 : 6.3, carb: isVegOnly ? 31 : 0.4, fat: isVegOnly ? 3 : 5.0 }
          ]
        },
        lunch: {
          title: isVegOnly ? 'Ponni Rice with Poondu Kara Kuzhambu (Garlic Karakolambu) & Poriyal' : 'Ponni Rice with Poondu Kara Kuzhambu (Garlic Karakolambu) & Muttai Podimas',
          foods: [
            { name: 'Cooked Ponni Rice', basePortion: 1.8, unit: 'cups (280g)', cal: 200, prot: 4.2, carb: 45, fat: 0.4 },
            { name: 'Poondu Kara Kuzhambu / Karakolambu (Garlic Tamarind Curry)', basePortion: 1.2, unit: 'bowls (200ml)', cal: 150, prot: 3.0, carb: 16, fat: 8.5 },
            { name: isVegOnly ? 'Cabbage Poriyal with Coconut' : 'Muttai Podimas (Simple Home Egg Scramble with Onions & Chillies)', basePortion: isVegOnly ? 1 : 3, unit: isVegOnly ? 'cup (120g)' : 'eggs scramble', cal: isVegOnly ? 85 : 90, prot: isVegOnly ? 2.5 : 7.0, carb: isVegOnly ? 9 : 2, fat: isVegOnly ? 4.5 : 6.0 }
          ]
        },
        snack: {
          title: 'Boiled Peanuts Sundal & South Indian Filter Coffee',
          foods: [
            { name: 'Boiled Peanuts Sundal', basePortion: 1, unit: 'cup (120g)', cal: 240, prot: 11.5, carb: 14, fat: 17.0 },
            { name: 'Degree Filter Coffee', basePortion: 1, unit: 'davarah (150ml)', cal: 65, prot: 3.5, carb: 8, fat: 1.5 }
          ]
        },
        dinner: {
          title: isVegOnly ? 'Pesarattu with Allam (Ginger) Chutney & Sambar' : 'Pesarattu (Green Moong Dal Dosa) with Allam Chutney & Boiled Eggs',
          foods: [
            { name: 'Pesarattu (Whole Green Gram Dosa)', basePortion: 2.5, unit: 'medium dosas', cal: 150, prot: 8.0, carb: 22, fat: 3.5 },
            { name: 'Allam (Ginger) Chutney', basePortion: 1, unit: 'serving (50g)', cal: 55, prot: 1.0, carb: 8, fat: 2.5 },
            { name: isVegOnly ? 'Drumstick Sambar' : 'Boiled Eggs', basePortion: isVegOnly ? 1 : 3, unit: isVegOnly ? 'bowl' : 'large eggs', cal: isVegOnly ? 140 : 72, prot: isVegOnly ? 6.5 : 6.3, carb: isVegOnly ? 22 : 0.4, fat: isVegOnly ? 2.8 : 5.0 }
          ]
        }
      },

      // Day 3: Wednesday (Home Pepper Rasam & Egg Podimas / Rare Fish Option)
      {
        day: 'Wednesday',
        type: 'veg_egg',
        breakfast: {
          title: 'Podi Dosa (with Gingelly Oil) & Sambar with Boiled Eggs',
          foods: [
            { name: 'Podi Dosa (with Gingelly Oil)', basePortion: 2.5, unit: 'dosas', cal: 165, prot: 4.5, carb: 24, fat: 5.5 },
            { name: 'Drumstick Sambar', basePortion: 1, unit: 'bowl (200ml)', cal: 140, prot: 6.5, carb: 22, fat: 2.8 },
            { name: isVegOnly ? 'Roasted Bengal Gram' : 'Boiled Eggs', basePortion: isVegOnly ? 1 : 3, unit: isVegOnly ? 'serving' : 'large eggs', cal: isVegOnly ? 180 : 72, prot: isVegOnly ? 9 : 6.3, carb: isVegOnly ? 8 : 0.4, fat: isVegOnly ? 14 : 5.0 }
          ]
        },
        lunch: {
          title: isVegOnly ? 'Ponni Rice with Mor Kuzhambu & Cabbage Poriyal' : 'Ponni Rice with Pepper Garlic Rasam & Muttai Podimas (or Home Fish Curry)',
          foods: [
            { name: 'Cooked Ponni Rice', basePortion: 1.8, unit: 'cups (280g)', cal: 200, prot: 4.2, carb: 45, fat: 0.4 },
            { name: isVegOnly ? 'Mor Kuzhambu / Pulissery' : 'Pepper Garlic Rasam (Milagu Poondu Rasam)', basePortion: 1.2, unit: 'bowls (220ml)', cal: isVegOnly ? 155 : 45, prot: isVegOnly ? 4.5 : 2.0, carb: isVegOnly ? 11 : 7, fat: isVegOnly ? 10 : 1.0 },
            { name: isVegOnly ? 'Cabbage Poriyal with Coconut' : 'Muttai Podimas (Simple Home Egg Scramble with Onions & Chillies)', basePortion: isVegOnly ? 1 : 3, unit: isVegOnly ? 'cup (120g)' : 'eggs scramble', cal: isVegOnly ? 85 : 90, prot: isVegOnly ? 2.5 : 7.0, carb: isVegOnly ? 9 : 2, fat: isVegOnly ? 4.5 : 6.0 }
          ]
        },
        snack: {
          title: 'Masala Neer Mor & Roasted Bengal Gram (Pottukadalai)',
          foods: [
            { name: 'Masala Neer Mor (Buttermilk with Ginger & Curry Leaves)', basePortion: 1.5, unit: 'glasses (350ml)', cal: 50, prot: 3.5, carb: 5, fat: 1.5 },
            { name: 'Roasted Bengal Gram (Pottukadalai)', basePortion: 1, unit: 'cup (60g)', cal: 220, prot: 12.5, carb: 34, fat: 3.5 }
          ]
        },
        dinner: {
          title: isVegOnly ? 'Steamed Idiyappam with Coconut Veg Kurma & Rasam' : 'Steamed Idiyappam (String Hoppers) with Simple Home Egg Curry (Muttai Kuzhambu)',
          foods: [
            { name: 'Steamed Idiyappam (Sevai)', basePortion: 4, unit: 'cakes (200g)', cal: 80, prot: 1.8, carb: 18, fat: 0.3 },
            { name: isVegOnly ? 'Vegetable Coconut Kurma' : 'South Indian Muttai Kuzhambu (Egg Curry)', basePortion: 1.2, unit: 'bowls', cal: isVegOnly ? 190 : 260, prot: isVegOnly ? 4.5 : 16, carb: isVegOnly ? 16 : 9, fat: isVegOnly ? 12 : 17 },
            { name: 'Tomato Garlic Rasam', basePortion: 1, unit: 'cup (180ml)', cal: 45, prot: 1.5, carb: 7, fat: 1.0 }
          ]
        }
      },

      // Day 4: Thursday (Ennai Kathirikai Karakolambu & Adai Avial Day)
      {
        day: 'Thursday',
        type: 'veg_egg',
        breakfast: {
          title: isVegOnly ? 'Adai Avial (Multi-Lentil High-Protein Pancake with Coconut Avial)' : 'Adai Avial with Boiled Eggs',
          foods: [
            { name: 'Adai (High-Protein Multi-Lentil Pancake)', basePortion: 2.5, unit: 'adais', cal: 170, prot: 7.2, carb: 23, fat: 5.5 },
            { name: 'Kerala Avial (Mixed Vegetables in Coconut & Curd)', basePortion: 1, unit: 'bowl (150g)', cal: 160, prot: 3.5, carb: 14, fat: 10.5 },
            { name: isVegOnly ? 'Coconut Chutney' : 'Boiled Eggs', basePortion: isVegOnly ? 1 : 3, unit: isVegOnly ? 'serving (40g)' : 'large eggs', cal: isVegOnly ? 85 : 72, prot: isVegOnly ? 1.2 : 6.3, carb: isVegOnly ? 3.5 : 0.4, fat: isVegOnly ? 7.5 : 5.0 }
          ]
        },
        lunch: {
          title: isVegOnly ? 'Ponni Rice with Ennai Kathirikai Kara Kuzhambu (Brinjal Karakolambu) & Potato Roast' : 'Ponni Rice with Ennai Kathirikai Kara Kuzhambu (Brinjal Karakolambu) & South Indian Omelet',
          foods: [
            { name: 'Cooked Ponni Rice', basePortion: 1.8, unit: 'cups (280g)', cal: 200, prot: 4.2, carb: 45, fat: 0.4 },
            { name: 'Ennai Kathirikai Kara Kuzhambu / Karakolambu (Baby Brinjal Curry)', basePortion: 1.2, unit: 'bowls (180g)', cal: 195, prot: 3.2, carb: 16, fat: 13.5 },
            { name: isVegOnly ? 'Potato Roast (Urulai Varuval)' : 'South Indian Egg Omelet (with Onions & Pepper)', basePortion: isVegOnly ? 1 : 2.5, unit: isVegOnly ? 'cup' : 'eggs omelet', cal: isVegOnly ? 195 : 95, prot: isVegOnly ? 3.5 : 7.2, carb: isVegOnly ? 28 : 1.5, fat: isVegOnly ? 8.0 : 7.0 }
          ]
        },
        snack: {
          title: 'Pachai Payaru (Green Gram) Sundal & Degree Filter Coffee',
          foods: [
            { name: 'Pachai Payaru Sundal', basePortion: 1.2, unit: 'cups (150g)', cal: 210, prot: 13.0, carb: 34, fat: 2.5 },
            { name: 'Degree Filter Coffee', basePortion: 1, unit: 'davarah (150ml)', cal: 65, prot: 3.5, carb: 8, fat: 1.5 }
          ]
        },
        dinner: {
          title: isVegOnly ? 'Steamed Idlis with Kara Chutney & Sambar' : 'Steamed Idlis with Kara Chutney & Boiled Eggs',
          foods: [
            { name: 'Steamed Idli', basePortion: 4, unit: 'pieces', cal: 65, prot: 2.3, carb: 13, fat: 0.3 },
            { name: 'Kara Chutney (Spicy Onion Garlic Red Chutney)', basePortion: 1, unit: 'serving (60g)', cal: 55, prot: 1.5, carb: 6, fat: 3.0 },
            { name: isVegOnly ? 'Drumstick Sambar' : 'Boiled Eggs', basePortion: isVegOnly ? 1 : 3, unit: isVegOnly ? 'bowl' : 'large eggs', cal: isVegOnly ? 140 : 72, prot: isVegOnly ? 6.5 : 6.3, carb: isVegOnly ? 22 : 0.4, fat: isVegOnly ? 2.8 : 5.0 }
          ]
        }
      },

      // Day 5: Friday (Kuzhi Paniyaram & Kollu Rasam Home Special)
      {
        day: 'Friday',
        type: 'veg_egg',
        breakfast: {
          title: isVegOnly ? 'Chettinad Kuzhi Paniyaram with Kara Chutney & Sambar' : 'Chettinad Kuzhi Paniyaram with Kara Chutney & Boiled Eggs',
          foods: [
            { name: 'Chettinad Kuzhi Paniyaram (Crispy Rice & Dal Dumplings)', basePortion: 6, unit: 'pieces', cal: 46, prot: 1.1, carb: 7.2, fat: 1.4 },
            { name: 'Kara Chutney (Spicy Onion Garlic Chutney)', basePortion: 1, unit: 'serving (60g)', cal: 55, prot: 1.5, carb: 6, fat: 3.0 },
            { name: isVegOnly ? 'Drumstick Sambar' : 'Boiled Eggs', basePortion: isVegOnly ? 1 : 3, unit: isVegOnly ? 'bowl' : 'large eggs', cal: isVegOnly ? 140 : 72, prot: isVegOnly ? 6.5 : 6.3, carb: isVegOnly ? 22 : 0.4, fat: isVegOnly ? 2.8 : 5.0 }
          ]
        },
        lunch: {
          title: isVegOnly ? 'Ponni Rice with Kollu Rasam (Horse Gram Fat-Loss Soup) & Urulaikizhangu Roast' : 'Ponni Rice with Kollu Rasam & Muttai Podimas (Simple Home Egg Scramble)',
          foods: [
            { name: 'Cooked Ponni Rice', basePortion: 1.8, unit: 'cups (280g)', cal: 200, prot: 4.2, carb: 45, fat: 0.4 },
            { name: 'Kollu Rasam (Horse Gram Fat-Loss & Endurance Soup)', basePortion: 1.2, unit: 'bowls (220ml)', cal: 55, prot: 3.5, carb: 8, fat: 1.0 },
            { name: isVegOnly ? 'Potato Roast (Urulai Kizhangu Varuval)' : 'Muttai Podimas (Simple Home Egg Scramble with Onions & Chillies)', basePortion: isVegOnly ? 1 : 3, unit: isVegOnly ? 'cup (130g)' : 'eggs scramble', cal: isVegOnly ? 195 : 90, prot: isVegOnly ? 3.5 : 7.0, carb: isVegOnly ? 28 : 2, fat: isVegOnly ? 8.0 : 6.0 }
          ]
        },
        snack: {
          title: 'Karamani (Black-eyed Pea) Sundal & Degree Filter Coffee',
          foods: [
            { name: 'Karamani Sundal', basePortion: 1.2, unit: 'cups (150g)', cal: 200, prot: 12.0, carb: 33, fat: 2.5 },
            { name: 'Degree Filter Coffee', basePortion: 1, unit: 'davarah (150ml)', cal: 65, prot: 3.5, carb: 8, fat: 1.5 }
          ]
        },
        dinner: {
          title: isVegOnly ? 'Plain Kal Dosa with Tomato Chutney & Fresh Curd' : '2 Egg Dosas (Muttai Dosa with Pepper & Curry Leaves) with Tomato Chutney',
          foods: [
            { name: isVegOnly ? 'Kal Dosa (Soft Sponge Dosa)' : 'Egg Dosa (Muttai Dosa with Pepper & Curry Leaves)', basePortion: isVegOnly ? 2.5 : 2, unit: isVegOnly ? 'dosas' : 'egg dosas', cal: isVegOnly ? 120 : 210, prot: isVegOnly ? 3.0 : 11.5, carb: isVegOnly ? 22 : 22, fat: isVegOnly ? 2 : 8.5 },
            { name: 'Tomato Chutney', basePortion: 1, unit: 'serving (60g)', cal: 60, prot: 1.5, carb: 7, fat: 3.0 },
            { name: 'Fresh Curd (Thayir)', basePortion: 1, unit: 'cup (120g)', cal: 80, prot: 4.0, carb: 5.5, fat: 4.5 }
          ]
        }
      },

      // Day 6: Saturday (Vatha Kuzhambu & Curd Rice Special)
      {
        day: 'Saturday',
        type: 'veg_egg',
        breakfast: {
          title: isVegOnly ? 'Kerala Appam with Vegetable Coconut Kurma' : 'Kerala Appam with Coconut Kurma & Boiled Eggs',
          foods: [
            { name: 'Appam (Soft fermented rice hopper)', basePortion: 3, unit: 'pieces', cal: 95, prot: 2.0, carb: 20, fat: 1.0 },
            { name: 'South Indian Vegetable Coconut Kurma', basePortion: 1, unit: 'bowl (200g)', cal: 180, prot: 4.5, carb: 18, fat: 10.0 },
            { name: isVegOnly ? 'Kala Chana Sundal' : 'Boiled Eggs', basePortion: isVegOnly ? 1 : 3, unit: isVegOnly ? 'cup' : 'large eggs', cal: isVegOnly ? 190 : 72, prot: isVegOnly ? 11 : 6.3, carb: isVegOnly ? 31 : 0.4, fat: isVegOnly ? 3 : 5.0 }
          ]
        },
        lunch: {
          title: isVegOnly ? 'Ponni Rice with Vatha Kuzhambu (Sundakkai Tamarind Curry) & Keerai Kootu' : 'Ponni Rice with Vatha Kuzhambu (Sundakkai Tamarind Curry) & Muttai Thokku',
          foods: [
            { name: 'Cooked Ponni Rice', basePortion: 1.8, unit: 'cups (280g)', cal: 200, prot: 4.2, carb: 45, fat: 0.4 },
            { name: 'Vatha Kuzhambu / Vathal Kolambu', basePortion: 1.2, unit: 'ladles (100ml)', cal: 135, prot: 2.0, carb: 13, fat: 8.5 },
            { name: isVegOnly ? 'Keerai Kootu (Spinach Lentil Mash)' : 'Egg Thokku (Spicy Boiled Egg Roast)', basePortion: isVegOnly ? 1 : 3, unit: isVegOnly ? 'bowl (160g)' : 'eggs with gravy', cal: isVegOnly ? 130 : 85, prot: isVegOnly ? 6.0 : 6.8, carb: isVegOnly ? 16 : 3, fat: isVegOnly ? 4.5 : 5.5 }
          ]
        },
        snack: {
          title: 'Masala Neer Mor & Boiled Eggs',
          foods: [
            { name: 'Masala Neer Mor (Buttermilk)', basePortion: 1.5, unit: 'glasses (350ml)', cal: 50, prot: 3.5, carb: 5, fat: 1.5 },
            { name: isVegOnly ? 'Pattani (Peas) Sundal' : 'Boiled Eggs', basePortion: isVegOnly ? 1 : 2, unit: isVegOnly ? 'cup' : 'large eggs', cal: isVegOnly ? 205 : 72, prot: isVegOnly ? 11.5 : 6.3, carb: isVegOnly ? 34 : 0.4, fat: isVegOnly ? 2.5 : 5.0 }
          ]
        },
        dinner: {
          title: isVegOnly ? 'Curd Rice (Thayir Sadam) with Potato Roast & Pickle' : 'Curd Rice (Thayir Sadam) with South Indian Egg Thokku (Muttai Thokku)',
          foods: [
            { name: 'South Indian Curd Rice (Tempered Thayir Sadam)', basePortion: 1.8, unit: 'cups (280g)', cal: 210, prot: 5.5, carb: 38, fat: 4.5 },
            { name: isVegOnly ? 'Potato Roast (Urulai Varuval)' : 'Egg Thokku (Spicy Boiled Egg Roast)', basePortion: isVegOnly ? 1 : 3, unit: isVegOnly ? 'bowl' : 'eggs with gravy', cal: isVegOnly ? 195 : 85, prot: isVegOnly ? 3.5 : 6.8, carb: isVegOnly ? 28 : 3, fat: isVegOnly ? 8.0 : 5.5 },
            { name: 'South Indian Mango / Mavadu Pickle', basePortion: 1, unit: 'tsp', cal: 20, prot: 0.2, carb: 1, fat: 1.5 }
          ]
        }
      },

      // Day 7: Sunday (Simple Home Chicken Biryani Feast & Kal Dosa Special)
      {
        day: 'Sunday',
        type: 'non_veg',
        breakfast: {
          title: isVegOnly ? 'Steamed Idlis with Drumstick Sambar & Coconut Chutney' : 'Steamed Idlis with Simple Home Chicken Gravy & Boiled Eggs',
          foods: [
            { name: 'Steamed Idli', basePortion: 4, unit: 'pieces', cal: 65, prot: 2.3, carb: 13, fat: 0.3 },
            { name: isVegOnly ? 'Drumstick Sambar' : 'South Indian Chicken Salna / Korma (Madurai Salna)', basePortion: 1.2, unit: 'bowls (220ml)', cal: isVegOnly ? 140 : 230, prot: isVegOnly ? 6.5 : 18, carb: isVegOnly ? 22 : 8, fat: isVegOnly ? 2.8 : 14 },
            { name: isVegOnly ? 'Coconut Chutney' : 'Boiled Eggs', basePortion: isVegOnly ? 1 : 2, unit: isVegOnly ? 'serving' : 'large eggs', cal: isVegOnly ? 95 : 72, prot: isVegOnly ? 1.8 : 6.3, carb: isVegOnly ? 4 : 0.4, fat: isVegOnly ? 8.5 : 5.0 }
          ]
        },
        lunch: {
          title: isVegOnly ? 'Simple Home Vegetable Biryani with Thayir Raitha & Sundal' : 'Simple Home Chicken Biryani with Thayir Raitha & Boiled Egg',
          foods: [
            { name: isVegOnly ? 'South Indian Vegetable Biryani' : 'Simple Home Chicken Biryani (Veetu Chicken Biryani)', basePortion: 2, unit: 'cups (320g)', cal: isVegOnly ? 240 : 320, prot: isVegOnly ? 6 : 22, carb: isVegOnly ? 46 : 38, fat: isVegOnly ? 7 : 11 },
            { name: 'Onion Pachadi (Thayir Raitha)', basePortion: 1, unit: 'bowl (150g)', cal: 85, prot: 3.5, carb: 7, fat: 4.5 },
            { name: isVegOnly ? 'Kala Chana Sundal' : 'Boiled Egg', basePortion: isVegOnly ? 1 : 2, unit: isVegOnly ? 'cup' : 'large eggs', cal: isVegOnly ? 190 : 72, prot: isVegOnly ? 11 : 6.3, carb: isVegOnly ? 31 : 0.4, fat: isVegOnly ? 3 : 5.0 }
          ]
        },
        snack: {
          title: 'Kala Chana Sundal & Degree Filter Coffee',
          foods: [
            { name: 'Kala Chana Sundal', basePortion: 1.2, unit: 'cups (150g)', cal: 220, prot: 12.0, carb: 35, fat: 3.5 },
            { name: 'Degree Filter Coffee', basePortion: 1, unit: 'davarah (150ml)', cal: 65, prot: 3.5, carb: 8, fat: 1.5 }
          ]
        },
        dinner: {
          title: isVegOnly ? 'Kal Dosa with Tomato Thokku & Drumstick Sambar' : 'Kal Dosa (Soft Sponge Dosa) with South Indian Egg Thokku',
          foods: [
            { name: 'Kal Dosa (Thick Soft Sponge Dosa)', basePortion: 2.5, unit: 'dosas', cal: 120, prot: 3.0, carb: 22, fat: 2.0 },
            { name: 'Tomato Onion Thokku', basePortion: 1, unit: 'serving (60g)', cal: 60, prot: 1.5, carb: 7, fat: 3.0 },
            { name: isVegOnly ? 'Drumstick Sambar' : 'Boiled Eggs', basePortion: isVegOnly ? 1 : 3, unit: isVegOnly ? 'bowl' : 'large eggs', cal: isVegOnly ? 140 : 72, prot: isVegOnly ? 6.5 : 6.3, carb: isVegOnly ? 22 : 0.4, fat: isVegOnly ? 2.8 : 5.0 }
          ]
        }
      }
    ];

    const generatedDays = [];
    for (let d = 1; d <= daysCount; d++) {
      const template = SOUTH_INDIAN_7_DAYS[(d - 1) % 7];

      // Calculate Day's Raw Base Calories and Protein
      let rawBaseCal = 0;
      let rawBaseProt = 0;
      ['breakfast', 'lunch', 'snack', 'dinner'].forEach(mKey => {
        template[mKey].foods.forEach(f => {
          rawBaseCal += f.cal * f.basePortion;
          rawBaseProt += f.prot * f.basePortion;
        });
      });

      // Target calibration multiplier
      const dayScale = targetCal / rawBaseCal;

      const buildMeal = (mObj, mealType, time) => {
        const scaledFoods = mObj.foods.map(f => {
          const scaledPortion = Number((f.basePortion * dayScale).toFixed(1));
          const cal = Math.round(f.cal * scaledPortion);
          const prot = Number((f.prot * scaledPortion).toFixed(1));
          const carb = Number((f.carb * scaledPortion).toFixed(1));
          const fat = Number((f.fat * scaledPortion).toFixed(1));

          let portionLabel = `${scaledPortion} ${f.unit}`;
          if (f.unit.includes('eggs')) {
            portionLabel = `${Math.max(1, Math.round(scaledPortion))} ${f.unit}`;
          } else if (f.unit.includes('pieces') || f.unit.includes('dosas')) {
            portionLabel = `${Math.max(1, Math.round(scaledPortion))} ${f.unit}`;
          }

          return {
            name: f.name,
            portion: portionLabel,
            calories: cal,
            protein: prot,
            carbs: carb,
            fat: fat
          };
        });

        const mealCal = scaledFoods.reduce((acc, f) => acc + f.calories, 0);
        const mealProt = Number(scaledFoods.reduce((acc, f) => acc + f.protein, 0).toFixed(1));
        const mealCarb = Number(scaledFoods.reduce((acc, f) => acc + f.carbs, 0).toFixed(1));
        const mealFat = Number(scaledFoods.reduce((acc, f) => acc + f.fat, 0).toFixed(1));

        return {
          mealType,
          title: mObj.title,
          time,
          foods: scaledFoods,
          mealCalories: mealCal,
          mealProtein: mealProt,
          mealCarbs: mealCarb,
          mealFat: mealFat
        };
      };

      const dayMeals = [
        buildMeal(template.breakfast, 'Breakfast', '08:30 AM'),
        buildMeal(template.lunch, 'Lunch', '01:30 PM'),
        buildMeal(template.snack, 'Evening Snack', '05:00 PM'),
        buildMeal(template.dinner, 'Dinner', '08:30 PM')
      ];

      const totalDayCal = dayMeals.reduce((acc, m) => acc + m.mealCalories, 0);
      const totalDayProt = Number(dayMeals.reduce((acc, m) => acc + m.mealProtein, 0).toFixed(1));
      const totalDayCarb = Number(dayMeals.reduce((acc, m) => acc + m.mealCarbs, 0).toFixed(1));
      const totalDayFat = Number(dayMeals.reduce((acc, m) => acc + m.mealFat, 0).toFixed(1));

      generatedDays.push({
        dayNumber: d,
        dayName: `Day ${d} (${template.day})`,
        meals: dayMeals,
        dayTotalCalories: totalDayCal,
        dayTotalProtein: totalDayProt,
        dayTotalCarbs: totalDayCarb,
        dayTotalFat: totalDayFat,
        hydrationGoal: `${Math.round((userProfile.dailyTargetWater || 3500) / 100) / 10} Liters`,
        dieticianTip: 'Keep dinner 2.5 hours before sleeping for optimal digestion and growth hormone release.'
      });
    }

    const fallbackPlan = {
      preference,
      targetCalories: targetCal,
      targetProtein: targetProt,
      days: generatedDays,
      source: 'south-indian-algorithmic-engine'
    };

    queryCache.set(cacheKey, fallbackPlan);
    return fallbackPlan;
  }
}
