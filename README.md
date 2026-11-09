# AGY Fit • AI Diet Tracker & Biomechanics Coach

A full-stack, cloud-ready nutrition and fitness web app with an extensive South Indian food database, AI-powered workout split biomechanics, Fastrack smartwatch sync, and token-saving hybrid intelligence.

---

## 🌟 Key Features

### 1. 🍛 Authentic South Indian & Multi-Cuisine Food Engine
- **Extensive South Indian Food Database (Zero-Token Local Engine)**:
  - **Tiffins**: Steamed Idli, Podi Idli, Mini Sambar Idli, Plain Dosa, Ghee Roast Dosa, Masala Dosa, Onion Uthappam, Podi Uthappam, Egg Dosa, Rava Dosa, Ragi Dosa, Set Dosa, Medu Vada, Masala Vada, Ven Pongal, Sakkarai Pongal, Appam, Idiyappam, Puttu, Rava Upma, Semiya Upma, Poori Masala, Ragi Koozh, Neer Dosa, Pesarattu.
  - **Rice Varieties**: Sambar Sadam, Rasam Sadam, Thayir Sadam (Curd Rice), Lemon Rice, Tomato Rice, Puliyodharai (Tamarind Rice), Bisi Bele Bath, Coconut Rice, Ghee Rice, Thalassery/Malabar Biryani, Dindigul/Ambur Biryani, South Indian Full Meals (Thali).
  - **Curries, Sambars & Kuzhambu**: Drumstick Sambar, Tomato Rasam, Pepper Garlic Rasam, Vatha Kuzhambu, Mor Kuzhambu, Ennai Kathirikai Kuzhambu, Kara Kuzhambu, Kerala Avial, Kootu, Kadala Curry, Veg Kurma, Gongura Pappu.
  - **Poriyals & Sides**: Cabbage Poriyal, Beans Poriyal, Potato Roast (Urulai Roast), Beetroot Poriyal, Vendakkai/Okra Poriyal, Vazhaikkai Varuval (Raw Banana Fry).
  - **Non-Veg Specialties**: Chettinad Chicken Curry, Kerala Meen Curry, Vanjaram Fish Fry, Ayala/Mackerel Fry, Chettinad Mutton Sukka, Egg Thokku, Egg Kurma, Prawn Masala, Kari Dosa, Kothu Parotta.
  - **Chutneys, Podis & Drinks**: Coconut Chutney, Tomato Chutney, Kara Chutney, Kothamalli Chutney, Peanut Chutney, Gunpowder (Idli Milagai Podi), Filter Coffee (Degree Kaapi), Masala Neer Mor, Tender Coconut Water, Panakam, Nannari Sarbath.
  - **Gym & Macro Staples**: Grilled Chicken Breast, Boiled Eggs & Egg Whites, Raw & Low-Fat Paneer, Soy Chunks / Meal Maker, Whey Protein Isolate, Greek Yogurt, Peanut Butter, Rolled Oats, Almonds.
- **AI Natural Language Food Breakdown**: Type `"3 idlis with 1 cup sambar and a filter coffee"` and the AI decomposes it into itemized calories, protein, carbs, and fats.
- **Multimodal Photo Vision Scanner**: Snap or upload a photo of your food plate to calculate nutrients.

---

### 2. 🏋️ AI Workout Plan Analyzer & Tracker
- **Biomechanical Workout Split Analysis**:
  - Push:Pull and Quad:Hamstring antagonist balance check.
  - Weekly volume per muscle group (hypertrophy vs strength ranges).
  - Rest day recovery evaluation and overtraining risk detection.
  - **Diet & Calorie Synergy**: Checks whether your calorie intake and protein target match your workout intensity.
  - **Progressive Overload Roadmap**: Specific double-progression and weight increments.
- **Daily Workout Session Logger**:
  - Exercises, weight (kg), reps, and set completion checkboxes.
  - **Built-in Rest Timer** (30s, 60s, 90s, 120s) with audio/visual countdown.

---

### 3. ⌚ Fastrack Smartwatch Sync & Energy Balance
- Direct Quick Sync for **Fastrack Reflex / Titan Smart World** data:
  - Daily steps counter & step goal progress.
  - Active calories burned + basal metabolic rate (BMR).
  - Average & peak workout heart rate (bpm).
  - Restorative sleep hours tracking.
- **Live Net Calorie Deficit/Surplus Gauge**:
  $$\text{Net Calories} = \text{Food Eaten} - (\text{BMR} + \text{Fastrack Active Burn})$$
  Shows real-time fat loss deficit or muscle-building surplus.
- **Web Bluetooth Live Pairing**: Connects to Bluetooth smart bands directly in Google Chrome / Edge.

---

### 4. 👤 Personalized Bio Onboarding & Macro Calibration
- Automatically greets every new user to collect:
  - Name, Age, Gender, Height (cm), Weight (kg)
  - Fitness Objective: **🔥 Fat Loss (Cut)**, **💪 Muscle Gain (Bulk)**, **⚖️ Body Recomp**, **🛡️ Maintenance**
  - Activity Level: Sedentary, Lightly Active, Moderately Active, Very Active
- Uses the **Mifflin-St Jeor Sports Science Formula** to calculate exact:
  - BMR & TDEE
  - Daily target calories, protein (g), carbs (g), healthy fats (g), water (ml), and steps.
  - Full customization available anytime.

---

### 5. 🛡️ Smart AI Token Exhaustion Protection
To guarantee the app never breaks even if API quotas or tokens are exhausted:
1. **Zero-Token Local Engine**: 90% of daily food logging uses the built-in database with 0 API tokens consumed.
2. **AI Result Caching**: Re-analyzing identical foods or workout splits returns cached data at 0 token cost.
3. **Algorithmic Biomechanics Fallback**: If Gemini quota runs out (`429 Too Many Requests`), the built-in heuristic engine scores splits and parses meals seamlessly.
4. **Token Usage Monitor**: Live tracker in Settings showing API calls and savings.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Run Full Application (Server + Client)
```bash
npm run dev
```
- Frontend: `http://localhost:3000`
- Backend API & Static Host: `http://localhost:5000`

### 3. Production Build & Run
```bash
npm run build
npm start
```

### 4. Install on Mobile (PWA)
- Open `http://<your-computer-ip>:5000` on your mobile browser (Safari on iPhone or Chrome on Android).
- Tap **Share / Menu** -> **Add to Home Screen**.
- The app runs fullscreen with native mobile performance!
