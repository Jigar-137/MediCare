// ── i18n Translation System ──
const translations = {
  en: {
    login: 'Login', register: 'Register', welcome_back: 'Welcome Back 👋',
    create_account: 'Create an account', create_account_title: 'Create Account 🌟',
    sign_in_link: 'Sign in', sign_in: 'Sign In', get_started: 'Get Started',
    email: 'Email Address', password: 'Password', confirm_password: 'Confirm Password',
    full_name: 'Full Name',
    nav_home: 'Dashboard', nav_medicines: 'Medicines', nav_symptoms: 'Symptom Check',
    nav_appointments: 'Appointments', nav_fitness: 'Fitness', nav_profile: 'Profile',
    logout: 'Logout',
    stat_medicines: 'Medicines', stat_appointments: 'Appointments',
    stat_steps: 'Steps Today', stat_water: 'Glasses of Water',
    quick_tips: "Today's Health Tips",
    medicines_title: '💊 Medicine Reminders', medicines_sub: 'Add your medicines and get voice reminders.',
    add_medicine: 'Add New Medicine', medicine_name: 'Medicine Name', dosage: 'Dosage',
    time: 'Time', frequency: 'Frequency', notes: 'Notes (Optional)', add_medicine_btn: 'Add Medicine',
    symptoms_title: '🩺 Symptom Checker', symptoms_sub: 'Select symptoms and get health guidance.',
    select_symptoms: 'Select Symptoms', custom_symptom: 'Or type a symptom',
    check_symptoms: 'Check Symptoms', clear: 'Clear All', add: 'Add',
    appointments_title: '📅 Appointments', appointments_sub: 'Book and manage your appointments.',
    book_appointment: 'Book Appointment', doctor_name: 'Doctor Name', specialization: 'Specialization',
    date: 'Date', location: 'Location / Hospital', book_btn: 'Book Appointment',
    fitness_title: '🏃 Fitness & Health', fitness_sub: 'Track your daily activity.',
    steps_today: 'Daily Steps', goal_10k: 'Goal: 10,000 steps',
    water_intake: 'Water Intake', goal_8: 'Goal: 8 glasses/day', glasses: '/ 8 glasses',
    add_glass: '+ Glass', reset: 'Reset', update: 'Update',
    health_tips: 'Daily Health Tips',
    profile_title: '👤 My Profile', profile_sub: 'Manage your personal and health information.',
    edit_profile: '✏️ Edit Profile', save_profile: '💾 Save Profile',
    listening: 'Listening…',
  },
  hi: {
    login: 'लॉगिन', register: 'रजिस्टर', welcome_back: 'वापस स्वागत है 👋',
    create_account: 'खाता बनाएं', create_account_title: 'खाता बनाएं 🌟',
    sign_in_link: 'साइन इन करें', sign_in: 'साइन इन', get_started: 'शुरू करें',
    email: 'ईमेल पता', password: 'पासवर्ड', confirm_password: 'पासवर्ड की पुष्टि करें',
    full_name: 'पूरा नाम',
    nav_home: 'डैशबोर्ड', nav_medicines: 'दवाइयां', nav_symptoms: 'लक्षण जांच',
    nav_appointments: 'अपॉइंटमेंट', nav_fitness: 'फिटनेस', nav_profile: 'प्रोफ़ाइल',
    logout: 'लॉगआउट',
    stat_medicines: 'दवाइयां', stat_appointments: 'अपॉइंटमेंट',
    stat_steps: 'आज के कदम', stat_water: 'पानी के गिलास',
    quick_tips: 'आज के स्वास्थ्य सुझाव',
    medicines_title: '💊 दवा रिमाइंडर', medicines_sub: 'दवाइयां जोड़ें और समय पर याद दिलाएं।',
    add_medicine: 'नई दवा जोड़ें', medicine_name: 'दवा का नाम', dosage: 'खुराक',
    time: 'समय', frequency: 'आवृत्ति', notes: 'नोट्स (वैकल्पिक)', add_medicine_btn: 'दवा जोड़ें',
    symptoms_title: '🩺 लक्षण जांचक', symptoms_sub: 'लक्षण चुनें और स्वास्थ्य मार्गदर्शन पाएं।',
    select_symptoms: 'लक्षण चुनें', custom_symptom: 'या लक्षण टाइप करें',
    check_symptoms: 'लक्षण जांचें', clear: 'सब साफ करें', add: 'जोड़ें',
    appointments_title: '📅 अपॉइंटमेंट', appointments_sub: 'डॉक्टर अपॉइंटमेंट बुक करें।',
    book_appointment: 'अपॉइंटमेंट बुक करें', doctor_name: 'डॉक्टर का नाम',
    specialization: 'विशेषज्ञता', date: 'तारीख', location: 'स्थान / अस्पताल',
    book_btn: 'अपॉइंटमेंट बुक करें',
    fitness_title: '🏃 फिटनेस और स्वास्थ्य', fitness_sub: 'अपनी दैनिक गतिविधि ट्रैक करें।',
    steps_today: 'आज के कदम', goal_10k: 'लक्ष्य: 10,000 कदम',
    water_intake: 'पानी का सेवन', goal_8: 'लक्ष्य: 8 गिलास/दिन', glasses: '/ 8 गिलास',
    add_glass: '+ गिलास', reset: 'रीसेट', update: 'अपडेट',
    health_tips: 'दैनिक स्वास्थ्य सुझाव',
    profile_title: '👤 मेरी प्रोफ़ाइल', profile_sub: 'व्यक्तिगत और स्वास्थ्य जानकारी प्रबंधित करें।',
    edit_profile: '✏️ प्रोफ़ाइल संपादित करें', save_profile: '💾 प्रोफ़ाइल सहेजें',
    listening: 'सुन रहा हूँ…',
  },
  gu: {
    login: 'લૉગિન', register: 'નોંધણી', welcome_back: 'પાછા આવ્યા 👋',
    create_account: 'ખાતું બનાવો', create_account_title: 'ખાતું બનાવો 🌟',
    sign_in_link: 'સાઇન ઇન', sign_in: 'સાઇન ઇન', get_started: 'શરૂ કરો',
    email: 'ઈમેઈલ સરનામું', password: 'પાસવર્ડ', confirm_password: 'પાસવર્ડ ફરી નાંખો',
    full_name: 'પૂરું નામ',
    nav_home: 'ડૅશબૉર્ડ', nav_medicines: 'દવાઓ', nav_symptoms: 'લક્ષણ તપાસ',
    nav_appointments: 'મુલાકાત', nav_fitness: 'ફિટનેસ', nav_profile: 'પ્રોફાઇલ',
    logout: 'લૉગઆઉટ',
    stat_medicines: 'દવાઓ', stat_appointments: 'મુલાકાત',
    stat_steps: 'આજના પગ', stat_water: 'પાણીના ગ્લાસ',
    quick_tips: 'આજના આરોગ્ય સૂચનો',
    medicines_title: '💊 દવા રીમાઇન્ડર', medicines_sub: 'દવા ઉમેરો અને સમયસર યાદ અપાવો.',
    add_medicine: 'નવી દવા ઉમેરો', medicine_name: 'દવાનું નામ', dosage: 'માત્રા',
    time: 'સમય', frequency: 'આવૃત્તિ', notes: 'નોંધ (વૈકલ્પિક)', add_medicine_btn: 'દવા ઉમેરો',
    symptoms_title: '🩺 લક્ષણ તપાસ', symptoms_sub: 'લક્ષણ પસંદ કરો અને સ્વાસ્થ્ય માર્ગદર્શન મેળવો.',
    select_symptoms: 'લક્ષણ પસંદ કરો', custom_symptom: 'અથવા લક્ષણ ટાઇપ કરો',
    check_symptoms: 'લક્ષણ તપાસો', clear: 'બધું સાફ', add: 'ઉમેરો',
    appointments_title: '📅 મુલાકાત', appointments_sub: 'ડૉક્ટર મુલાકાત બુક કરો.',
    book_appointment: 'મુલાકાત બુક કરો', doctor_name: 'ડૉક્ટરનું નામ',
    specialization: 'વિશેષજ્ઞતા', date: 'તારીખ', location: 'સ્થળ / હૉસ્પિટલ',
    book_btn: 'મુલાકાત બુક કરો',
    fitness_title: '🏃 ફિટનેસ અને સ્વાસ્થ્ય', fitness_sub: 'દૈનિક પ્રવૃત્તિ ટ્રૅક કરો.',
    steps_today: 'આજના પગ', goal_10k: 'લક્ષ્ય: 10,000 પગ',
    water_intake: 'પાણી પીણ', goal_8: 'લક્ષ્ય: 8 ગ્લાસ/દિવસ', glasses: '/ 8 ગ્લાસ',
    add_glass: '+ ગ્લાસ', reset: 'રીસેટ', update: 'અપડેટ',
    health_tips: 'દૈનિક આરોગ્ય સૂચનો',
    profile_title: '👤 મારી પ્રોફાઇલ', profile_sub: 'વ્યક્તિગત અને આરોગ્ય માહિતી સંચાલિત કરો.',
    edit_profile: '✏️ પ્રોફાઇલ સંપાદન', save_profile: '💾 સાચવો',
    listening: 'સાંભળી રહ્યો છું…',
  }
};

let currentLang = localStorage.getItem('medicare_lang') || 'en';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('medicare_lang', lang);
  document.documentElement.lang = lang;
  const map = translations[lang] || translations.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (map[key]) el.textContent = map[key];
  });
  const sel = document.getElementById('lang-select');
  if (sel) sel.value = lang;
}

function t(key) {
  return (translations[currentLang] || translations.en)[key] || key;
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => setLanguage(currentLang));
