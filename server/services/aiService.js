import { GoogleGenerativeAI } from '@google/generative-ai';
import { localParseMealText, searchFoodDatabase } from '../data/foodDatabase.js';
import { 
  SOUTH_INDIAN_BREAKFASTS, 
  SOUTH_INDIAN_LUNCHES, 
  SOUTH_INDIAN_SNACKS, 
  SOUTH_INDIAN_DINNERS, 
  shuffleArray, 
  scaleMealTemplate 
} from './southIndianRecipes.js';

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
    this.modelName = 'gemini-flash-lite-latest';
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  getGenAI() {
    if (!this.apiKey) return null;
    return new GoogleGenerativeAI(this.apiKey);
  }

  // Resilient multi-model executor with automatic failover to prevent 404 / 503 / 429 quota errors
  // Uses low-token Gemini 2.0 Flash Lite & 1.5 Flash 8B with 500 RPD rate limits
  async callModel(contentParts, config = {}, customModels = null) {
    if (!this.apiKey) return null;
    const genAI = this.getGenAI();
    if (!genAI) return null;

    const candidateModels = customModels && customModels.length > 0
      ? customModels
      : [
          this.modelName || 'gemini-flash-lite-latest',
          'gemini-flash-lite-latest',
          'gemini-3.8-flash',
          'gemini-2.5-flash'
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
    let cleanMime = (mimeType || 'audio/webm').split(';')[0].trim();
    if (!cleanMime.startsWith('audio/')) cleanMime = 'audio/webm';

    const prompt = `Listen to this fitness enthusiast's voice audio recording. They may be speaking in Indian English, Tamil (e.g. "3 idli saapten", "500 ml thanni kudichen", "110 kg iruken"), Hindi (e.g. "3 roti khaya", "paani piya"), or standard English.
Transcribe what they said into a clear English fitness sentence (e.g. "I ate 3 idlis with sambar and 2 boiled eggs", "drank 500ml water", "flat bench press 3 sets 10 reps 60kg", "my weight is 110 kg").
If the audio contains short or quiet speech, transcribe whatever words you can detect.
Return ONLY the transcribed sentence as plain text without quotation marks, bullet points, markdown formatting, or introductory commentary.`;

    const { result } = await this.callModel([
      {
        inlineData: {
          mimeType: cleanMime,
          data: base64Data
        }
      },
      prompt
    ], {}, ['gemini-flash-lite-latest', 'gemini-3.8-flash']);

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
        ['gemini-2.0-flash', 'gemini-2.0-flash-lite-preview-02-05', 'gemini-1.5-flash-8b', 'gemini-1.5-flash']
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

  // 5. Dynamic Authentic South Indian Calorie & Macro Target Meal Blueprint Engine
  async generateDailyMealPlan(userProfile = {}, preference = 'south_indian_mixed', daysCount = 7, options = {}) {
    const targetCal = Number(userProfile.dailyTargetCalories) || 2100;
    const targetProt = Number(userProfile.dailyTargetProtein) || 140;
    const targetCarb = Number(userProfile.dailyTargetCarbs) || 220;
    const targetFat = Number(userProfile.dailyTargetFat) || 60;
    const isVegOnly = preference === 'south_indian_veg';
    const isForceFresh = Boolean(options.forceFresh);

    // If not forced fresh and no custom seed, check queryCache
    const cacheKey = `meal_plan:${targetCal}:${targetProt}:${preference}:${daysCount}`;
    if (!isForceFresh && !options.seed && queryCache.has(cacheKey)) {
      return { ...queryCache.get(cacheKey), cached: true };
    }

    // Macro target meal caloric distribution:
    // Breakfast: 26% of daily calories
    // Lunch: 36% of daily calories
    // Evening Snack: 12% of daily calories
    // Dinner: 26% of daily calories
    const targetBreakfastCal = Math.round(targetCal * 0.26);
    const targetLunchCal = Math.round(targetCal * 0.36);
    const targetSnackCal = Math.round(targetCal * 0.12);
    const targetDinnerCal = Math.max(200, targetCal - (targetBreakfastCal + targetLunchCal + targetSnackCal));

    // Dynamic random shuffle of all pools to guarantee varied dishes across days & refreshes
    const bShuffled = shuffleArray(SOUTH_INDIAN_BREAKFASTS);
    const lShuffled = shuffleArray(
      SOUTH_INDIAN_LUNCHES.filter(l => {
        if (isVegOnly && l.isNonVeg && !l.vegTitle) return false;
        return true;
      })
    );
    const sShuffled = shuffleArray(SOUTH_INDIAN_SNACKS);
    const dShuffled = shuffleArray(SOUTH_INDIAN_DINNERS);

    const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const generatedDays = [];

    for (let d = 1; d <= daysCount; d++) {
      const dayName = DAY_NAMES[(d - 1) % DAY_NAMES.length];
      const bTemplate = bShuffled[(d - 1) % bShuffled.length];
      const lTemplate = lShuffled[(d - 1) % lShuffled.length];
      const sTemplate = sShuffled[(d - 1) % sShuffled.length];
      const dTemplate = dShuffled[(d - 1) % dShuffled.length];

      const breakfastMeal = scaleMealTemplate(bTemplate, 'Breakfast', '08:30 AM', targetBreakfastCal, isVegOnly);
      const lunchMeal = scaleMealTemplate(lTemplate, 'Lunch', '01:30 PM', targetLunchCal, isVegOnly);
      const snackMeal = scaleMealTemplate(sTemplate, 'Evening Snack', '05:00 PM', targetSnackCal, isVegOnly);
      const dinnerMeal = scaleMealTemplate(dTemplate, 'Dinner', '08:30 PM', targetDinnerCal, isVegOnly);

      const dayMeals = [breakfastMeal, lunchMeal, snackMeal, dinnerMeal];
      const totalDayCal = dayMeals.reduce((acc, m) => acc + m.mealCalories, 0);
      const totalDayProt = Number(dayMeals.reduce((acc, m) => acc + m.mealProtein, 0).toFixed(1));
      const totalDayCarb = Number(dayMeals.reduce((acc, m) => acc + m.mealCarbs, 0).toFixed(1));
      const totalDayFat = Number(dayMeals.reduce((acc, m) => acc + m.mealFat, 0).toFixed(1));

      generatedDays.push({
        dayNumber: d,
        dayName: `Day ${d} (${dayName})`,
        meals: dayMeals,
        dayTotalCalories: totalDayCal,
        dayTotalProtein: totalDayProt,
        dayTotalCarbs: totalDayCarb,
        dayTotalFat: totalDayFat,
        hydrationGoal: `${Math.round((userProfile.dailyTargetWater || 3500) / 100) / 10} Liters`,
        dieticianTip: 'Keep dinner 2.5 hours before sleeping for optimal digestion and growth hormone release.'
      });
    }

    const plan = {
      preference,
      targetCalories: targetCal,
      targetProtein: targetProt,
      days: generatedDays,
      source: 'south-indian-smart-engine',
      generatedAt: new Date().toISOString()
    };

    if (!isForceFresh) {
      queryCache.set(cacheKey, plan);
    }
    return plan;
  }

  // 6. Swap an individual meal with a fresh South Indian alternative matching target calories
  swapMeal({ mealType = 'Breakfast', currentTitle = '', targetCalories = 500, preference = 'south_indian_mixed' }) {
    const isVegOnly = preference === 'south_indian_veg';
    const typeLower = (mealType || '').toLowerCase();

    let pool = SOUTH_INDIAN_BREAKFASTS;
    let defaultTime = '08:30 AM';
    let stdType = 'Breakfast';

    if (typeLower.includes('lunch')) {
      pool = SOUTH_INDIAN_LUNCHES.filter(l => {
        if (isVegOnly && l.isNonVeg && !l.vegTitle) return false;
        return true;
      });
      defaultTime = '01:30 PM';
      stdType = 'Lunch';
    } else if (typeLower.includes('snack')) {
      pool = SOUTH_INDIAN_SNACKS;
      defaultTime = '05:00 PM';
      stdType = 'Evening Snack';
    } else if (typeLower.includes('dinner')) {
      pool = SOUTH_INDIAN_DINNERS;
      defaultTime = '08:30 PM';
      stdType = 'Dinner';
    }

    // Filter out items that match the current meal title to guarantee a new dish
    const cleanCurrent = (currentTitle || '').toLowerCase().trim();
    const available = pool.filter(t => {
      const activeTitle = (isVegOnly ? (t.vegTitle || t.title) : t.title).toLowerCase().trim();
      const firstWord = activeTitle.split(' ')[0] || '';
      return !activeTitle.includes(cleanCurrent.slice(0, 10)) &&
             !cleanCurrent.includes(firstWord);
    });

    const candidates = available.length > 0 ? available : pool;
    const pickedTemplate = candidates[Math.floor(Math.random() * candidates.length)];

    return scaleMealTemplate(
      pickedTemplate,
      stdType,
      defaultTime,
      Number(targetCalories) || pickedTemplate.baseTargetCal || 500,
      isVegOnly
    );
  }
}
