// Comprehensive South Indian & Global Nutrition Database (Zero-Token Local Engine)
export const foodDatabase = [
  // ==========================================
  // --- SOUTH INDIAN TIFFINS & BREAKFAST ---
  // ==========================================
  { name: 'Idli (Steamed, Standard)', aliases: ['idli', 'idly', 'steamed idli', 'soft idli', 'mallipoo idli'], serving: '2 pieces (100g)', calories: 130, protein: 4.5, carbs: 26.0, fat: 0.4, category: 'South Indian Tiffin' },
  { name: 'Podi Idli (with Gingelly / Sesame Oil & Idli Podi)', aliases: ['podi idli', 'podi idly', 'ghee podi idli', 'mini podi idli'], serving: '1 plate (150g)', calories: 260, protein: 5.5, carbs: 32.0, fat: 12.0, category: 'South Indian Tiffin' },
  { name: 'Mini Idli in Sambar (Sambar Idli)', aliases: ['sambar idli', 'sambar idly', 'mini sambar idli'], serving: '1 bowl (14 pieces + sambar)', calories: 235, protein: 7.5, carbs: 44.0, fat: 2.5, category: 'South Indian Tiffin' },
  { name: 'Plain Dosa / Sada Dosa', aliases: ['dosa', 'dosai', 'dhosa', 'sada dosa', 'plain dosa'], serving: '1 medium (80g)', calories: 133, protein: 3.2, carbs: 23.0, fat: 3.0, category: 'South Indian Tiffin' },
  { name: 'Ghee Roast Dosa', aliases: ['ghee roast', 'ghee roast dosa', 'neyyi roast', 'ghee dosa'], serving: '1 large crisp (120g)', calories: 290, protein: 4.0, carbs: 30.0, fat: 16.5, category: 'South Indian Tiffin' },
  { name: 'Masala Dosa (Potato Palya / Masala)', aliases: ['masala dosa', 'masala dosai'], serving: '1 medium (160g)', calories: 285, protein: 5.5, carbs: 42.0, fat: 10.5, category: 'South Indian Tiffin' },
  { name: 'Onion Uthappam', aliases: ['onion uthappam', 'uthappam', 'uttapam', 'onion uttapam'], serving: '1 medium (120g)', calories: 210, protein: 4.5, carbs: 35.0, fat: 5.5, category: 'South Indian Tiffin' },
  { name: 'Podi Dosa / Podi Uthappam', aliases: ['podi dosa', 'karam dosa', 'podi uthappam'], serving: '1 piece (110g)', calories: 240, protein: 5.0, carbs: 31.0, fat: 10.0, category: 'South Indian Tiffin' },
  { name: 'Egg Dosa / Muttai Dosa', aliases: ['egg dosa', 'muttai dosa', 'egg dosai'], serving: '1 piece with 1 egg (140g)', calories: 235, protein: 10.5, carbs: 24.0, fat: 10.0, category: 'South Indian Tiffin' },
  { name: 'Rava Dosa (Crispy Semolina Dosa)', aliases: ['rava dosa', 'crispy rava dosa', 'onion rava dosa'], serving: '1 large (100g)', calories: 195, protein: 3.8, carbs: 28.0, fat: 7.5, category: 'South Indian Tiffin' },
  { name: 'Ragi Dosa (Finger Millet)', aliases: ['ragi dosa', 'kezhvaragu dosa'], serving: '1 piece (80g)', calories: 125, protein: 3.5, carbs: 24.0, fat: 1.5, category: 'South Indian Tiffin' },
  { name: 'Set Dosa (Sponge Dosa, 2 pcs)', aliases: ['set dosa', 'sponge dosa'], serving: '2 pieces (120g)', calories: 200, protein: 4.8, carbs: 38.0, fat: 3.0, category: 'South Indian Tiffin' },
  { name: 'Sambar Vada / Sambar Vadai', aliases: ['sambar vada', 'sambar vadai', 'sambar vadi', 'sambhar vada', 'sambhar vadai', 'sambar wada', 'vada sambar', 'vadai sambar'], serving: '1 plate (2 pieces in sambar, 180g)', calories: 245, protein: 7.8, carbs: 30.0, fat: 10.5, category: 'South Indian Tiffin' },
  { name: 'Medu Vada (Urad Dal Crispy Donut Vada)', aliases: ['medu vada', 'medu vadai', 'ulundu vadai', 'vada', 'vadai', 'vadi', 'wada', 'wadai'], serving: '1 piece (50g)', calories: 145, protein: 4.2, carbs: 14.0, fat: 8.5, category: 'South Indian Tiffin' },
  { name: 'Curd Vada / Thayir Vadai (Dahi Vada)', aliases: ['curd vada', 'thayir vadai', 'thayir vada', 'dahi vada'], serving: '1 plate (2 pieces in spiced curd)', calories: 260, protein: 8.0, carbs: 26.0, fat: 14.0, category: 'South Indian Tiffin' },
  { name: 'Masala Vada / Paruppu Vadai (Chana Dal)', aliases: ['masala vada', 'paruppu vadai', 'crispy vada', 'chana dal vada'], serving: '1 piece (50g)', calories: 155, protein: 5.0, carbs: 15.0, fat: 9.0, category: 'South Indian Tiffin' },
  { name: 'Ven Pongal (Ghee & Moong Dal Pongal)', aliases: ['ven pongal', 'pongal', 'khara pongal', 'ghee pongal'], serving: '1 plate (200g)', calories: 340, protein: 7.5, carbs: 46.0, fat: 14.0, category: 'South Indian Tiffin' },
  { name: 'Sweet Pongal / Sakkarai Pongal (Jaggery & Ghee)', aliases: ['sakkarai pongal', 'sweet pongal', 'chakkara pongal'], serving: '1 bowl (150g)', calories: 390, protein: 4.5, carbs: 68.0, fat: 11.5, category: 'Dessert' },
  { name: 'Appam (Kerala Palappam / Hoppers)', aliases: ['appam', 'palappam', 'kerala appam', 'hoppers'], serving: '2 pieces (100g)', calories: 140, protein: 2.2, carbs: 28.0, fat: 2.0, category: 'South Indian Tiffin' },
  { name: 'Idiyappam / Sevai (String Hoppers)', aliases: ['idiyappam', 'sevai', 'nool puttu', 'string hoppers'], serving: '3 nests (150g)', calories: 165, protein: 2.8, carbs: 36.0, fat: 0.5, category: 'South Indian Tiffin' },
  { name: 'Puttu (Kerala Steamed Rice Puttu)', aliases: ['puttu', 'kerala puttu', 'rice puttu'], serving: '1 cylindrical cup (140g)', calories: 215, protein: 4.0, carbs: 44.0, fat: 2.5, category: 'South Indian Tiffin' },
  { name: 'Ragi Puttu (Finger Millet Puttu)', aliases: ['ragi puttu', 'kezhvaragu puttu'], serving: '1 cup (140g)', calories: 200, protein: 4.5, carbs: 41.0, fat: 2.0, category: 'South Indian Tiffin' },
  { name: 'Rava Upma (Semolina / Sooji)', aliases: ['upma', 'rava upma', 'uppumavu', 'uppittu'], serving: '1 bowl (180g)', calories: 220, protein: 5.0, carbs: 38.0, fat: 5.5, category: 'South Indian Tiffin' },
  { name: 'Semiya Upma (Vermicelli)', aliases: ['semiya upma', 'vermicelli upma'], serving: '1 bowl (180g)', calories: 210, protein: 4.2, carbs: 39.0, fat: 4.0, category: 'South Indian Tiffin' },
  { name: 'Poori Masala (2 Pooris with Potato Masala)', aliases: ['poori masala', 'puri masala', 'poori kizhangu', 'poori'], serving: '2 pooris + 1 bowl masala', calories: 420, protein: 7.0, carbs: 54.0, fat: 20.0, category: 'South Indian Tiffin' },
  { name: 'Ragi Koozh (Tamil Millet Porridge / Ambli)', aliases: ['ragi koozh', 'koozh', 'ragi ambli'], serving: '1 large glass (300ml)', calories: 135, protein: 3.5, carbs: 27.0, fat: 1.0, category: 'South Indian Tiffin' },
  { name: 'Neer Dosa (Mangalore Rice Crepe)', aliases: ['neer dosa'], serving: '2 pieces (100g)', calories: 120, protein: 2.0, carbs: 26.0, fat: 0.5, category: 'South Indian Tiffin' },
  { name: 'Pesarattu (Green Moong Dal Dosa - Andhra)', aliases: ['pesarattu', 'moong dal dosa', 'mla pesarattu'], serving: '1 piece (120g)', calories: 185, protein: 9.8, carbs: 26.0, fat: 4.5, category: 'South Indian Tiffin' },
  { name: 'Adai Avial (High-Protein Multi-Lentil Pancake with Avial)', aliases: ['adai avial', 'adai', 'paruppu adai', 'avial adai', 'lentil dosa'], serving: '2 adais + 1 bowl avial (260g)', calories: 340, protein: 14.5, carbs: 46.0, fat: 11.0, category: 'South Indian Tiffin' },
  { name: 'Chettinad Kuzhi Paniyaram (Crispy Rice & Dal Dumplings)', aliases: ['kuzhi paniyaram', 'paniyaram', 'kara paniyaram', 'vellai paniyaram', 'appe', 'paddu'], serving: '5 pieces (150g)', calories: 230, protein: 5.5, carbs: 36.0, fat: 7.0, category: 'South Indian Tiffin' },
  { name: 'Muttai Paniyaram (Egg Spiced Paniyaram)', aliases: ['muttai paniyaram', 'egg paniyaram'], serving: '5 pieces (160g)', calories: 270, protein: 12.0, carbs: 28.0, fat: 12.0, category: 'South Indian Tiffin' },
  { name: 'Kal Dosa (Soft Sponge Dosa)', aliases: ['kal dosa', 'kal dosai', 'thick dosa', 'sponge dosa'], serving: '2 dosas (140g)', calories: 190, protein: 4.5, carbs: 34.0, fat: 3.5, category: 'South Indian Tiffin' },

  // ==========================================
  // --- SOUTH INDIAN RICE & VARIETY RICE ---
  // ==========================================
  { name: 'Steamed White Ponni / Sona Masoori Rice', aliases: ['ponni rice', 'sona masoori', 'white rice', 'cooked rice', 'sadam', 'rice', 'plain rice', 'chawal'], serving: '1 cup cooked (160g)', calories: 205, protein: 4.2, carbs: 45.0, fat: 0.4, category: 'Rice Varieties' },
  { name: 'Matta Rice (Kerala Red Parboiled Rice)', aliases: ['matta rice', 'kerala red rice', 'red rice'], serving: '1 cup cooked (180g)', calories: 215, protein: 4.8, carbs: 46.0, fat: 0.8, category: 'Rice Varieties' },
  { name: 'Sambar Sadam (Sambar Rice with Ghee)', aliases: ['sambar rice', 'sambar sadam', 'sambhar sadam', 'sambhar rice'], serving: '1 large plate (280g)', calories: 340, protein: 8.5, carbs: 58.0, fat: 8.0, category: 'Rice Varieties' },
  { name: 'Curd Rice (Thayir Sadam with Mustard Tadka)', aliases: ['curd rice', 'thayir sadam', 'thayir saadham', 'thayir choru', 'daddojanam', 'bagala bath'], serving: '1 bowl (250g)', calories: 260, protein: 6.8, carbs: 42.0, fat: 7.0, category: 'Rice Varieties' },
  { name: 'Rasam Sadam (Rasam Rice with Ghee)', aliases: ['rasam rice', 'rasam sadam', 'charu annam'], serving: '1 plate (250g)', calories: 230, protein: 5.0, carbs: 46.0, fat: 3.0, category: 'Rice Varieties' },
  { name: 'Lemon Rice (Elamichai Sadam / Chitranna)', aliases: ['lemon rice', 'elamichai sadam', 'chitranna', 'nimmakaya pulihora'], serving: '1 plate (220g)', calories: 310, protein: 5.5, carbs: 48.0, fat: 11.0, category: 'Rice Varieties' },
  { name: 'Tomato Rice (Thakkali Sadam)', aliases: ['tomato rice', 'thakkali sadam', 'thakkali bath'], serving: '1 plate (240g)', calories: 320, protein: 5.8, carbs: 52.0, fat: 9.5, category: 'Rice Varieties' },
  { name: 'Tamarind Rice (Puliyodharai / Pulihora)', aliases: ['puliyodharai', 'pulihora', 'tamarind rice', 'kovil puliyodharai'], serving: '1 plate (220g)', calories: 360, protein: 6.0, carbs: 54.0, fat: 13.5, category: 'Rice Varieties' },
  { name: 'Bisi Bele Bath (Karnataka Spiced Rice Lentil Pot)', aliases: ['bisi bele bath', 'bisibelebath'], serving: '1 plate (280g)', calories: 365, protein: 9.5, carbs: 58.0, fat: 10.5, category: 'Rice Varieties' },
  { name: 'Coconut Rice (Thengai Sadam)', aliases: ['coconut rice', 'thengai sadam', 'kobbari annam'], serving: '1 plate (200g)', calories: 375, protein: 4.8, carbs: 44.0, fat: 19.5, category: 'Rice Varieties' },
  { name: 'Ghee Rice (Neychoru)', aliases: ['ghee rice', 'neychoru', 'ney chor'], serving: '1 plate (220g)', calories: 380, protein: 5.0, carbs: 48.0, fat: 18.0, category: 'Rice Varieties' },
  { name: 'Thalassery / Malabar Chicken Biryani', aliases: ['malabar biryani', 'thalassery biryani', 'kerala biryani'], serving: '1 full plate (350g)', calories: 540, protein: 29.0, carbs: 64.0, fat: 18.0, category: 'Rice Varieties' },
  { name: 'Ambur / Dindigul Seeraga Samba Mutton Biryani', aliases: ['dindigul biryani', 'ambur biryani', 'seeraga samba biryani', 'thalappakatti'], serving: '1 full plate (380g)', calories: 620, protein: 32.0, carbs: 68.0, fat: 24.0, category: 'Rice Varieties' },
  { name: 'Hyderabadi Chicken Dum Biryani', aliases: ['hyderabadi biryani', 'chicken dum biryani', 'chicken biryani', 'biryani', 'biriyani', 'briyani'], serving: '1 full plate (400g)', calories: 590, protein: 34.0, carbs: 66.0, fat: 21.0, category: 'Rice Varieties' },
  { name: 'Traditional South Indian Full Meals (Thali)', aliases: ['south indian meals', 'thali', 'sadhya', 'kerala sadhya'], serving: '1 complete meal (Rice, Sambar, Rasam, Kootu, Poriyal, Curd, Appalam)', calories: 720, protein: 18.0, carbs: 125.0, fat: 16.0, category: 'South Indian Meals' },

  // ==========================================
  // --- SAMBAR, RASAM, KARAKOLAMBU & REGIONAL CURRIES ---
  // ==========================================
  { name: 'Poondu Kara Kuzhambu / Karakolambu (Spicy Garlic Tamarind Curry)', aliases: ['karakolambu', 'kara kolambu', 'poondu kara kuzhambu', 'poondu karakolambu', 'kara kuzhambu', 'kara kulambu', 'puli kuzhambu', 'puli kulambu', 'garlic karakolambu', 'garlic kara kuzhambu'], serving: '1 bowl (180ml)', calories: 150, protein: 3.0, carbs: 16.0, fat: 8.5, category: 'South Indian Curries' },
  { name: 'Ennai Kathirikai Kara Kuzhambu / Karakolambu (Baby Brinjal Curry)', aliases: ['ennai kathirikai kara kuzhambu', 'ennai kathirikai karakolambu', 'ennai kathirikai kuzhambu', 'ennai kathirikai kolambu', 'kathirikai karakolambu', 'kathirikai kuzhambu', 'gutti vankaya'], serving: '1 bowl (180g)', calories: 195, protein: 3.2, carbs: 16.0, fat: 13.5, category: 'South Indian Curries' },
  { name: 'Vendakkai Kara Kuzhambu / Karakolambu (Okra Spicy Tamarind Curry)', aliases: ['vendakkai kara kuzhambu', 'vendakkai karakolambu', 'vendakkai kuzhambu', 'vendakkai kolambu', 'okra karakolambu'], serving: '1 bowl (180ml)', calories: 145, protein: 2.8, carbs: 15.0, fat: 8.0, category: 'South Indian Curries' },
  { name: 'Vatha Kuzhambu / Vathal Kolambu (Sundakkai / Manathakkali)', aliases: ['vatha kuzhambu', 'vatha kolambu', 'vathal kuzhambu', 'vathal kolambu', 'sundakkai vatha kuzhambu'], serving: '1 ladle (90ml)', calories: 135, protein: 2.0, carbs: 13.0, fat: 8.5, category: 'South Indian Curries' },
  { name: 'Mor Kuzhambu / Pulissery (Buttermilk Coconut Curry)', aliases: ['mor kuzhambu', 'mor kolambu', 'mor kulambu', 'pulissery', 'majjiga pulusu'], serving: '1 bowl (180ml)', calories: 155, protein: 4.5, carbs: 11.0, fat: 10.0, category: 'South Indian Curries' },
  { name: 'Paruppu Urundai Kuzhambu (Steamed Lentil Dumpling Curry)', aliases: ['paruppu urundai kuzhambu', 'paruppu urundai kolambu', 'urundai kuzhambu', 'urundai kolambu'], serving: '1 bowl (200g)', calories: 230, protein: 11.5, carbs: 26.0, fat: 9.0, category: 'South Indian Curries' },
  { name: 'Milagu Kuzhambu (Spicy Black Pepper Tamarind Curry)', aliases: ['milagu kuzhambu', 'milagu kolambu', 'pepper kuzhambu', 'pepper gravy'], serving: '1 ladle (90ml)', calories: 125, protein: 2.2, carbs: 12.0, fat: 7.5, category: 'South Indian Curries' },
  { name: 'Drumstick & Vegetable Sambar', aliases: ['sambar', 'sambhar', 'drumstick sambar', 'paruppu sambar'], serving: '1 bowl (200ml)', calories: 140, protein: 6.5, carbs: 22.0, fat: 2.8, category: 'South Indian Curries' },
  { name: 'Kollu Rasam (Horse Gram Fat-Loss & Endurance Soup)', aliases: ['kollu rasam', 'horse gram rasam', 'kollu soup', 'kollu charu'], serving: '1 cup (180ml)', calories: 55, protein: 3.5, carbs: 8.0, fat: 1.0, category: 'South Indian Curries' },
  { name: 'Tomato Garlic Rasam (Thakkali Poondu Rasam)', aliases: ['rasam', 'tomato rasam', 'thakkali rasam', 'poondu rasam'], serving: '1 cup (180ml)', calories: 45, protein: 1.5, carbs: 7.0, fat: 1.0, category: 'South Indian Curries' },
  { name: 'Pepper Garlic Rasam (Milagu Poondu Rasam)', aliases: ['pepper rasam', 'garlic rasam', 'milagu rasam', 'jeera rasam'], serving: '1 cup (180ml)', calories: 40, protein: 1.2, carbs: 6.5, fat: 1.0, category: 'South Indian Curries' },
  { name: 'Lemon Rasam / Elumichai Rasam', aliases: ['lemon rasam', 'elumichai rasam'], serving: '1 cup (180ml)', calories: 38, protein: 1.2, carbs: 6.0, fat: 1.0, category: 'South Indian Curries' },
  { name: 'Kerala Avial (Mixed Vegetables in Coconut & Curd)', aliases: ['avial', 'kerala avial', 'aviyal'], serving: '1 bowl (150g)', calories: 160, protein: 3.5, carbs: 14.0, fat: 10.5, category: 'South Indian Curries' },
  { name: 'Cabbage Poriyal / Thoran (with Grated Coconut)', aliases: ['cabbage poriyal', 'cabbage thoran', 'muttakos poriyal'], serving: '1 cup (120g)', calories: 85, protein: 2.5, carbs: 9.0, fat: 4.5, category: 'South Indian Poriyal' },
  { name: 'Beans & Carrot Poriyal / Thoran', aliases: ['beans poriyal', 'beans thoran', 'carrot poriyal', 'beans carrot poriyal'], serving: '1 cup (120g)', calories: 90, protein: 3.0, carbs: 10.0, fat: 4.5, category: 'South Indian Poriyal' },
  { name: 'Potato Roast / Urulai Kizhangu Varuval', aliases: ['potato fry', 'urulai roast', 'potato roast', 'urulaikizhangu roast', 'aloo fry'], serving: '1 cup (130g)', calories: 195, protein: 3.5, carbs: 28.0, fat: 8.0, category: 'South Indian Poriyal' },
  { name: 'Beetroot Poriyal', aliases: ['beetroot poriyal', 'beetroot thoran'], serving: '1 cup (120g)', calories: 80, protein: 2.0, carbs: 13.0, fat: 2.5, category: 'South Indian Poriyal' },
  { name: 'Vendakkai Poriyal / Bhindi Fry (Crispy Okra)', aliases: ['vendakkai poriyal', 'okra fry', 'bhindi poriyal', 'okra roast'], serving: '1 cup (110g)', calories: 95, protein: 2.2, carbs: 10.0, fat: 5.5, category: 'South Indian Poriyal' },
  { name: 'Vazhaikkai Varuval (Raw Banana Fry / Roast)', aliases: ['vazhaikkai varuval', 'raw banana roast', 'plantain roast', 'vazhaikkai roast'], serving: '1 cup (130g)', calories: 175, protein: 2.5, carbs: 29.0, fat: 6.0, category: 'South Indian Poriyal' },
  { name: 'Vegetable Kootu (Chana Dal, Chow Chow / Snake Gourd)', aliases: ['kootu', 'chow chow kootu', 'paruppu kootu', 'snake gourd kootu'], serving: '1 bowl (150g)', calories: 140, protein: 5.5, carbs: 18.0, fat: 5.0, category: 'South Indian Curries' },
  { name: 'Keerai Kootu / Keerai Masiyal (Spinach Lentil Mash)', aliases: ['keerai kootu', 'keerai masiyal', 'spinach kootu', 'keerai'], serving: '1 bowl (160g)', calories: 130, protein: 6.0, carbs: 16.0, fat: 4.5, category: 'South Indian Curries' },
  { name: 'Kadala Curry (Kerala Black Chickpeas Curry for Puttu/Appam)', aliases: ['kadala curry', 'kerala kadala curry', 'black chana curry'], serving: '1 bowl (200g)', calories: 230, protein: 11.0, carbs: 32.0, fat: 6.5, category: 'South Indian Curries' },
  { name: 'Vegetable Kurma (Coconut, Cashew & Fennel Gravy)', aliases: ['veg kurma', 'saravana bhavan veg kurma', 'kurma'], serving: '1 bowl (180g)', calories: 190, protein: 4.5, carbs: 16.0, fat: 12.0, category: 'South Indian Curries' },
  { name: 'Gongura Pappu (Andhra Sorrel Leaves Dal)', aliases: ['gongura pappu', 'andhra dal', 'gongura dal'], serving: '1 bowl (180g)', calories: 185, protein: 9.5, carbs: 24.0, fat: 5.5, category: 'South Indian Curries' },
  { name: 'Tomato Pappu (Andhra Tomato Dal)', aliases: ['tomato pappu'], serving: '1 bowl (180g)', calories: 170, protein: 9.0, carbs: 23.0, fat: 4.5, category: 'South Indian Curries' },
  { name: 'Kala Chana Sundal (Black Chickpeas with Mustard & Coconut)', aliases: ['kala chana sundal', 'black chana sundal', 'chana sundal', 'sundal'], serving: '1 cup (150g)', calories: 220, protein: 12.0, carbs: 35.0, fat: 3.5, category: 'South Indian Poriyal' },
  { name: 'Pachai Payaru Sundal (Whole Green Gram Sundal)', aliases: ['pachai payaru sundal', 'green gram sundal', 'payaru sundal'], serving: '1 cup (150g)', calories: 210, protein: 13.0, carbs: 34.0, fat: 2.5, category: 'South Indian Poriyal' },
  { name: 'Karamani Sundal (Black-eyed Pea Sundal)', aliases: ['karamani sundal', 'thattai payaru sundal'], serving: '1 cup (150g)', calories: 200, protein: 12.0, carbs: 33.0, fat: 2.5, category: 'South Indian Poriyal' },
  { name: 'Pattani Sundal (Yellow / White Peas Beach Sundal)', aliases: ['pattani sundal', 'peas sundal', 'white peas sundal'], serving: '1 cup (150g)', calories: 205, protein: 11.5, carbs: 34.0, fat: 2.5, category: 'South Indian Poriyal' },
  { name: 'Boiled Peanuts Sundal (Verkadalai Sundal)', aliases: ['boiled peanuts', 'peanuts sundal', 'verkadalai sundal'], serving: '1 cup (120g)', calories: 240, protein: 11.5, carbs: 14.0, fat: 17.0, category: 'South Indian Poriyal' },

  // ==========================================
  // --- NON-VEG CURRIES, EGGS & SEAFOOD ---
  // ==========================================
  { name: 'Chettinad Chicken Curry / Kozhi Kuzhambu', aliases: ['chettinad chicken', 'chettinad chicken curry', 'kozhi kuzhambu', 'kozhi kolambu', 'chicken kozhambu', 'chicken curry'], serving: '1 bowl with pieces (220g)', calories: 310, protein: 29.0, carbs: 8.0, fat: 18.0, category: 'South Indian Non-Veg' },
  { name: 'Nattu Kozhi Kuzhambu (Country Chicken Village Gravy)', aliases: ['nattu kozhi kuzhambu', 'nattu kozhi kolambu', 'nattu kozhi', 'country chicken curry', 'nattu kozhi varuval'], serving: '1 bowl (220g)', calories: 330, protein: 32.0, carbs: 6.0, fat: 19.0, category: 'South Indian Non-Veg' },
  { name: 'Pepper Chicken Sukka / Varuval', aliases: ['pepper chicken', 'chicken sukka', 'chicken varuval', 'pepper chicken sukka'], serving: '1 portion (180g)', calories: 280, protein: 36.0, carbs: 5.0, fat: 12.0, category: 'South Indian Non-Veg' },
  { name: 'South Indian Chicken Salna / Korma (Madurai Salna)', aliases: ['chicken salna', 'salna', 'chicken korma', 'roadside salna', 'parotta salna'], serving: '1 bowl (220ml)', calories: 230, protein: 18.0, carbs: 8.0, fat: 14.0, category: 'South Indian Non-Veg' },
  { name: 'Kerala Meen Curry / Meen Kuzhambu (Clay Pot Fish Curry)', aliases: ['meen kuzhambu', 'meen kolambu', 'meen kulambu', 'kerala fish curry', 'meen curry', 'tamil fish curry', 'kottayam fish curry', 'fish curry'], serving: '1 bowl with fish (200g)', calories: 220, protein: 24.0, carbs: 6.0, fat: 11.0, category: 'South Indian Non-Veg' },
  { name: 'Fish Fry / Vanjaram Meen Varuval (King Fish / Seer Fish)', aliases: ['vanjaram fry', 'fish fry', 'meen varuval', 'king fish fry', 'vanjaram fish'], serving: '1 slice (120g)', calories: 210, protein: 25.0, carbs: 3.5, fat: 10.5, category: 'South Indian Non-Veg' },
  { name: 'Ayala / Mackerel Fish Fry (Crispy Tawa Fry)', aliases: ['ayala fry', 'mackerel fry', 'bangda fry', 'ayala meen'], serving: '1 whole fish (130g)', calories: 240, protein: 24.0, carbs: 3.0, fat: 14.5, category: 'South Indian Non-Veg' },
  { name: 'Chettinad Mutton Sukka / Varuval', aliases: ['mutton sukka', 'mutton varuval', 'chettinad mutton', 'mutton chukka'], serving: '1 portion (150g)', calories: 320, protein: 26.0, carbs: 4.0, fat: 22.0, category: 'South Indian Non-Veg' },
  { name: 'Muttai Podimas (South Indian Egg Scramble with Onions & Chillies)', aliases: ['muttai podimas', 'egg podimas', 'egg scramble', 'podimas', 'muttai poriyal'], serving: '2 eggs scramble (140g)', calories: 180, protein: 14.0, carbs: 4.0, fat: 12.0, category: 'South Indian Non-Veg' },
  { name: 'South Indian Egg Omelet (with Onions, Curry Leaves & Pepper)', aliases: ['egg omelet', 'muttai omelet', 'omelet', 'omlet', 'south indian omelet'], serving: '2 eggs omelet (130g)', calories: 190, protein: 14.5, carbs: 3.0, fat: 13.5, category: 'South Indian Non-Veg' },
  { name: 'Egg Thokku / Muttai Roast (Spicy Onion Tomato Gravy)', aliases: ['egg thokku', 'muttai thokku', 'egg roast', 'kerala egg roast', 'muttai roast'], serving: '2 eggs with masala (180g)', calories: 250, protein: 14.5, carbs: 10.0, fat: 16.5, category: 'South Indian Non-Veg' },
  { name: 'South Indian Muttai Kuzhambu / Egg Curry', aliases: ['muttai kuzhambu', 'muttai kolambu', 'egg kuzhambu', 'egg curry', 'muttai curry'], serving: '1 bowl with 2 eggs (200g)', calories: 260, protein: 16.0, carbs: 9.0, fat: 17.0, category: 'South Indian Non-Veg' },
  { name: 'Egg Kurma (Muttai Kurma for Parotta / Rice)', aliases: ['egg kurma', 'muttai kurma'], serving: '1 bowl with 2 eggs (200g)', calories: 275, protein: 15.0, carbs: 11.0, fat: 19.0, category: 'South Indian Non-Veg' },
  { name: 'Nethili Fish Fry (Crispy Anchovy Fry)', aliases: ['nethili fry', 'anchovy fry', 'nethili varuval', 'nethili meen'], serving: '1 plate (100g)', calories: 215, protein: 22.0, carbs: 4.0, fat: 12.0, category: 'South Indian Non-Veg' },
  { name: 'Prawn Masala / Eral Thokku', aliases: ['prawn thokku', 'eral thokku', 'prawn masala', 'chemmeen roast', 'eral varuval'], serving: '1 bowl (180g)', calories: 230, protein: 26.0, carbs: 8.0, fat: 10.0, category: 'South Indian Non-Veg' },
  { name: 'Madurai Chicken Kari Dosa (Minced Meat Layered Dosa)', aliases: ['kari dosa', 'chicken kari dosa', 'mutton kari dosa'], serving: '1 heavy dosa (250g)', calories: 440, protein: 28.0, carbs: 36.0, fat: 20.0, category: 'South Indian Non-Veg' },
  { name: 'Malabar Parotta / Kerala Parotta', aliases: ['parotta', 'kerala parotta', 'malabar parotta', 'barotta', 'porotta'], serving: '1 layered parotta (80g)', calories: 260, protein: 5.0, carbs: 36.0, fat: 11.0, category: 'South Indian Breads' },
  { name: 'Kothu Parotta (Egg & Chicken Shredded Parotta)', aliases: ['kothu parotta', 'egg kothu parotta', 'chicken kothu parotta', 'muttai kothu parotta'], serving: '1 plate (300g)', calories: 580, protein: 26.0, carbs: 62.0, fat: 25.0, category: 'South Indian Non-Veg' },

  // ==========================================
  // --- CHUTNEYS, PODIS & ACCOMPANIMENTS ---
  // ==========================================
  { name: 'Coconut Chutney (White Thenkai Chutney)', aliases: ['coconut chutney', 'white chutney', 'thengai chutney', 'chutney'], serving: '2 tbsp (40g)', calories: 85, protein: 1.2, carbs: 3.5, fat: 7.5, category: 'Chutneys' },
  { name: 'Tomato Chutney / Thakkali Chutney (Red Chutney)', aliases: ['tomato chutney', 'thakkali chutney', 'red chutney'], serving: '2 tbsp (40g)', calories: 45, protein: 0.8, carbs: 5.5, fat: 2.2, category: 'Chutneys' },
  { name: 'Kara Chutney / Onion Garlic Chutney', aliases: ['kara chutney', 'onion chutney', 'poondu chutney'], serving: '2 tbsp (40g)', calories: 50, protein: 0.9, carbs: 6.0, fat: 2.5, category: 'Chutneys' },
  { name: 'Coriander Mint Chutney (Kothamalli Chutney)', aliases: ['kothamalli chutney', 'coriander chutney', 'pudina chutney'], serving: '2 tbsp (40g)', calories: 35, protein: 1.0, carbs: 4.0, fat: 1.5, category: 'Chutneys' },
  { name: 'Peanut Chutney / Verkadalai Chutney (Andhra Palli Chutney)', aliases: ['peanut chutney', 'verkadalai chutney', 'palli chutney'], serving: '2 tbsp (40g)', calories: 120, protein: 4.5, carbs: 4.0, fat: 9.5, category: 'Chutneys' },
  { name: 'Idli Milagai Podi (Gunpowder with 1 tsp Sesame Oil)', aliases: ['idli podi', 'gunpowder', 'karam podi', 'podi'], serving: '1 serving (15g podi + 5ml nallennai/gingelly oil)', calories: 105, protein: 2.5, carbs: 6.5, fat: 8.0, category: 'Chutneys' },
  { name: 'Appalam / Papad (Fried South Indian Lentil Crisp)', aliases: ['appalam', 'papad', 'papadum'], serving: '1 piece (15g)', calories: 65, protein: 2.0, carbs: 6.0, fat: 3.8, category: 'Accompaniments' },
  { name: 'Roasted Appalam (Microwaved / Fire Roasted 0 Oil)', aliases: ['roasted appalam', 'roasted papad'], serving: '1 piece (12g)', calories: 35, protein: 2.2, carbs: 6.5, fat: 0.1, category: 'Accompaniments' },
  { name: 'Mavadu / Baby Mango Pickle', aliases: ['mavadu', 'mango pickle', 'avakkai pickle'], serving: '1 tsp (15g)', calories: 25, protein: 0.2, carbs: 1.5, fat: 2.0, category: 'Accompaniments' },

  // ==========================================
  // --- SOUTH INDIAN DRINKS & HEALTH SIPS ---
  // ==========================================
  { name: 'South Indian Filter Coffee (Degree Kaapi with Whole Milk & Sugar)', aliases: ['filter coffee', 'degree coffee', 'filter kaapi', 'coffee', 'coffe', 'kaapi', 'south indian coffee', 'degree kaapi', 'hot coffee'], serving: '1 cup / davarah (150ml)', calories: 110, protein: 3.5, carbs: 14.0, fat: 4.5, category: 'Beverages' },
  { name: 'South Indian Filter Coffee (Sugar-Free)', aliases: ['sugar free coffee', 'sugarless coffee', 'sugar free filter coffee', 'sugarless filter coffee', 'coffee without sugar'], serving: '1 cup / davarah (150ml)', calories: 58, protein: 3.4, carbs: 4.5, fat: 3.8, category: 'Beverages' },
  { name: 'Instant Coffee (Bru / Nescafe with Milk & Sugar)', aliases: ['instant coffee', 'nescafe', 'bru coffee', 'bru', 'milk coffee', 'instant milk coffee'], serving: '1 cup (150ml)', calories: 102, protein: 3.0, carbs: 13.5, fat: 4.0, category: 'Beverages' },
  { name: 'Black Filter Coffee (Sugar-free)', aliases: ['black coffee', 'black filter coffee', 'sugar free black coffee', 'americano', 'espresso'], serving: '1 cup (150ml)', calories: 5, protein: 0.3, carbs: 0.8, fat: 0.0, category: 'Beverages' },
  { name: 'Cold Coffee (with Whole Milk & Sugar)', aliases: ['cold coffee', 'iced coffee', 'frappe'], serving: '1 glass (250ml)', calories: 210, protein: 5.5, carbs: 32.0, fat: 7.0, category: 'Beverages' },
  { name: 'Sukku Kaapi / Dry Ginger Coriander Herbal Coffee', aliases: ['sukku kaapi', 'dry ginger coffee', 'chukku kaapi'], serving: '1 cup (150ml)', calories: 45, protein: 0.4, carbs: 11.0, fat: 0.1, category: 'Beverages' },

  // --- INDIAN CHAI & TEAS ---
  { name: 'Masala Chai / Indian Milk Tea (with Sugar)', aliases: ['tea', 'chai', 'milk tea', 'masala chai', 'masala tea', 'hot tea', 'chaye', 'kadak chai', 'indian tea', 'cup tea', 'cup of tea'], serving: '1 cup (150ml)', calories: 105, protein: 3.2, carbs: 14.0, fat: 4.2, category: 'Beverages' },
  { name: 'Masala Chai / Milk Tea (Sugar-free / Sugarless)', aliases: ['sugar free tea', 'sugarless tea', 'sugar free chai', 'tea without sugar', 'chai without sugar', 'sugarless chai'], serving: '1 cup (150ml)', calories: 55, protein: 3.2, carbs: 4.5, fat: 3.5, category: 'Beverages' },
  { name: 'Inji Tea / Ginger Milk Tea (with Sugar)', aliases: ['inji tea', 'ginger tea', 'ginger chai', 'inji chai', 'adrak chai', 'adrak tea'], serving: '1 cup (150ml)', calories: 100, protein: 3.0, carbs: 13.5, fat: 4.0, category: 'Beverages' },
  { name: 'Inji Tea / Ginger Tea (Sugar-Free)', aliases: ['sugar free ginger tea', 'sugarless inji tea', 'sugar free adrak chai', 'ginger tea without sugar'], serving: '1 cup (150ml)', calories: 52, protein: 3.0, carbs: 4.2, fat: 3.4, category: 'Beverages' },
  { name: 'Elaichi Tea / Cardamom Chai (with Sugar)', aliases: ['elaichi tea', 'elaichi chai', 'cardamom tea', 'cardamom chai'], serving: '1 cup (150ml)', calories: 105, protein: 3.2, carbs: 14.0, fat: 4.2, category: 'Beverages' },
  { name: 'Sulaimani Tea / Lemon Black Tea (with Sugar & Spices)', aliases: ['sulaimani tea', 'sulaimani', 'sulaimani chai', 'kerala sulaimani', 'spiced black tea'], serving: '1 cup (150ml)', calories: 45, protein: 0.2, carbs: 11.0, fat: 0.0, category: 'Beverages' },
  { name: 'Green Tea (Plain, Sugar-Free)', aliases: ['green tea', 'hot green tea', 'plain green tea', 'organic green tea'], serving: '1 cup (180ml)', calories: 2, protein: 0.2, carbs: 0.4, fat: 0.0, category: 'Beverages' },
  { name: 'Green Tea with Honey', aliases: ['green tea with honey', 'honey green tea'], serving: '1 cup (180ml)', calories: 28, protein: 0.2, carbs: 6.8, fat: 0.0, category: 'Beverages' },
  { name: 'Black Tea (Plain, Sugar-Free)', aliases: ['black tea', 'plain black tea', 'sugar free black tea'], serving: '1 cup (180ml)', calories: 3, protein: 0.2, carbs: 0.6, fat: 0.0, category: 'Beverages' },
  { name: 'Cutting Chai (Mumbai Kadak Chai)', aliases: ['cutting chai', 'cutting tea', 'tapri chai'], serving: '1 small glass (90ml)', calories: 75, protein: 2.2, carbs: 9.8, fat: 3.0, category: 'Beverages' },
  { name: 'Irani Chai (Hyderabadi Dum Tea with Condensed Milk)', aliases: ['irani chai', 'irani tea', 'dum tea', 'hyderabadi chai'], serving: '1 cup (150ml)', calories: 165, protein: 4.5, carbs: 21.0, fat: 7.2, category: 'Beverages' },
  { name: 'Lemon Tea (with Sugar / Honey)', aliases: ['lemon tea', 'hot lemon tea', 'lemon honey tea'], serving: '1 cup (150ml)', calories: 42, protein: 0.2, carbs: 10.5, fat: 0.0, category: 'Beverages' },

  // --- TRADITIONAL SOUTH INDIAN COOLERS ---
  { name: 'Masala Neer Mor (Spiced South Indian Buttermilk with Ginger & Curry Leaves)', aliases: ['neer mor', 'mor', 'spiced buttermilk', 'sambharam', 'majjiga', 'buttermilk', 'chaas'], serving: '1 large glass (300ml)', calories: 45, protein: 2.5, carbs: 4.0, fat: 1.2, category: 'Beverages' },
  { name: 'Tender Coconut Water (Elaneer / Karikku)', aliases: ['tender coconut', 'elaneer', 'karikku', 'coconut water'], serving: '1 whole nut water (250ml)', calories: 48, protein: 1.7, carbs: 9.0, fat: 0.5, category: 'Beverages' },
  { name: 'Panakam (Jaggery, Dry Ginger, Cardamom, Lemon Cooler)', aliases: ['panakam'], serving: '1 glass (200ml)', calories: 95, protein: 0.2, carbs: 24.0, fat: 0.0, category: 'Beverages' },
  { name: 'Nannari Sarbath (with Sabja / Basil Seeds & Lemon)', aliases: ['nannari', 'nannari sarbath', 'sarbath'], serving: '1 glass (250ml)', calories: 120, protein: 0.5, carbs: 30.0, fat: 0.0, category: 'Beverages' },

  // ==========================================
  // --- BISCUITS, RUSKS & BAKERY SNACKS ---
  // ==========================================
  { name: 'Marie Gold / Marie Biscuits (Britannia / Sunfeast)', aliases: ['marie gold', 'marie biscuit', 'marie biscuits', 'marie', 'tea biscuit', 'tea biscuits', 'biscuit', 'biscuits', 'bisket', 'biskets', 'bicket', 'bickets'], serving: '4 biscuits (21g)', calories: 90, protein: 1.8, carbs: 16.2, fat: 2.1, category: 'Snacks' },
  { name: 'Parle-G Glucose Biscuits', aliases: ['parle g', 'parleg', 'parle-g', 'glucose biscuit', 'glucose biscuits', 'parle g biscuits', 'parle g biscuit'], serving: '4 biscuits (20g)', calories: 92, protein: 1.4, carbs: 15.6, fat: 2.8, category: 'Snacks' },
  { name: 'Britannia Good Day (Butter / Cashew)', aliases: ['good day', 'good day biscuit', 'good day biscuits', 'butter biscuit', 'cashew biscuit', 'goodday', 'goodday biscuit'], serving: '2 biscuits (19g)', calories: 96, protein: 1.3, carbs: 12.8, fat: 4.6, category: 'Snacks' },
  { name: 'Britannia Bourbon Chocolate Cream Biscuits', aliases: ['bourbon', 'bourbon biscuit', 'bourbon biscuits', 'chocolate biscuit', 'chocolate biscuits', 'bourbon cream'], serving: '2 biscuits (25g)', calories: 120, protein: 1.3, carbs: 18.0, fat: 4.8, category: 'Snacks' },
  { name: 'Britannia Milk Bikis Biscuits', aliases: ['milk bikis', 'milkbikis', 'milk biscuit', 'milk biscuits', 'milk biki'], serving: '4 biscuits (22g)', calories: 100, protein: 1.8, carbs: 16.0, fat: 3.2, category: 'Snacks' },
  { name: 'Tea Rusk / Milk Rusk (Crispy Toast Rusk)', aliases: ['rusk', 'rusks', 'tea rusk', 'milk rusk', 'crispy rusk', 'toast rusk'], serving: '2 rusks (30g)', calories: 125, protein: 2.8, carbs: 22.5, fat: 2.8, category: 'Snacks' },
  { name: 'Cake Rusk (Bakery Double Baked Sponge)', aliases: ['cake rusk', 'sweet cake rusk'], serving: '2 pieces (35g)', calories: 165, protein: 2.5, carbs: 24.0, fat: 6.8, category: 'Snacks' },
  { name: 'Hide & Seek Chocolate Chip Biscuits (Parle)', aliases: ['hide and seek', 'hide & seek', 'hide and seek biscuit', 'hide and seek biscuits', 'choco chip cookies'], serving: '3 biscuits (25g)', calories: 120, protein: 1.4, carbs: 17.5, fat: 5.0, category: 'Snacks' },
  { name: 'Monaco Salted Crackers (Parle)', aliases: ['monaco', 'monaco biscuit', 'monaco biscuits', 'salted biscuit', 'salted crackers'], serving: '6 biscuits (24g)', calories: 115, protein: 2.0, carbs: 15.5, fat: 5.2, category: 'Snacks' },
  { name: 'Britannia 50-50 Sweet & Salty Biscuits', aliases: ['50 50', '50-50', '50 50 biscuit', 'sweet and salty biscuit', 'maska chaska'], serving: '4 biscuits (20g)', calories: 95, protein: 1.6, carbs: 14.5, fat: 3.6, category: 'Snacks' },
  { name: 'NutriChoice Digestive Biscuits (Britannia)', aliases: ['nutrichoice', 'digestive biscuit', 'digestive biscuits', 'wheat biscuit', 'nutri choice', 'nutrichoice biscuit'], serving: '2 biscuits (23g)', calories: 105, protein: 2.0, carbs: 15.0, fat: 4.2, category: 'Snacks' },
  { name: 'NutriChoice Oats / Almond Cookies', aliases: ['oats biscuit', 'oats cookies', 'nutrichoice oats'], serving: '2 biscuits (24g)', calories: 112, protein: 2.2, carbs: 15.2, fat: 4.8, category: 'Snacks' },
  { name: 'Bakery Butter Biscuit / Salt Biscuit (Nankhatai / Tea Stall Biscuits)', aliases: ['bakery biscuit', 'bakery biscuits', 'tea stall biscuit', 'nankhatai', 'benne biscuit'], serving: '2 pieces (25g)', calories: 135, protein: 1.5, carbs: 16.0, fat: 7.2, category: 'Snacks' },
  { name: 'Bakery Khari Biscuit / Puff Biscuit', aliases: ['khari', 'khari biscuit', 'puff biscuit', 'khari puff'], serving: '2 pieces (30g)', calories: 160, protein: 2.4, carbs: 17.0, fat: 9.5, category: 'Snacks' },
  { name: 'Osmania Biscuit (Hyderabadi Irani Chai Biscuit)', aliases: ['osmania biscuit', 'osmania biscuits', 'osmania'], serving: '2 biscuits (26g)', calories: 130, protein: 1.8, carbs: 16.5, fat: 6.5, category: 'Snacks' },
  { name: 'Oreo Cookies (Original Vanilla Cream)', aliases: ['oreo', 'oreo biscuit', 'oreo cookies'], serving: '3 cookies (33g)', calories: 160, protein: 1.5, carbs: 23.0, fat: 7.0, category: 'Snacks' },
  { name: 'Sunfeast Dark Fantasy Choco Fills', aliases: ['dark fantasy', 'choco fills', 'dark fantasy biscuit', 'dark fantasy cookies'], serving: '1 biscuit (15g)', calories: 75, protein: 0.8, carbs: 9.8, fat: 3.8, category: 'Snacks' },

  // ==========================================
  // --- FITNESS & GYM MACRO STAPLES ---
  // ==========================================
  { name: 'Whole Wheat Roti / Chapati / Phulka', aliases: ['roti', 'chapati', 'phulka', 'chappathi', 'chapathi'], serving: '1 medium (35g)', calories: 85, protein: 3.1, carbs: 17.5, fat: 0.5, category: 'Gym Staples' },
  { name: 'Grilled / Boiled Chicken Breast', aliases: ['chicken breast', 'grilled chicken', 'boiled chicken'], serving: '100g', calories: 165, protein: 31.0, carbs: 0.0, fat: 3.6, category: 'Gym Staples' },
  { name: 'Boiled Egg (Whole, Large)', aliases: ['boiled egg', 'egg', 'whole egg', 'muttai'], serving: '1 egg (50g)', calories: 72, protein: 6.3, carbs: 0.4, fat: 5.0, category: 'Gym Staples' },
  { name: 'Egg White (Boiled)', aliases: ['egg white', 'boiled egg white', 'muttai vellai'], serving: '1 egg white (33g)', calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1, category: 'Gym Staples' },
  { name: 'Raw Paneer / Malai Paneer', aliases: ['paneer', 'raw paneer'], serving: '100g', calories: 265, protein: 18.3, carbs: 3.4, fat: 20.8, category: 'Gym Staples' },
  { name: 'Low Fat / High Protein Paneer', aliases: ['low fat paneer', 'diet paneer'], serving: '100g', calories: 160, protein: 25.0, carbs: 4.0, fat: 4.5, category: 'Gym Staples' },
  { name: 'Soy Chunks / Meal Maker (Raw / Dry)', aliases: ['soy chunks', 'soya chunks', 'meal maker', 'soya'], serving: '50g dry', calories: 172, protein: 26.0, carbs: 16.5, fat: 0.5, category: 'Gym Staples' },
  { name: 'Whey Protein Isolate / Concentrate (1 Scoop)', aliases: ['whey protein', 'whey', 'protein scoop', 'protein powder'], serving: '1 scoop (30g)', calories: 120, protein: 25.0, carbs: 2.0, fat: 1.5, category: 'Gym Staples' },
  { name: 'Greek Yogurt (Plain Unsweetened 0% Fat)', aliases: ['greek yogurt', 'plain yogurt'], serving: '1 cup (170g)', calories: 100, protein: 17.0, carbs: 6.0, fat: 0.4, category: 'Gym Staples' },
  { name: 'Natural Peanut Butter (No Added Sugar)', aliases: ['peanut butter', 'natural peanut butter'], serving: '2 tbsp (32g)', calories: 190, protein: 8.0, carbs: 7.0, fat: 16.0, category: 'Gym Staples' },
  { name: 'Rolled Oats (Raw)', aliases: ['rolled oats', 'oats', 'oatmeal'], serving: '50g', calories: 190, protein: 6.8, carbs: 34.0, fat: 3.4, category: 'Gym Staples' },
  { name: 'Almonds (Raw Badam)', aliases: ['almonds', 'badam'], serving: '10 pieces (12g)', calories: 70, protein: 2.5, carbs: 2.5, fat: 6.0, category: 'Gym Staples' },
  { name: 'Banana (Cavendish / Yelakki / Poovan)', aliases: ['banana', 'yelakki banana', 'poovan banana', 'kela', 'vazhaipazham'], serving: '1 medium (118g)', calories: 105, protein: 1.3, carbs: 27.0, fat: 0.3, category: 'Fruits' }
];

// Helper to detect if a food is non-veg
export function isNonVegFood(food) {
  if (food.category === 'South Indian Non-Veg') return true;
  const lower = (food.name + ' ' + (food.aliases || []).join(' ')).toLowerCase();
  const nonVegTerms = ['chicken', 'egg', 'muttai', 'mutton', 'fish', 'meen', 'prawn', 'eral', 'kozhi', 'nethili', 'vanjaram', 'ayala', 'biryani'];
  return nonVegTerms.some(term => lower.includes(term));
}

// Fast Zero-Token Search with Relevance Scoring & Veg/Non-Veg Filtering
export function searchFoodDatabase(query, dietFilter = 'all') {
  if (!query || typeof query !== 'string') return [];
  const q = query.trim().toLowerCase();
  const scored = [];

  for (const food of foodDatabase) {
    const isNonVeg = isNonVegFood(food);
    if (dietFilter === 'veg' && isNonVeg) continue;
    if (dietFilter === 'non-veg' && !isNonVeg) continue;

    let score = 0;
    const nameLower = food.name.toLowerCase();

    if (nameLower === q) score += 100;
    else if (nameLower.startsWith(q)) score += 60;
    else if (nameLower.includes(q)) score += 40;

    for (const alias of food.aliases) {
      if (alias === q) score += 90;
      else if (alias.startsWith(q)) score += 50;
      else if (alias.includes(q)) score += 30;
    }

    if (food.category.toLowerCase().includes(q)) score += 20;

    if (score > 0) {
      scored.push({ ...food, isNonVeg, _score: score });
    }
  }

  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, 25);
}

// Smart zero-token natural language parser that supports multi-item sentences without numbers
export function localParseMealText(text) {
  if (!text || typeof text !== 'string') return [];

  // Clean and normalize text
  let cleaned = text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\bin the morining\b|\bin the morning\b|\bin morning\b/gi, ' ')
    .replace(/\bin the evening\b|\bin the afternoon\b|\bat night\b/gi, ' ')
    .replace(/\bfor breakfast\b|\bfor lunch\b|\bfor dinner\b|\bfor snack\b/gi, ' ')
    .replace(/\btoday\b|\byesterday\b|\bi had\b|\bi ate\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Word numbers to digits
  cleaned = cleaned
    .replace(/\bone\b/g, '1')
    .replace(/\btwo\b/g, '2')
    .replace(/\bthree\b/g, '3')
    .replace(/\bfour\b/g, '4')
    .replace(/\bfive\b/g, '5')
    .replace(/\bsix\b/g, '6')
    .replace(/\bhalf\b/g, '0.5')
    .replace(/\ba cup of\b/g, '1 cup ')
    .replace(/\ba plate of\b/g, '1 plate ')
    .replace(/\ba bowl of\b/g, '1 bowl ')
    .replace(/\ba glass of\b/g, '1 glass ')
    .replace(/\ba spoon of\b|\ba tbsp of\b/g, '1 tbsp ')
    .replace(/\bspoons\b|\bspoon\b/g, 'tbsp');

  // Phonetic South Indian word normalizations & plural forms
  cleaned = cleaned
    .replace(/\bbiscuits\b|\bbiscuit\b|\bbisket\b|\bbiskets\b|\bbickets\b|\bbicket\b|\bcookies\b|\bcookie\b/g, 'biscuit')
    .replace(/\bcoffe\b|\bkaapi\b|\bkaapee\b/g, 'coffee')
    .replace(/\bchay\b|\bchaai\b|\bchaye\b/g, 'chai')
    .replace(/\brusks\b|\brusk\b/g, 'rusk')
    .replace(/\bvadi\b|\bvadai\b|\bwada\b|\bwadai\b|\bvadas\b|\bvadais\b/g, 'vada')
    .replace(/\bidly\b|\bidlies\b|\bidlis\b/g, 'idli')
    .replace(/\bdosai\b|\bdhosa\b|\bdosas\b|\bdosais\b/g, 'dosa')
    .replace(/\bchappathi\b|\bchapathi\b|\bchappathis\b|\bchapathis\b|\bchapatis\b/g, 'chapati')
    .replace(/\brotis\b/g, 'roti')
    .replace(/\bparottas\b|\bparotas\b|\bporottas\b/g, 'parotta')
    .replace(/\bpooris\b|\bpuris\b/g, 'poori')
    .replace(/\beggs\b/g, 'egg')
    .replace(/\bbananas\b/g, 'banana')
    .replace(/\bapples\b/g, 'apple')
    .replace(/\bsambhar\b/g, 'sambar')
    .replace(/\bkarakolambu\b|\bkarakulambu\b|\bkarakuzhambu\b/g, 'kara kuzhambu')
    .replace(/\bkolambu\b|\bkulambu\b|\bkozhambu\b/g, 'kuzhambu');

  const results = [];
  const matchedSpans = [];

  // Sort all food-alias pairs by alias length descending (e.g. "sambar vada" before "vada")
  const allAliases = [];
  for (const food of foodDatabase) {
    for (const alias of food.aliases) {
      const normAlias = alias.toLowerCase()
        .replace(/\bbiscuits\b|\bbiscuit\b|\bbisket\b|\bbiskets\b|\bbickets\b|\bbicket\b/g, 'biscuit')
        .replace(/\bcoffe\b/g, 'coffee')
        .replace(/\bchay\b|\bchaai\b|\bchaye\b/g, 'chai')
        .replace(/\bvadi\b|\bvadai\b|\bwada\b|\bwadai\b/g, 'vada')
        .replace(/\bidly\b/g, 'idli')
        .replace(/\bdosai\b/g, 'dosa')
        .replace(/\bsambhar\b/g, 'sambar')
        .replace(/\bkolambu\b|\bkulambu\b|\bkozhambu\b/g, 'kuzhambu');
      allAliases.push({ food, alias: normAlias, length: normAlias.length });
    }
  }
  allAliases.sort((a, b) => b.length - a.length);

  for (const { food, alias } of allAliases) {
    // Check if alias exists in cleaned string
    const aliasIdx = cleaned.indexOf(alias);
    if (aliasIdx === -1) continue;

    // Check overlap with already matched tokens
    const aliasEnd = aliasIdx + alias.length;
    const overlaps = matchedSpans.some(span => 
      (aliasIdx >= span.start && aliasIdx < span.end) || 
      (aliasEnd > span.start && aliasEnd <= span.end)
    );
    if (overlaps) continue;

    // Look for quantity immediately preceding the alias
    const preText = cleaned.slice(0, aliasIdx).trim();
    const qtyMatch = preText.match(/(\d+(\.\d+)?)\s*(g|grams|gm|gms|cup|cups|plate|plates|piece|pieces|bowl|bowls|biscuit|biscuits|rusk|rusks|cookie|cookies|scoop|scoops|tbsp|glass|glasses)?(?:\s+of)?$/i);

    let qty = 1;
    let unit = '';
    let multiplier = 1;
    let displayQuantity = food.serving;

    if (qtyMatch) {
      qty = parseFloat(qtyMatch[1]) || 1;
      unit = (qtyMatch[3] || '').toLowerCase();
      const isGrams = /^(g|gm|gms|gram|grams)$/i.test(unit);

      if (isGrams) {
        const matchGrams = food.serving.match(/(\d+)\s*g/i);
        const baseGrams = matchGrams ? parseFloat(matchGrams[1]) : 100;
        multiplier = qty / baseGrams;
        displayQuantity = `${qty}g`;
      } else {
        // Check if serving has a base count e.g. "2 pieces" or "4 biscuits" or "2 tbsp"
        const baseCountMatch = food.serving.match(/^(\d+)\s*(piece|pieces|poori|pooris|egg|eggs|tbsp|nest|nests|biscuit|biscuits|rusk|rusks|cookie|cookies)/i);
        const baseCount = baseCountMatch ? parseFloat(baseCountMatch[1]) : 1;

        if (baseCount > 1 && (!unit || unit.includes('piece') || unit.includes('biscuit') || unit.includes('rusk') || unit.includes('cookie') || unit.includes('tbsp') || unit.includes('pc') || unit.includes('poori'))) {
          multiplier = qty / baseCount;
        } else {
          multiplier = qty;
        }

        if (unit) {
          displayQuantity = `${qty} ${unit}`;
        } else {
          const foodNameLower = food.name.toLowerCase();
          if (foodNameLower.includes('egg')) {
            displayQuantity = `${qty} ${qty > 1 ? 'eggs' : 'egg'}`;
          } else if (foodNameLower.includes('chapati') || foodNameLower.includes('roti')) {
            displayQuantity = `${qty} ${qty > 1 ? 'chapatis' : 'chapati'}`;
          } else if (foodNameLower.includes('dosa')) {
            displayQuantity = `${qty} ${qty > 1 ? 'dosas' : 'dosa'}`;
          } else if (foodNameLower.includes('idli')) {
            displayQuantity = `${qty} ${qty > 1 ? 'idlis' : 'idli'}`;
          } else if (foodNameLower.includes('vada')) {
            displayQuantity = `${qty} ${qty > 1 ? 'vadas' : 'vada'}`;
          } else if (foodNameLower.includes('biscuit') || foodNameLower.includes('parle') || foodNameLower.includes('marie') || foodNameLower.includes('cookie')) {
            displayQuantity = `${qty} ${qty > 1 ? 'biscuits' : 'biscuit'}`;
          } else if (foodNameLower.includes('rusk')) {
            displayQuantity = `${qty} ${qty > 1 ? 'rusks' : 'rusk'}`;
          } else if (foodNameLower.includes('tea') || foodNameLower.includes('chai') || foodNameLower.includes('coffee') || foodNameLower.includes('kaapi')) {
            displayQuantity = `${qty} ${qty > 1 ? 'cups' : 'cup'}`;
          } else if (food.serving.includes('piece') || food.category.includes('Tiffin')) {
            displayQuantity = `${qty} ${qty > 1 ? 'pieces' : 'piece'}`;
          } else if (food.serving.includes('bowl')) {
            displayQuantity = `${qty} ${qty > 1 ? 'bowls' : 'bowl'}`;
          } else if (food.serving.includes('plate')) {
            displayQuantity = `${qty} ${qty > 1 ? 'plates' : 'plate'}`;
          } else {
            displayQuantity = `${qty} ${qty > 1 ? 'servings' : 'serving'}`;
          }
        }
      }
    } else {
      // No explicit quantity entered by user (e.g. "curd rice with sambar vadi")
      // User had 1 standard portion of each item
      multiplier = 1;
      displayQuantity = food.serving;
    }

    matchedSpans.push({ start: aliasIdx, end: aliasEnd });

    results.push({
      _order: aliasIdx,
      name: food.name,
      quantity: displayQuantity,
      calories: Math.round(food.calories * multiplier),
      protein: Number((food.protein * multiplier).toFixed(1)),
      carbs: Number((food.carbs * multiplier).toFixed(1)),
      fat: Number((food.fat * multiplier).toFixed(1)),
      matchedBy: 'south_indian_local_engine'
    });
  }

  // Preserve natural sentence order (first mentioned food comes first)
  results.sort((a, b) => a._order - b._order);
  return results.map(({ _order, ...rest }) => rest);
}
