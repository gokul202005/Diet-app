// Authentic South Indian Food & Recipe Blueprint Engine
// Rich diversity of 100% genuine South Indian home & restaurant dishes

export const SOUTH_INDIAN_BREAKFASTS = [
  {
    id: 'idli_sambar',
    title: 'Steamed Idlis with Drumstick Sambar & Boiled Eggs',
    vegTitle: 'Steamed Idlis with Drumstick Sambar & Roasted Chana Sundal',
    baseTargetCal: 500,
    foods: [
      { name: 'Steamed Idli', basePortion: 4, unit: 'pieces', cal: 65, prot: 2.3, carb: 13, fat: 0.3 },
      { name: 'Drumstick Sambar', basePortion: 1, unit: 'bowl (200ml)', cal: 140, prot: 6.5, carb: 22, fat: 2.8 },
      { name: 'Boiled Eggs', vegName: 'Roasted Chana Sundal', basePortion: 3, vegPortion: 1, unit: 'large eggs', vegUnit: 'cup', cal: 72, vegCal: 190, prot: 6.3, vegProt: 11, carb: 0.4, vegCarb: 30, fat: 5.0, vegFat: 3 }
    ]
  },
  {
    id: 'ven_pongal',
    title: 'Ven Pongal with Medu Vada & Drumstick Sambar',
    vegTitle: 'Ven Pongal with Medu Vada & Drumstick Sambar',
    baseTargetCal: 600,
    foods: [
      { name: 'Ven Pongal (Rice & Moong Dal with Ghee)', basePortion: 1.5, unit: 'cups (250g)', cal: 320, prot: 9.0, carb: 48, fat: 10.5 },
      { name: 'Crispy Medu Vada', basePortion: 1, unit: 'vada', cal: 145, prot: 4.5, carb: 16, fat: 7.5 },
      { name: 'Drumstick Sambar', basePortion: 1, unit: 'bowl (200ml)', cal: 140, prot: 6.5, carb: 22, fat: 2.8 },
      { name: 'Boiled Eggs', vegName: 'White Chana Sundal', basePortion: 2, vegPortion: 0.8, unit: 'large eggs', vegUnit: 'cup', cal: 72, vegCal: 190, prot: 6.3, vegProt: 11, carb: 0.4, vegCarb: 31, fat: 5.0, vegFat: 3 }
    ]
  },
  {
    id: 'pesarattu',
    title: 'Pesarattu (Green Moong Dal Dosa) with Allam Chutney & Boiled Eggs',
    vegTitle: 'Pesarattu (Green Moong Dal Dosa) with Allam Chutney & Sambar',
    baseTargetCal: 550,
    foods: [
      { name: 'Pesarattu (Whole Green Gram Dosa)', basePortion: 2.5, unit: 'medium dosas', cal: 150, prot: 8.0, carb: 22, fat: 3.5 },
      { name: 'Allam (Ginger) Chutney', basePortion: 1, unit: 'serving (50g)', cal: 55, prot: 1.0, carb: 8, fat: 2.5 },
      { name: 'Boiled Eggs', vegName: 'Drumstick Sambar', basePortion: 3, vegPortion: 1, unit: 'large eggs', vegUnit: 'bowl', cal: 72, vegCal: 140, prot: 6.3, vegProt: 6.5, carb: 0.4, vegCarb: 22, fat: 5.0, vegFat: 2.8 }
    ]
  },
  {
    id: 'kerala_appam',
    title: 'Kerala Appam with Vegetable Coconut Kurma & Boiled Eggs',
    vegTitle: 'Kerala Appam with Vegetable Coconut Kurma & Sundal',
    baseTargetCal: 520,
    foods: [
      { name: 'Appam (Soft fermented rice hopper)', basePortion: 3, unit: 'pieces', cal: 95, prot: 2.0, carb: 20, fat: 1.0 },
      { name: 'South Indian Vegetable Coconut Kurma', basePortion: 1, unit: 'bowl (200g)', cal: 180, prot: 4.5, carb: 18, fat: 10.0 },
      { name: 'Boiled Eggs', vegName: 'Kala Chana Sundal', basePortion: 3, vegPortion: 1, unit: 'large eggs', vegUnit: 'cup', cal: 72, vegCal: 190, prot: 6.3, vegProt: 11, carb: 0.4, vegCarb: 31, fat: 5.0, vegFat: 3 }
    ]
  },
  {
    id: 'ghee_roast',
    title: 'Crispy Ghee Roast Dosa with Coconut Chutney & Boiled Eggs',
    vegTitle: 'Crispy Ghee Roast Dosa with Coconut Chutney & Sambar',
    baseTargetCal: 540,
    foods: [
      { name: 'Crispy Ghee Roast Dosa', basePortion: 2, unit: 'dosas', cal: 175, prot: 3.5, carb: 24, fat: 7.5 },
      { name: 'South Indian Coconut Chutney', basePortion: 1, unit: 'serving (50g)', cal: 85, prot: 1.5, carb: 4, fat: 7.5 },
      { name: 'Boiled Eggs', vegName: 'Drumstick Sambar', basePortion: 3, vegPortion: 1, unit: 'large eggs', vegUnit: 'bowl', cal: 72, vegCal: 140, prot: 6.3, vegProt: 6.5, carb: 0.4, vegCarb: 22, fat: 5.0, vegFat: 2.8 }
    ]
  },
  {
    id: 'idiyappam',
    title: 'Steamed Idiyappam (String Hoppers) with South Indian Egg Curry',
    vegTitle: 'Steamed Idiyappam (String Hoppers) with Coconut Milk & Veg Kurma',
    baseTargetCal: 530,
    foods: [
      { name: 'Steamed Idiyappam (Sevai)', basePortion: 4, unit: 'cakes (200g)', cal: 80, prot: 1.8, carb: 18, fat: 0.3 },
      { name: 'South Indian Muttai Kuzhambu (Egg Curry)', vegName: 'Vegetable Coconut Kurma', basePortion: 1.2, vegPortion: 1.2, unit: 'bowls', vegUnit: 'bowls', cal: 260, vegCal: 190, prot: 16, vegProt: 4.5, carb: 9, vegCarb: 16, fat: 17, vegFat: 12 },
      { name: 'Tomato Garlic Rasam', basePortion: 1, unit: 'cup (180ml)', cal: 45, prot: 1.5, carb: 7, fat: 1.0 }
    ]
  },
  {
    id: 'kuzhi_paniyaram',
    title: 'Chettinad Kuzhi Paniyaram with Kara Chutney & Boiled Eggs',
    vegTitle: 'Chettinad Kuzhi Paniyaram with Kara Chutney & Sambar',
    baseTargetCal: 510,
    foods: [
      { name: 'Chettinad Kuzhi Paniyaram (Rice & Dal Dumplings)', basePortion: 6, unit: 'pieces', cal: 46, prot: 1.1, carb: 7.2, fat: 1.4 },
      { name: 'Kara Chutney (Spicy Onion Garlic Chutney)', basePortion: 1, unit: 'serving (60g)', cal: 55, prot: 1.5, carb: 6, fat: 3.0 },
      { name: 'Boiled Eggs', vegName: 'Drumstick Sambar', basePortion: 3, vegPortion: 1, unit: 'large eggs', vegUnit: 'bowl', cal: 72, vegCal: 140, prot: 6.3, vegProt: 6.5, carb: 0.4, vegCarb: 22, fat: 5.0, vegFat: 2.8 }
    ]
  },
  {
    id: 'podi_dosa',
    title: 'Podi Dosa (with Gingelly Oil) with Sambar & Boiled Eggs',
    vegTitle: 'Podi Dosa (with Gingelly Oil) with Sambar & Roasted Bengal Gram',
    baseTargetCal: 550,
    foods: [
      { name: 'Podi Dosa (with Gingelly Oil)', basePortion: 2.5, unit: 'dosas', cal: 165, prot: 4.5, carb: 24, fat: 5.5 },
      { name: 'Drumstick Sambar', basePortion: 1, unit: 'bowl (200ml)', cal: 140, prot: 6.5, carb: 22, fat: 2.8 },
      { name: 'Boiled Eggs', vegName: 'Roasted Bengal Gram', basePortion: 3, vegPortion: 1, unit: 'large eggs', vegUnit: 'serving', cal: 72, vegCal: 180, prot: 6.3, vegProt: 9, carb: 0.4, vegCarb: 8, fat: 5.0, vegFat: 14 }
    ]
  },
  {
    id: 'adai_avial',
    title: 'Adai Avial (Multi-Lentil Pancake with Kerala Avial) & Boiled Eggs',
    vegTitle: 'Adai Avial (Multi-Lentil High-Protein Pancake with Coconut Avial)',
    baseTargetCal: 580,
    foods: [
      { name: 'Adai (High-Protein Multi-Lentil Pancake)', basePortion: 2.5, unit: 'adais', cal: 170, prot: 7.2, carb: 23, fat: 5.5 },
      { name: 'Kerala Avial (Mixed Vegetables in Coconut & Curd)', basePortion: 1, unit: 'bowl (150g)', cal: 160, prot: 3.5, carb: 14, fat: 10.5 },
      { name: 'Boiled Eggs', vegName: 'Coconut Chutney', basePortion: 3, vegPortion: 1, unit: 'large eggs', vegUnit: 'serving (40g)', cal: 72, vegCal: 85, prot: 6.3, vegProt: 1.2, carb: 0.4, vegCarb: 3.5, fat: 5.0, vegFat: 7.5 }
    ]
  },
  {
    id: 'ragi_dosa',
    title: 'Ragi Dosa (Finger Millet Dosa) with Tomato Thokku & Boiled Eggs',
    vegTitle: 'Ragi Dosa with Tomato Thokku & Sambar',
    baseTargetCal: 490,
    foods: [
      { name: 'Ragi Dosa (Finger Millet Dosa)', basePortion: 2.5, unit: 'dosas', cal: 130, prot: 3.8, carb: 22, fat: 3.0 },
      { name: 'Tomato Onion Thokku', basePortion: 1, unit: 'serving (60g)', cal: 60, prot: 1.5, carb: 7, fat: 3.0 },
      { name: 'Boiled Eggs', vegName: 'Drumstick Sambar', basePortion: 3, vegPortion: 1, unit: 'large eggs', vegUnit: 'bowl', cal: 72, vegCal: 140, prot: 6.3, vegProt: 6.5, carb: 0.4, vegCarb: 22, fat: 5.0, vegFat: 2.8 }
    ]
  },
  {
    id: 'rava_upma',
    title: 'Vegetable Rava Upma with Coconut Chutney & Boiled Eggs',
    vegTitle: 'Vegetable Rava Upma with Coconut Chutney & Sambar',
    baseTargetCal: 500,
    foods: [
      { name: 'Vegetable Rava Upma (Semolina & Veggies)', basePortion: 1.5, unit: 'cups (250g)', cal: 260, prot: 6.5, carb: 42, fat: 7.5 },
      { name: 'South Indian Coconut Chutney', basePortion: 1, unit: 'serving (50g)', cal: 85, prot: 1.5, carb: 4, fat: 7.5 },
      { name: 'Boiled Eggs', vegName: 'Drumstick Sambar', basePortion: 3, vegPortion: 1, unit: 'large eggs', vegUnit: 'bowl', cal: 72, vegCal: 140, prot: 6.3, vegProt: 6.5, carb: 0.4, vegCarb: 22, fat: 5.0, vegFat: 2.8 }
    ]
  },
  {
    id: 'kal_dosa_sambar',
    title: 'Kal Dosa (Soft Sponge Dosa) with Drumstick Sambar & Boiled Eggs',
    vegTitle: 'Kal Dosa (Soft Sponge Dosa) with Drumstick Sambar & Sundal',
    baseTargetCal: 520,
    foods: [
      { name: 'Kal Dosa (Soft Sponge Dosa)', basePortion: 2.5, unit: 'dosas', cal: 120, prot: 3.0, carb: 22, fat: 2.0 },
      { name: 'Drumstick Sambar', basePortion: 1, unit: 'bowl (200ml)', cal: 140, prot: 6.5, carb: 22, fat: 2.8 },
      { name: 'Boiled Eggs', vegName: 'Pachai Payaru Sundal', basePortion: 3, vegPortion: 1, unit: 'large eggs', vegUnit: 'cup', cal: 72, vegCal: 210, prot: 6.3, vegProt: 13, carb: 0.4, vegCarb: 34, fat: 5.0, vegFat: 2.5 }
    ]
  }
];

export const SOUTH_INDIAN_LUNCHES = [
  {
    id: 'chicken_curry_rice',
    title: 'Ponni Rice with Simple Home Chicken Curry (Veetu Kozhi Curry) & Fresh Thayir',
    vegTitle: 'Ponni Rice with Paruppu Urundai Kuzhambu & Fresh Thayir',
    isNonVeg: true,
    baseTargetCal: 720,
    foods: [
      { name: 'Cooked Ponni Rice', basePortion: 1.8, unit: 'cups (280g)', cal: 200, prot: 4.2, carb: 45, fat: 0.4 },
      { name: 'Simple Home Chicken Curry (Veetu Kozhi Curry)', vegName: 'Paruppu Urundai Kuzhambu', basePortion: 1.2, vegPortion: 1.2, unit: 'bowls (240g)', vegUnit: 'bowls (240g)', cal: 310, vegCal: 230, prot: 32, vegProt: 11.5, carb: 7, vegCarb: 26, fat: 16, vegFat: 9 },
      { name: 'Fresh Curd (Thayir)', basePortion: 1, unit: 'bowl (150g)', cal: 95, prot: 5.0, carb: 6.5, fat: 5.5 }
    ]
  },
  {
    id: 'garlic_karakolambu',
    title: 'Ponni Rice with Poondu Kara Kuzhambu (Garlic Karakolambu) & Muttai Podimas',
    vegTitle: 'Ponni Rice with Poondu Kara Kuzhambu (Garlic Karakolambu) & Cabbage Poriyal',
    baseTargetCal: 650,
    foods: [
      { name: 'Cooked Ponni Rice', basePortion: 1.8, unit: 'cups (280g)', cal: 200, prot: 4.2, carb: 45, fat: 0.4 },
      { name: 'Poondu Kara Kuzhambu / Karakolambu (Garlic Tamarind Curry)', basePortion: 1.2, unit: 'bowls (200ml)', cal: 150, prot: 3.0, carb: 16, fat: 8.5 },
      { name: 'Muttai Podimas (Simple Home Egg Scramble with Onions & Chillies)', vegName: 'Cabbage Poriyal with Coconut', basePortion: 3, vegPortion: 1.2, unit: 'eggs scramble', vegUnit: 'cup (120g)', cal: 90, vegCal: 85, prot: 7.0, vegProt: 2.5, carb: 2, vegCarb: 9, fat: 6.0, vegFat: 4.5 }
    ]
  },
  {
    id: 'meen_curry_rice',
    title: 'Ponni Rice with South Indian Fish Curry (Meen Kuzhambu) & Beans Poriyal',
    vegTitle: 'Ponni Rice with Mor Kuzhambu & Beans Paruppu Usili',
    isNonVeg: true,
    baseTargetCal: 680,
    foods: [
      { name: 'Cooked Ponni Rice', basePortion: 1.8, unit: 'cups (280g)', cal: 200, prot: 4.2, carb: 45, fat: 0.4 },
      { name: 'South Indian Fish Curry (Meen Kuzhambu)', vegName: 'Mor Kuzhambu / Pulissery', basePortion: 1.2, vegPortion: 1.2, unit: 'bowls (220g)', vegUnit: 'bowls (220g)', cal: 280, vegCal: 155, prot: 28, vegProt: 4.5, carb: 6, vegCarb: 11, fat: 12, vegFat: 10 },
      { name: 'Beans & Carrot Poriyal', vegName: 'Beans Paruppu Usili', basePortion: 1, vegPortion: 1, unit: 'cup (120g)', vegUnit: 'cup (120g)', cal: 90, vegCal: 140, prot: 3.0, vegProt: 7.0, carb: 10, vegCarb: 16, fat: 4.5, vegFat: 5.0 }
    ]
  },
  {
    id: 'pepper_rasam_thokku',
    title: 'Ponni Rice with Pepper Garlic Rasam & South Indian Egg Thokku',
    vegTitle: 'Ponni Rice with Pepper Garlic Rasam & Keerai Kootu with Thayir',
    baseTargetCal: 640,
    foods: [
      { name: 'Cooked Ponni Rice', basePortion: 1.8, unit: 'cups (280g)', cal: 200, prot: 4.2, carb: 45, fat: 0.4 },
      { name: 'Pepper Garlic Rasam (Milagu Poondu Rasam)', basePortion: 1.2, unit: 'bowls (220ml)', cal: 45, prot: 2.0, carb: 7, fat: 1.0 },
      { name: 'Egg Thokku (Spicy Boiled Egg Roast)', vegName: 'Keerai Kootu (Spinach Lentil Mash)', basePortion: 3, vegPortion: 1.2, unit: 'eggs with gravy', vegUnit: 'bowl (180g)', cal: 85, vegCal: 130, prot: 6.8, vegProt: 6.0, carb: 3, vegCarb: 16, fat: 5.5, vegFat: 4.5 },
      { name: 'Fresh Curd (Thayir)', basePortion: 1, unit: 'bowl (150g)', cal: 95, prot: 5.0, carb: 6.5, fat: 5.5 }
    ]
  },
  {
    id: 'mor_kuzhambu_usili',
    title: 'Ponni Rice with Mor Kuzhambu & Beans Paruppu Usili with Boiled Eggs',
    vegTitle: 'Ponni Rice with Mor Kuzhambu & Beans Paruppu Usili with Thayir',
    baseTargetCal: 630,
    foods: [
      { name: 'Cooked Ponni Rice', basePortion: 1.8, unit: 'cups (280g)', cal: 200, prot: 4.2, carb: 45, fat: 0.4 },
      { name: 'Mor Kuzhambu / Pulissery', basePortion: 1.2, unit: 'bowls (220ml)', cal: 155, prot: 4.5, carb: 11, fat: 10 },
      { name: 'Beans Paruppu Usili (Lentil Crumbles with Green Beans)', basePortion: 1, unit: 'cup (140g)', cal: 160, prot: 8.5, carb: 18, fat: 6.0 },
      { name: 'Boiled Eggs', vegName: 'Fresh Curd (Thayir)', basePortion: 2, vegPortion: 1, unit: 'large eggs', vegUnit: 'bowl (150g)', cal: 72, vegCal: 95, prot: 6.3, vegProt: 5.0, carb: 0.4, vegCarb: 6.5, fat: 5.0, vegFat: 5.5 }
    ]
  },
  {
    id: 'vatha_kuzhambu_kootu',
    title: 'Ponni Rice with Sundakkai Vatha Kuzhambu & Keerai Kootu with Muttai Podimas',
    vegTitle: 'Ponni Rice with Sundakkai Vatha Kuzhambu & Keerai Kootu with Potato Roast',
    baseTargetCal: 660,
    foods: [
      { name: 'Cooked Ponni Rice', basePortion: 1.8, unit: 'cups (280g)', cal: 200, prot: 4.2, carb: 45, fat: 0.4 },
      { name: 'Vatha Kuzhambu / Vathal Kolambu', basePortion: 1.2, unit: 'ladles (100ml)', cal: 135, prot: 2.0, carb: 13, fat: 8.5 },
      { name: 'Keerai Kootu (Spinach Lentil Mash)', basePortion: 1, unit: 'bowl (160g)', cal: 130, prot: 6.0, carb: 16, fat: 4.5 },
      { name: 'Muttai Podimas (Simple Home Egg Scramble)', vegName: 'Potato Roast (Urulai Varuval)', basePortion: 2.5, vegPortion: 1, unit: 'eggs scramble', vegUnit: 'cup', cal: 90, vegCal: 195, prot: 7.0, vegProt: 3.5, carb: 2, vegCarb: 28, fat: 6.0, vegFat: 8.0 }
    ]
  },
  {
    id: 'sambar_sadam_potato',
    title: 'South Indian Sambar Sadam with Urulaikizhangu Roast & Boiled Eggs',
    vegTitle: 'South Indian Sambar Sadam with Urulaikizhangu Roast & White Chana Sundal',
    baseTargetCal: 690,
    foods: [
      { name: 'South Indian Sambar Sadam (Lentil & Rice Mash)', basePortion: 2, unit: 'cups (320g)', cal: 280, prot: 8.5, carb: 52, fat: 4.5 },
      { name: 'Potato Roast (Urulai Kizhangu Varuval)', basePortion: 1, unit: 'cup (130g)', cal: 195, prot: 3.5, carb: 28, fat: 8.0 },
      { name: 'Boiled Eggs', vegName: 'White Chana Sundal', basePortion: 3, vegPortion: 1, unit: 'large eggs', vegUnit: 'cup', cal: 72, vegCal: 190, prot: 6.3, vegProt: 11, carb: 0.4, vegCarb: 31, fat: 5.0, vegFat: 3 }
    ]
  },
  {
    id: 'chicken_biryani',
    title: 'Simple Home Chicken Biryani (Veetu Chicken Biryani) with Thayir Raitha & Boiled Egg',
    vegTitle: 'South Indian Vegetable Biryani with Thayir Raitha & Kala Chana Sundal',
    isNonVeg: true,
    baseTargetCal: 740,
    foods: [
      { name: 'Simple Home Chicken Biryani (Veetu Chicken Biryani)', vegName: 'South Indian Vegetable Biryani', basePortion: 2, vegPortion: 2, unit: 'cups (320g)', vegUnit: 'cups (320g)', cal: 320, vegCal: 240, prot: 22, vegProt: 6, carb: 38, vegCarb: 46, fat: 11, vegFat: 7 },
      { name: 'Onion Pachadi (Thayir Raitha)', basePortion: 1, unit: 'bowl (150g)', cal: 85, prot: 3.5, carb: 7, fat: 4.5 },
      { name: 'Boiled Egg', vegName: 'Kala Chana Sundal', basePortion: 2, vegPortion: 1, unit: 'large eggs', vegUnit: 'cup', cal: 72, vegCal: 190, prot: 6.3, vegProt: 11, carb: 0.4, vegCarb: 31, fat: 5.0, vegFat: 3 }
    ]
  },
  {
    id: 'ennai_kathirikai',
    title: 'Ponni Rice with Ennai Kathirikai Kara Kuzhambu & South Indian Egg Omelet',
    vegTitle: 'Ponni Rice with Ennai Kathirikai Kara Kuzhambu & Potato Roast',
    baseTargetCal: 670,
    foods: [
      { name: 'Cooked Ponni Rice', basePortion: 1.8, unit: 'cups (280g)', cal: 200, prot: 4.2, carb: 45, fat: 0.4 },
      { name: 'Ennai Kathirikai Kara Kuzhambu (Baby Brinjal Curry)', basePortion: 1.2, unit: 'bowls (180g)', cal: 195, prot: 3.2, carb: 16, fat: 13.5 },
      { name: 'South Indian Egg Omelet (with Onions & Pepper)', vegName: 'Potato Roast (Urulai Varuval)', basePortion: 2.5, vegPortion: 1, unit: 'eggs omelet', vegUnit: 'cup', cal: 95, vegCal: 195, prot: 7.2, vegProt: 3.5, carb: 1.5, vegCarb: 28, fat: 7.0, vegFat: 8.0 }
    ]
  },
  {
    id: 'kollu_rasam',
    title: 'Ponni Rice with Kollu Rasam (Horse Gram Fat-Loss Soup) & Muttai Podimas',
    vegTitle: 'Ponni Rice with Kollu Rasam (Horse Gram Fat-Loss Soup) & Potato Roast',
    baseTargetCal: 610,
    foods: [
      { name: 'Cooked Ponni Rice', basePortion: 1.8, unit: 'cups (280g)', cal: 200, prot: 4.2, carb: 45, fat: 0.4 },
      { name: 'Kollu Rasam (Horse Gram Fat-Loss & Endurance Soup)', basePortion: 1.2, unit: 'bowls (220ml)', cal: 55, prot: 3.5, carb: 8, fat: 1.0 },
      { name: 'Muttai Podimas (Simple Home Egg Scramble)', vegName: 'Potato Roast (Urulai Kizhangu Varuval)', basePortion: 3, vegPortion: 1, unit: 'eggs scramble', vegUnit: 'cup (130g)', cal: 90, vegCal: 195, prot: 7.0, vegProt: 3.5, carb: 2, vegCarb: 28, fat: 6.0, vegFat: 8.0 }
    ]
  },
  {
    id: 'thakkali_sadam',
    title: 'South Indian Thakkali Sadam (Tomato Rice) with Egg Podimas & Thayir',
    vegTitle: 'South Indian Thakkali Sadam (Tomato Rice) with Cabbage Poriyal & Thayir',
    baseTargetCal: 640,
    foods: [
      { name: 'South Indian Tomato Rice (Thakkali Sadam)', basePortion: 2, unit: 'cups (300g)', cal: 240, prot: 5.0, carb: 46, fat: 4.5 },
      { name: 'Muttai Podimas (Egg Scramble)', vegName: 'Cabbage Poriyal with Coconut', basePortion: 2.5, vegPortion: 1.2, unit: 'eggs scramble', vegUnit: 'cup (120g)', cal: 90, vegCal: 85, prot: 7.0, vegProt: 2.5, carb: 2, vegCarb: 9, fat: 6.0, vegFat: 4.5 },
      { name: 'Fresh Curd (Thayir)', basePortion: 1, unit: 'bowl (150g)', cal: 95, prot: 5.0, carb: 6.5, fat: 5.5 }
    ]
  },
  {
    id: 'lemon_rice',
    title: 'South Indian Lemon Rice with Boiled Egg Roast & Medu Vada',
    vegTitle: 'South Indian Lemon Rice with White Chana Sundal & Medu Vada',
    baseTargetCal: 650,
    foods: [
      { name: 'South Indian Lemon Rice (Elumichai Sadam)', basePortion: 2, unit: 'cups (300g)', cal: 235, prot: 4.5, carb: 46, fat: 4.0 },
      { name: 'Crispy Medu Vada', basePortion: 1, unit: 'vada', cal: 145, prot: 4.5, carb: 16, fat: 7.5 },
      { name: 'Boiled Eggs', vegName: 'White Chana Sundal', basePortion: 3, vegPortion: 1, unit: 'large eggs', vegUnit: 'cup', cal: 72, vegCal: 190, prot: 6.3, vegProt: 11, carb: 0.4, vegCarb: 31, fat: 5.0, vegFat: 3 }
    ]
  },
  {
    id: 'paruppu_ghee_rice',
    title: 'Ponni Rice with Nei Paruppu (Ghee Dal), Poondu Rasam & Muttai Podimas',
    vegTitle: 'Ponni Rice with Nei Paruppu (Ghee Dal), Poondu Rasam & Urulai Varuval',
    baseTargetCal: 670,
    foods: [
      { name: 'Cooked Ponni Rice', basePortion: 1.8, unit: 'cups (280g)', cal: 200, prot: 4.2, carb: 45, fat: 0.4 },
      { name: 'Nei Paruppu (Toor Dal with Ghee)', basePortion: 1, unit: 'bowl (180g)', cal: 190, prot: 9.5, carb: 24, fat: 6.5 },
      { name: 'Poondu Rasam (Garlic Tamarind Broth)', basePortion: 1, unit: 'cup (180ml)', cal: 40, prot: 1.5, carb: 6, fat: 1.0 },
      { name: 'Muttai Podimas (Simple Home Egg Scramble)', vegName: 'Potato Roast (Urulai Varuval)', basePortion: 2.5, vegPortion: 1, unit: 'eggs scramble', vegUnit: 'cup', cal: 90, vegCal: 195, prot: 7.0, vegProt: 3.5, carb: 2, vegCarb: 28, fat: 6.0, vegFat: 8.0 }
    ]
  }
];

export const SOUTH_INDIAN_SNACKS = [
  {
    id: 'kala_chana_coffee',
    title: 'Kala Chana Sundal & Degree Filter Coffee',
    vegTitle: 'Kala Chana Sundal & Degree Filter Coffee',
    baseTargetCal: 280,
    foods: [
      { name: 'Black Chickpea Sundal (Kala Chana Sundal)', basePortion: 1.2, unit: 'cups (150g)', cal: 220, prot: 12.0, carb: 35, fat: 3.5 },
      { name: 'Degree Filter Coffee (with Toned Milk)', basePortion: 1, unit: 'davarah (150ml)', cal: 65, prot: 3.5, carb: 8, fat: 1.5 }
    ]
  },
  {
    id: 'pachai_payaru_tea',
    title: 'Pachai Payaru (Green Gram) Sundal & Masala Tea',
    vegTitle: 'Pachai Payaru (Green Gram) Sundal & Masala Tea',
    baseTargetCal: 275,
    foods: [
      { name: 'Pachai Payaru Sundal (Green Moong Sundal)', basePortion: 1.2, unit: 'cups (150g)', cal: 210, prot: 13.0, carb: 34, fat: 2.5 },
      { name: 'Masala Chai (with Toned Milk)', basePortion: 1, unit: 'cup (150ml)', cal: 65, prot: 3.2, carb: 8.5, fat: 1.8 }
    ]
  },
  {
    id: 'peanuts_coffee',
    title: 'Boiled Peanuts Sundal & Degree Filter Coffee',
    vegTitle: 'Boiled Peanuts Sundal & Degree Filter Coffee',
    baseTargetCal: 305,
    foods: [
      { name: 'Boiled Salted Peanuts Sundal', basePortion: 1, unit: 'cup (120g)', cal: 240, prot: 11.5, carb: 14, fat: 17.0 },
      { name: 'Degree Filter Coffee', basePortion: 1, unit: 'davarah (150ml)', cal: 65, prot: 3.5, carb: 8, fat: 1.5 }
    ]
  },
  {
    id: 'neer_mor_pottukadalai',
    title: 'Masala Neer Mor (Buttermilk) & Roasted Bengal Gram (Pottukadalai)',
    vegTitle: 'Masala Neer Mor & Roasted Bengal Gram (Pottukadalai)',
    baseTargetCal: 270,
    foods: [
      { name: 'Masala Neer Mor (Buttermilk with Ginger & Curry Leaves)', basePortion: 1.5, unit: 'glasses (350ml)', cal: 50, prot: 3.5, carb: 5, fat: 1.5 },
      { name: 'Roasted Bengal Gram (Pottukadalai)', basePortion: 1, unit: 'cup (60g)', cal: 220, prot: 12.5, carb: 34, fat: 3.5 }
    ]
  },
  {
    id: 'karamani_coffee',
    title: 'Karamani (Black-eyed Pea) Sundal & Degree Filter Coffee',
    vegTitle: 'Karamani (Black-eyed Pea) Sundal & Degree Filter Coffee',
    baseTargetCal: 265,
    foods: [
      { name: 'Karamani Sundal (Cowpea Sundal)', basePortion: 1.2, unit: 'cups (150g)', cal: 200, prot: 12.0, carb: 33, fat: 2.5 },
      { name: 'Degree Filter Coffee', basePortion: 1, unit: 'davarah (150ml)', cal: 65, prot: 3.5, carb: 8, fat: 1.5 }
    ]
  },
  {
    id: 'white_chana_tea',
    title: 'White Chana (Chole) Sundal & Inji (Ginger) Tea',
    vegTitle: 'White Chana Sundal & Inji Tea',
    baseTargetCal: 255,
    foods: [
      { name: 'White Chana Sundal (Sundal with Grated Coconut)', basePortion: 1, unit: 'cup (140g)', cal: 190, prot: 11.0, carb: 31, fat: 3.0 },
      { name: 'Inji Tea (Ginger Milk Tea)', basePortion: 1, unit: 'cup (150ml)', cal: 65, prot: 3.0, carb: 8.5, fat: 1.8 }
    ]
  },
  {
    id: 'biscuit_chai_eggs',
    title: 'Marie Gold Biscuits with Elaichi Tea & Boiled Egg Whites',
    vegTitle: 'Marie Gold Biscuits with Elaichi Tea & Roasted Almonds',
    baseTargetCal: 260,
    foods: [
      { name: 'Britannia Marie Gold Biscuits', basePortion: 4, unit: 'biscuits', cal: 28, prot: 0.6, carb: 5.6, fat: 0.5 },
      { name: 'Elaichi Chai (Cardamom Tea)', basePortion: 1, unit: 'cup (150ml)', cal: 68, prot: 3.0, carb: 9, fat: 1.8 },
      { name: 'Boiled Egg Whites', vegName: 'Roasted Almonds & Walnuts', basePortion: 3, vegPortion: 1, unit: 'egg whites', vegUnit: 'small handful (20g)', cal: 17, vegCal: 120, prot: 3.6, vegProt: 4.0, carb: 0.2, vegCarb: 4, fat: 0.1, vegFat: 10 }
    ]
  },
  {
    id: 'pattani_coffee',
    title: 'Pattani (White Peas) Sundal & Degree Filter Coffee',
    vegTitle: 'Pattani (White Peas) Sundal & Degree Filter Coffee',
    baseTargetCal: 270,
    foods: [
      { name: 'Pattani Sundal (Green / White Peas Sundal)', basePortion: 1.2, unit: 'cups (150g)', cal: 205, prot: 11.5, carb: 34, fat: 2.5 },
      { name: 'Degree Filter Coffee', basePortion: 1, unit: 'davarah (150ml)', cal: 65, prot: 3.5, carb: 8, fat: 1.5 }
    ]
  }
];

export const SOUTH_INDIAN_DINNERS = [
  {
    id: 'kal_dosa_thokku',
    title: 'Kal Dosa (Soft Sponge Dosas) with South Indian Egg Thokku & Sambar',
    vegTitle: 'Kal Dosa (Soft Sponge Dosas) with Tomato Thokku & Sambar',
    baseTargetCal: 580,
    foods: [
      { name: 'Kal Dosa (Thick Soft Sponge Dosa)', basePortion: 2.5, unit: 'dosas', cal: 120, prot: 3.0, carb: 22, fat: 2.0 },
      { name: 'Egg Thokku (Spicy Boiled Egg Roast)', vegName: 'Tomato Onion Thokku', basePortion: 3, vegPortion: 1, unit: 'eggs with gravy', vegUnit: 'serving (80g)', cal: 85, vegCal: 80, prot: 6.8, vegProt: 2.0, carb: 3, vegCarb: 9, fat: 5.5, vegFat: 4.0 },
      { name: 'Drumstick Sambar', basePortion: 1, unit: 'bowl (200ml)', cal: 140, prot: 6.5, carb: 22, fat: 2.8 }
    ]
  },
  {
    id: 'phulka_egg_curry',
    title: 'Soft Whole Wheat Phulkas with South Indian Egg Curry & Thayir',
    vegTitle: 'Soft Whole Wheat Phulkas with South Indian Veg Kurma & Thayir',
    baseTargetCal: 600,
    foods: [
      { name: 'Whole Wheat Phulka / Chapati', basePortion: 3, unit: 'phulkas', cal: 85, prot: 3.0, carb: 17, fat: 0.5 },
      { name: 'South Indian Muttai Kuzhambu (Egg Curry)', vegName: 'Vegetable Coconut Kurma', basePortion: 1.2, vegPortion: 1.2, unit: 'bowls', vegUnit: 'bowls', cal: 260, vegCal: 190, prot: 16, vegProt: 4.5, carb: 9, vegCarb: 16, fat: 17, vegFat: 12 },
      { name: 'Fresh Curd (Thayir)', basePortion: 1, unit: 'bowl (150g)', cal: 95, prot: 5.0, carb: 6.5, fat: 5.5 }
    ]
  },
  {
    id: 'crispy_dosa_chutney',
    title: 'Crispy Plain Dosa with South Indian Tomato Chutney & Boiled Eggs',
    vegTitle: 'Crispy Plain Dosa with South Indian Tomato Chutney & Pachai Payaru Sundal',
    baseTargetCal: 540,
    foods: [
      { name: 'Crispy Plain Dosa', basePortion: 2.5, unit: 'medium dosas', cal: 133, prot: 3.2, carb: 23, fat: 3.0 },
      { name: 'South Indian Tomato Chutney', basePortion: 1, unit: 'serving (60g)', cal: 60, prot: 1.5, carb: 7, fat: 3.0 },
      { name: 'Boiled Eggs', vegName: 'Pachai Payaru Sundal', basePortion: 3, vegPortion: 1, unit: 'large eggs', vegUnit: 'cup', cal: 72, vegCal: 210, prot: 6.3, vegProt: 13, carb: 0.4, vegCarb: 34, fat: 5.0, vegFat: 2.5 }
    ]
  },
  {
    id: 'curd_rice_roast',
    title: 'Tempered Curd Rice (Thayir Sadam) with South Indian Egg Thokku & Mavadu',
    vegTitle: 'Tempered Curd Rice (Thayir Sadam) with Potato Roast & Mavadu Pickle',
    baseTargetCal: 560,
    foods: [
      { name: 'South Indian Curd Rice (Tempered Thayir Sadam)', basePortion: 1.8, unit: 'cups (280g)', cal: 210, prot: 5.5, carb: 38, fat: 4.5 },
      { name: 'Egg Thokku (Spicy Boiled Egg Roast)', vegName: 'Potato Roast (Urulai Varuval)', basePortion: 3, vegPortion: 1, unit: 'eggs with gravy', vegUnit: 'cup', cal: 85, vegCal: 195, prot: 6.8, vegProt: 3.5, carb: 3, vegCarb: 28, fat: 5.5, vegFat: 8.0 },
      { name: 'South Indian Mango / Mavadu Pickle', basePortion: 1, unit: 'tsp', cal: 20, prot: 0.2, carb: 1, fat: 1.5 }
    ]
  },
  {
    id: 'pesarattu_chutney',
    title: 'Pesarattu (Green Moong Dosa) with Allam Chutney & Boiled Eggs',
    vegTitle: 'Pesarattu (Green Moong Dosa) with Allam Chutney & Sambar',
    baseTargetCal: 540,
    foods: [
      { name: 'Pesarattu (Whole Green Gram Dosa)', basePortion: 2.5, unit: 'medium dosas', cal: 150, prot: 8.0, carb: 22, fat: 3.5 },
      { name: 'Allam (Ginger) Chutney', basePortion: 1, unit: 'serving (50g)', cal: 55, prot: 1.0, carb: 8, fat: 2.5 },
      { name: 'Boiled Eggs', vegName: 'Drumstick Sambar', basePortion: 3, vegPortion: 1, unit: 'large eggs', vegUnit: 'bowl', cal: 72, vegCal: 140, prot: 6.3, vegProt: 6.5, carb: 0.4, vegCarb: 22, fat: 5.0, vegFat: 2.8 }
    ]
  },
  {
    id: 'steamed_idlis_kara',
    title: 'Steamed Idlis with Spicy Kara Chutney & Boiled Eggs',
    vegTitle: 'Steamed Idlis with Spicy Kara Chutney & Drumstick Sambar',
    baseTargetCal: 500,
    foods: [
      { name: 'Steamed Idli', basePortion: 4, unit: 'pieces', cal: 65, prot: 2.3, carb: 13, fat: 0.3 },
      { name: 'Kara Chutney (Spicy Onion Garlic Chutney)', basePortion: 1, unit: 'serving (60g)', cal: 55, prot: 1.5, carb: 6, fat: 3.0 },
      { name: 'Boiled Eggs', vegName: 'Drumstick Sambar', basePortion: 3, vegPortion: 1, unit: 'large eggs', vegUnit: 'bowl', cal: 72, vegCal: 140, prot: 6.3, vegProt: 6.5, carb: 0.4, vegCarb: 22, fat: 5.0, vegFat: 2.8 }
    ]
  },
  {
    id: 'chapati_veg_kurma',
    title: 'Soft Chapatis with Vegetable Coconut Kurma & Boiled Eggs',
    vegTitle: 'Soft Chapatis with Vegetable Coconut Kurma & White Chana Sundal',
    baseTargetCal: 550,
    foods: [
      { name: 'Whole Wheat Chapati', basePortion: 3, unit: 'chapatis', cal: 85, prot: 3.0, carb: 17, fat: 0.5 },
      { name: 'South Indian Vegetable Coconut Kurma', basePortion: 1, unit: 'bowl (200g)', cal: 180, prot: 4.5, carb: 18, fat: 10.0 },
      { name: 'Boiled Eggs', vegName: 'White Chana Sundal', basePortion: 3, vegPortion: 1, unit: 'large eggs', vegUnit: 'cup', cal: 72, vegCal: 190, prot: 6.3, vegProt: 11, carb: 0.4, vegCarb: 31, fat: 5.0, vegFat: 3 }
    ]
  },
  {
    id: 'appam_egg_curry',
    title: 'Kerala Appam with South Indian Egg Curry & Rasam',
    vegTitle: 'Kerala Appam with Vegetable Coconut Kurma & Rasam',
    baseTargetCal: 540,
    foods: [
      { name: 'Appam (Soft fermented rice hopper)', basePortion: 3, unit: 'pieces', cal: 95, prot: 2.0, carb: 20, fat: 1.0 },
      { name: 'South Indian Muttai Kuzhambu (Egg Curry)', vegName: 'Vegetable Coconut Kurma', basePortion: 1.2, vegPortion: 1.2, unit: 'bowls', vegUnit: 'bowls', cal: 260, vegCal: 190, prot: 16, vegProt: 4.5, carb: 9, vegCarb: 16, fat: 17, vegFat: 12 },
      { name: 'Tomato Garlic Rasam', basePortion: 1, unit: 'cup (180ml)', cal: 45, prot: 1.5, carb: 7, fat: 1.0 }
    ]
  },
  {
    id: 'egg_dosa_thayir',
    title: '2 Muttai Dosas (Egg Dosa with Pepper & Curry Leaves) with Tomato Chutney',
    vegTitle: '2 Plain Kal Dosas with Tomato Chutney & Fresh Curd',
    baseTargetCal: 550,
    foods: [
      { name: 'Egg Dosa (Muttai Dosa with Pepper & Curry Leaves)', vegName: 'Kal Dosa (Soft Sponge Dosa)', basePortion: 2, vegPortion: 2.5, unit: 'egg dosas', vegUnit: 'dosas', cal: 210, vegCal: 120, prot: 11.5, vegProt: 3.0, carb: 22, vegCarb: 22, fat: 8.5, vegFat: 2.0 },
      { name: 'South Indian Tomato Chutney', basePortion: 1, unit: 'serving (60g)', cal: 60, prot: 1.5, carb: 7, fat: 3.0 },
      { name: 'Fresh Curd (Thayir)', basePortion: 1, unit: 'cup (120g)', cal: 80, prot: 4.0, carb: 5.5, fat: 4.5 }
    ]
  }
];

// Helper to shuffle an array deterministically or randomly
export function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Scale a single meal template to match a specific target calorie allocation
export function scaleMealTemplate(template, mealType, time, targetMealCal, isVegOnly = false) {
  const activeTitle = isVegOnly ? (template.vegTitle || template.title) : template.title;

  // Compute raw template calories
  let rawMealCal = 0;
  template.foods.forEach(f => {
    const fCal = (isVegOnly && f.vegCal !== undefined) ? f.vegCal : f.cal;
    const fPortion = (isVegOnly && f.vegPortion !== undefined) ? f.vegPortion : f.basePortion;
    rawMealCal += fCal * fPortion;
  });

  const mealScale = Math.max(0.5, targetMealCal / (rawMealCal || 500));

  const scaledFoods = template.foods.map(f => {
    const fName = (isVegOnly && f.vegName) ? f.vegName : f.name;
    const fUnit = (isVegOnly && f.vegUnit) ? f.vegUnit : f.unit;
    const fCal = (isVegOnly && f.vegCal !== undefined) ? f.vegCal : f.cal;
    const fProt = (isVegOnly && f.vegProt !== undefined) ? f.vegProt : f.prot;
    const fCarb = (isVegOnly && f.vegCarb !== undefined) ? f.vegCarb : f.carb;
    const fFat = (isVegOnly && f.vegFat !== undefined) ? f.vegFat : f.fat;
    const fBase = (isVegOnly && f.vegPortion !== undefined) ? f.vegPortion : f.basePortion;

    const scaledPortionNum = Number((fBase * mealScale).toFixed(1));
    const cal = Math.round(fCal * scaledPortionNum);
    const prot = Number((fProt * scaledPortionNum).toFixed(1));
    const carb = Number((fCarb * scaledPortionNum).toFixed(1));
    const fat = Number((fFat * scaledPortionNum).toFixed(1));

    let portionLabel = `${scaledPortionNum} ${fUnit}`;
    if (fUnit.includes('eggs') || fUnit.includes('pieces') || fUnit.includes('dosas') || fUnit.includes('phulkas') || fUnit.includes('vada')) {
      portionLabel = `${Math.max(1, Math.round(scaledPortionNum))} ${fUnit}`;
    }

    return {
      name: fName,
      portion: portionLabel,
      calories: cal,
      protein: prot,
      carbs: carb,
      fat: fat
    };
  });

  const totalCal = scaledFoods.reduce((acc, f) => acc + f.calories, 0);
  const totalProt = Number(scaledFoods.reduce((acc, f) => acc + f.protein, 0).toFixed(1));
  const totalCarb = Number(scaledFoods.reduce((acc, f) => acc + f.carbs, 0).toFixed(1));
  const totalFat = Number(scaledFoods.reduce((acc, f) => acc + f.fat, 0).toFixed(1));

  return {
    mealType,
    title: activeTitle,
    time,
    foods: scaledFoods,
    mealCalories: totalCal,
    mealProtein: totalProt,
    mealCarbs: totalCarb,
    mealFat: totalFat
  };
}
