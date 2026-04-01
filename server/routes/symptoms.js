const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Symptom rules engine
const symptomRules = {
  fever: {
    advice: 'Stay hydrated, rest well, and take paracetamol if temperature is above 38°C. Consult a doctor if fever persists beyond 3 days.',
    severity: 'moderate',
    warnings: ['If fever exceeds 39.5°C, seek emergency care immediately', 'Watch for rash, neck stiffness, or difficulty breathing'],
    tips: ['Drink 8-10 glasses of water', 'Rest in a cool room', 'Use a damp cloth on forehead']
  },
  headache: {
    advice: 'Rest in a quiet, dark room. Stay hydrated and consider OTC pain relief. Avoid screen time.',
    severity: 'mild',
    warnings: ['Seek immediate care for sudden severe "thunderclap" headache', 'Headache with fever and stiff neck may signal meningitis'],
    tips: ['Stay away from bright lights', 'Apply cold/warm compress', 'Practice deep breathing']
  },
  cough: {
    advice: 'Stay hydrated, use honey and warm water. Avoid cold drinks and dusty environments.',
    severity: 'mild',
    warnings: ['Coughing blood requires immediate medical attention', 'Persistent cough >3 weeks needs medical evaluation'],
    tips: ['Steam inhalation helps', 'Try ginger-tulsi tea', 'Sleep with head elevated']
  },
  'chest pain': {
    advice: 'Chest pain can be serious. Avoid strenuous activity and seek medical evaluation immediately.',
    severity: 'severe',
    warnings: ['Call emergency services (112) if pain is crushing or radiates to arm/jaw', 'Do NOT drive yourself to hospital'],
    tips: ['Sit upright, stay calm', 'Loosen tight clothing', 'Take aspirin if recommended by doctor']
  },
  vomiting: {
    advice: 'Sip clear fluids slowly. Avoid solid foods until vomiting stops. ORS solution helps prevent dehydration.',
    severity: 'moderate',
    warnings: ['Vomiting blood is a medical emergency', 'If vomiting proceeds dehydration in children, seek care immediately'],
    tips: ['Try small sips of coconut water', 'Eat bland foods like rice/toast once feeling better', 'Avoid dairy and spicy foods']
  },
  diarrhea: {
    advice: 'Drink ORS solution frequently. Eat simple foods. Avoid dairy, spicy and oily foods.',
    severity: 'moderate',
    warnings: ['Bloody diarrhea needs immediate care', 'Signs of dehydration (dry mouth, no urination) need medical attention'],
    tips: ['Drink ORS every 15 minutes', 'Eat banana, rice, apple, toast (BRAT diet)', 'Wash hands thoroughly']
  },
  fatigue: {
    advice: 'Ensure 7-8 hours of sleep. Check iron levels and vitamin D. Gentle exercise and a balanced diet help.',
    severity: 'mild',
    warnings: ['Extreme fatigue with chest pain or shortness of breath needs urgent evaluation'],
    tips: ['Maintain regular sleep schedule', 'Eat iron-rich foods', 'Stay hydrated throughout the day']
  },
  'shortness of breath': {
    advice: 'Sit upright, breathe slowly and deeply. Avoid exertion. This may signal a serious condition.',
    severity: 'severe',
    warnings: ['Sudden severe breathlessness is a medical emergency — call 112', 'Breathlessness with chest pain or blue lips needs emergency care'],
    tips: ['Pursed-lip breathing technique helps', 'Use a fan to circulate air', 'Stay calm — anxiety can worsen it']
  },
  'sore throat': {
    advice: 'Gargle with warm salt water. Drink warm fluids. Throat lozenges can soothe discomfort.',
    severity: 'mild',
    warnings: ['Severe pain making swallowing impossible needs medical review', 'White patches on throat may indicate bacterial infection'],
    tips: ['Honey and lemon in warm water soothes', 'Avoid cold drinks', 'Steam inhalation helps']
  },
  'back pain': {
    advice: 'Rest briefly, apply ice then heat. Gentle stretching helps. Maintain good posture.',
    severity: 'mild',
    warnings: ['Back pain with leg numbness or loss of bladder control is an emergency', 'Sharp pain after injury needs X-ray evaluation'],
    tips: ['Sleep on firm mattress', 'Avoid prolonged sitting', 'Gentle yoga stretches help']
  },
  rash: {
    advice: 'Avoid scratching. Use calamine lotion. Consult a doctor if rash spreads or is accompanied by fever.',
    severity: 'moderate',
    warnings: ['Rash with fever in children needs urgent evaluation', 'Rapidly spreading rash needs immediate medical attention'],
    tips: ['Cool water compress reduces itching', 'Wear loose cotton clothing', 'Avoid harsh soaps']
  },
  'joint pain': {
    advice: 'Rest the affected joint, apply ice to reduce swelling. OTC anti-inflammatories can help.',
    severity: 'mild',
    warnings: ['Sudden severe joint pain with swelling and redness may indicate gout or infection'],
    tips: ['Elevate the joint when resting', 'Maintain healthy weight', 'Gentle range-of-motion exercises']
  }
};

router.use(authMiddleware);

router.post('/check', (req, res) => {
  const { symptoms } = req.body;
  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    return res.status(400).json({ error: 'Please provide at least one symptom' });
  }

  const results = [];
  let highestSeverity = 'mild';
  const severityOrder = { mild: 0, moderate: 1, severe: 2 };

  const normalizedSymptoms = symptoms.map(s => s.toLowerCase().trim());

  for (const symptom of normalizedSymptoms) {
    const rule = symptomRules[symptom];
    if (rule) {
      results.push({ symptom, ...rule });
      if (severityOrder[rule.severity] > severityOrder[highestSeverity]) {
        highestSeverity = rule.severity;
      }
    } else {
      // Partial match
      const key = Object.keys(symptomRules).find(k => k.includes(symptom) || symptom.includes(k));
      if (key) {
        results.push({ symptom, ...symptomRules[key] });
      } else {
        results.push({
          symptom,
          advice: 'This symptom is not in our database. Please consult a healthcare professional for proper evaluation.',
          severity: 'unknown',
          warnings: ['Always consult a licensed doctor for medical advice'],
          tips: ['Keep a symptom diary to share with your doctor', 'Note when symptoms started and what makes them better or worse']
        });
      }
    }
  }

  const generalAdvice = highestSeverity === 'severe'
    ? '⚠️ Based on your symptoms, please seek medical attention immediately.'
    : highestSeverity === 'moderate'
    ? 'Your symptoms suggest you should consult a doctor within 24-48 hours if they persist.'
    : 'Your symptoms appear mild. Monitor them and rest well. Consult a doctor if they worsen.';

  res.json({ results, overallSeverity: highestSeverity, generalAdvice });
});

module.exports = router;
