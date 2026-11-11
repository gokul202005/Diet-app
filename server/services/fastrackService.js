// Fastrack Smartwatch Sync & Energy Balance Calculator
export class FastrackService {
  // Calculate BMR using Mifflin-St Jeor Equation
  static calculateBMR(weightKg, heightCm, age, gender = 'male') {
    if (gender === 'male') {
      return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
    } else {
      return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
    }
  }

  // Calculate Net Energy Balance combining Diet Intake and Fastrack Watch Data
  static calculateEnergyBalance(consumedCalories, fastrackLog, profile) {
    const bmr = this.calculateBMR(
      Number(profile?.weightKg) || 70,
      Number(profile?.heightCm) || 170,
      Number(profile?.age) || 24,
      profile?.gender || 'male'
    );

    const activeBurn = fastrackLog?.activeCalories || 0;
    const totalExpenditure = bmr + activeBurn;
    const netCalories = consumedCalories - totalExpenditure;

    const rawGoal = profile?.goal || (Array.isArray(profile?.goals) && profile.goals.length > 0 ? profile.goals[0] : '') || 'maintenance';
    const userGoal = String(rawGoal).toLowerCase();
    const isBulking = userGoal.includes('bulk') || userGoal.includes('muscle');
    const isCutting = userGoal.includes('cut') || userGoal.includes('shred');
    const isRecomp = userGoal.includes('recomp');

    let status = 'neutral';
    let message = 'Balanced energy intake';

    if (netCalories < -200) {
      status = 'deficit';
      if (isBulking) {
        message = `Deficit of ${Math.abs(netCalories)} kcal (eat more to hit surplus for muscle growth)`;
      } else if (isCutting) {
        message = `Fat-loss deficit of ${Math.abs(netCalories)} kcal`;
      } else if (isRecomp) {
        message = `Body recomp deficit of ${Math.abs(netCalories)} kcal`;
      } else {
        message = `Net deficit of ${Math.abs(netCalories)} kcal`;
      }
    } else if (netCalories > 200) {
      status = 'surplus';
      if (isBulking) {
        message = `Muscle-building surplus of +${netCalories} kcal`;
      } else if (isCutting) {
        message = `Caloric surplus of +${netCalories} kcal (above cut target)`;
      } else {
        message = `Net surplus of +${netCalories} kcal`;
      }
    } else {
      status = 'maintenance';
      message = 'Maintenance caloric balance';
    }

    return {
      consumedCalories,
      bmr,
      activeBurn,
      totalExpenditure,
      netCalories,
      status,
      message,
      steps: fastrackLog?.steps || 0,
      stepsTarget: profile.dailyTargetSteps || 10000,
      stepsProgress: Math.min(100, Math.round(((fastrackLog?.steps || 0) / (profile.dailyTargetSteps || 10000)) * 100)),
      heartRate: {
        avg: fastrackLog?.avgHeartRate || 72,
        peak: fastrackLog?.peakHeartRate || 135
      },
      sleepHours: fastrackLog?.sleepHours || 7.5
    };
  }

  // Parse Fastrack CSV or JSON export
  static parseExportData(dataString) {
    try {
      // Try JSON first
      const parsed = JSON.parse(dataString);
      return {
        steps: parsed.steps || parsed.stepCount || 0,
        activeCalories: parsed.calories || parsed.activeCalories || 0,
        distanceKm: parsed.distance || parsed.distanceKm || 0,
        avgHeartRate: parsed.heartRate || parsed.avgHeartRate || 72,
        sleepHours: parsed.sleep || parsed.sleepHours || 7
      };
    } catch {
      // Try CSV format (e.g. date,steps,calories,distance,heartRate)
      const lines = dataString.trim().split('\n');
      if (lines.length >= 2) {
        const lastLine = lines[lines.length - 1].split(',');
        return {
          steps: parseInt(lastLine[1], 10) || 6000,
          activeCalories: parseInt(lastLine[2], 10) || 300,
          distanceKm: parseFloat(lastLine[3]) || 4.2,
          avgHeartRate: parseInt(lastLine[4], 10) || 75
        };
      }
      throw new Error('Unsupported Fastrack data format');
    }
  }
}
