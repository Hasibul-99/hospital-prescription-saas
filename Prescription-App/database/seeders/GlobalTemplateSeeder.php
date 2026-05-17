<?php

namespace Database\Seeders;

use App\Models\DoctorTemplate;
use Illuminate\Database\Seeder;

class GlobalTemplateSeeder extends Seeder
{
    public function run(): void
    {
        // Wipe existing global templates to keep idempotent
        DoctorTemplate::withoutGlobalScopes()->where('is_global', true)->forceDelete();

        foreach ($this->templates() as $tpl) {
            DoctorTemplate::create(array_merge(['is_global' => true, 'doctor_id' => null, 'hospital_id' => null], $tpl));
        }
    }

    private function templates(): array
    {
        return [
            // ──────────────────────────────────────────────────────────────
            // 1. Viral Fever
            // ──────────────────────────────────────────────────────────────
            [
                'disease_name'   => 'Viral Fever',
                'complaints'     => [
                    ['complaint_name' => 'Fever',        'duration_text' => '3 days'],
                    ['complaint_name' => 'Headache',     'duration_text' => '3 days'],
                    ['complaint_name' => 'Body ache',    'duration_text' => '3 days'],
                    ['complaint_name' => 'Weakness',     'duration_text' => '3 days'],
                ],
                'examinations'   => [
                    ['examination_name' => 'Temperature',  'finding_value' => ''],
                    ['examination_name' => 'Blood pressure','finding_value' => ''],
                    ['examination_name' => 'Pulse',        'finding_value' => ''],
                ],
                'investigations' => [
                    ['content' => 'CBC with differential'],
                    ['content' => 'Blood sugar (random)'],
                    ['content' => 'Malaria test (RDT)'],
                ],
                'medicines'      => [
                    [
                        'medicine_id' => 4, 'medicine_name' => 'Ace', 'medicine_type' => 'Tablet',
                        'strength' => '500 mg', 'generic_name' => 'Paracetamol',
                        'dose_morning' => 1, 'dose_noon' => 1, 'dose_afternoon' => null, 'dose_night' => 1,
                        'timing' => 'after_meal', 'duration_value' => 5, 'duration_unit' => 'days',
                        'custom_instruction' => 'জ্বর ১০০°F বা তার বেশি হলে',
                    ],
                    [
                        'medicine_id' => 7, 'medicine_name' => 'Sergel', 'medicine_type' => 'Capsule',
                        'strength' => '20 mg', 'generic_name' => 'Omeprazole',
                        'dose_morning' => 1, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => null,
                        'timing' => 'before_meal', 'duration_value' => 5, 'duration_unit' => 'days',
                    ],
                    [
                        'medicine_id' => 25, 'medicine_name' => 'Rupa', 'medicine_type' => 'Tablet',
                        'strength' => '5 mg', 'generic_name' => 'Desloratadine',
                        'dose_morning' => null, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => 1,
                        'timing' => 'after_meal', 'duration_value' => 5, 'duration_unit' => 'days',
                    ],
                    [
                        'medicine_id' => 39, 'medicine_name' => 'Xinc B', 'medicine_type' => 'Syrup',
                        'strength' => null, 'generic_name' => 'Zinc + Vitamin B Complex',
                        'dose_morning' => 1, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => 1,
                        'timing' => 'after_meal', 'duration_value' => 10, 'duration_unit' => 'days',
                        'custom_instruction' => '10 ml করে',
                    ],
                ],
                'advices' => [
                    ['content' => 'Take rest (বিশ্রাম নিবেন)'],
                    ['content' => 'Drink plenty of water (প্রচুর পানি খাবেন)'],
                    ['content' => 'Tepid sponging if temperature ≥ 103°F'],
                    ['content' => 'Return immediately if temperature > 104°F or fits occur'],
                ],
            ],

            // ──────────────────────────────────────────────────────────────
            // 2. Upper Respiratory Tract Infection (URTI)
            // ──────────────────────────────────────────────────────────────
            [
                'disease_name'   => 'Upper Respiratory Tract Infection (URTI)',
                'complaints'     => [
                    ['complaint_name' => 'Cough',         'duration_text' => '4 days'],
                    ['complaint_name' => 'Sore throat',   'duration_text' => '4 days'],
                    ['complaint_name' => 'Runny nose',    'duration_text' => '4 days'],
                    ['complaint_name' => 'Low grade fever','duration_text' => '2 days'],
                ],
                'examinations'   => [
                    ['examination_name' => 'Temperature',  'finding_value' => ''],
                    ['examination_name' => 'Throat',       'finding_value' => ''],
                ],
                'investigations' => [
                    ['content' => 'CBC'],
                ],
                'medicines'      => [
                    [
                        'medicine_id' => 4, 'medicine_name' => 'Ace', 'medicine_type' => 'Tablet',
                        'strength' => '500 mg', 'generic_name' => 'Paracetamol',
                        'dose_morning' => 1, 'dose_noon' => 1, 'dose_afternoon' => null, 'dose_night' => 1,
                        'timing' => 'after_meal', 'duration_value' => 5, 'duration_unit' => 'days',
                    ],
                    [
                        'medicine_id' => 13, 'medicine_name' => 'Azithrocin', 'medicine_type' => 'Tablet',
                        'strength' => '500 mg', 'generic_name' => 'Azithromycin',
                        'dose_morning' => 1, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => null,
                        'timing' => 'after_meal', 'duration_value' => 3, 'duration_unit' => 'days',
                    ],
                    [
                        'medicine_id' => 26, 'medicine_name' => 'Rupa', 'medicine_type' => 'Tablet',
                        'strength' => '10 mg', 'generic_name' => 'Desloratadine',
                        'dose_morning' => null, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => 1,
                        'timing' => 'after_meal', 'duration_value' => 5, 'duration_unit' => 'days',
                    ],
                    [
                        'medicine_id' => 7, 'medicine_name' => 'Sergel', 'medicine_type' => 'Capsule',
                        'strength' => '20 mg', 'generic_name' => 'Omeprazole',
                        'dose_morning' => 1, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => null,
                        'timing' => 'before_meal', 'duration_value' => 5, 'duration_unit' => 'days',
                    ],
                ],
                'advices' => [
                    ['content' => 'Warm saline gargle 3–4 times daily (উষ্ণ লবণ পানি দিয়ে গার্গল করুন)'],
                    ['content' => 'Drink plenty of warm fluids (গরম তরল প্রচুর পরিমাণে পান করুন)'],
                    ['content' => 'Complete the antibiotic course (অ্যান্টিবায়োটিক পুরো কোর্স শেষ করুন)'],
                ],
            ],

            // ──────────────────────────────────────────────────────────────
            // 3. Community Acquired Pneumonia (CAP)
            // ──────────────────────────────────────────────────────────────
            [
                'disease_name'   => 'Community Acquired Pneumonia (CAP)',
                'complaints'     => [
                    ['complaint_name' => 'Fever',                  'duration_text' => '5 days'],
                    ['complaint_name' => 'Productive cough',       'duration_text' => '5 days'],
                    ['complaint_name' => 'Chest pain',             'duration_text' => '3 days'],
                    ['complaint_name' => 'Shortness of breath',    'duration_text' => '2 days'],
                ],
                'examinations'   => [
                    ['examination_name' => 'Temperature',       'finding_value' => ''],
                    ['examination_name' => 'Respiratory rate',  'finding_value' => ''],
                    ['examination_name' => 'SpO2',              'finding_value' => ''],
                    ['examination_name' => 'Chest auscultation','finding_value' => ''],
                ],
                'investigations' => [
                    ['content' => 'CBC with differential'],
                    ['content' => 'X-ray Chest PA view'],
                    ['content' => 'Sputum for C/S'],
                    ['content' => 'Blood culture'],
                    ['content' => 'CRP'],
                ],
                'medicines'      => [
                    [
                        'medicine_id' => 13, 'medicine_name' => 'Azithrocin', 'medicine_type' => 'Tablet',
                        'strength' => '500 mg', 'generic_name' => 'Azithromycin',
                        'dose_morning' => 1, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => null,
                        'timing' => 'after_meal', 'duration_value' => 5, 'duration_unit' => 'days',
                    ],
                    [
                        'medicine_id' => 18, 'medicine_name' => 'Cef-3', 'medicine_type' => 'Capsule',
                        'strength' => '400 mg', 'generic_name' => 'Cefixime',
                        'dose_morning' => 1, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => 1,
                        'timing' => 'after_meal', 'duration_value' => 7, 'duration_unit' => 'days',
                    ],
                    [
                        'medicine_id' => 3, 'medicine_name' => 'Napa Extra', 'medicine_type' => 'Tablet',
                        'strength' => '500 mg + 65 mg', 'generic_name' => 'Paracetamol + Caffeine',
                        'dose_morning' => 1, 'dose_noon' => 1, 'dose_afternoon' => null, 'dose_night' => 1,
                        'timing' => 'after_meal', 'duration_value' => 5, 'duration_unit' => 'days',
                    ],
                    [
                        'medicine_id' => 11, 'medicine_name' => 'Pantonix', 'medicine_type' => 'Tablet',
                        'strength' => '40 mg', 'generic_name' => 'Pantoprazole',
                        'dose_morning' => 1, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => null,
                        'timing' => 'before_meal', 'duration_value' => 7, 'duration_unit' => 'days',
                    ],
                ],
                'advices' => [
                    ['content' => 'Bed rest (শয্যাবিশ্রাম নিন)'],
                    ['content' => 'High fluid intake (বেশি পানি পান করুন)'],
                    ['content' => 'Complete antibiotic course (পুরো অ্যান্টিবায়োটিক কোর্স শেষ করুন)'],
                    ['content' => 'Return if SpO2 falls below 94% or breathing worsens'],
                ],
            ],

            // ──────────────────────────────────────────────────────────────
            // 4. Hypertension
            // ──────────────────────────────────────────────────────────────
            [
                'disease_name'   => 'Hypertension',
                'complaints'     => [
                    ['complaint_name' => 'Headache',   'duration_text' => ''],
                    ['complaint_name' => 'Dizziness',  'duration_text' => ''],
                    ['complaint_name' => 'Palpitation','duration_text' => ''],
                ],
                'examinations'   => [
                    ['examination_name' => 'Blood pressure', 'finding_value' => ''],
                    ['examination_name' => 'Pulse',          'finding_value' => ''],
                    ['examination_name' => 'Weight',         'finding_value' => ''],
                ],
                'investigations' => [
                    ['content' => 'ECG'],
                    ['content' => 'Urine R/E'],
                    ['content' => 'S. Creatinine'],
                    ['content' => 'Fasting blood sugar'],
                    ['content' => 'Lipid profile'],
                ],
                'medicines'      => [
                    [
                        'medicine_id' => 34, 'medicine_name' => 'Nexotal', 'medicine_type' => 'Tablet',
                        'strength' => '5 mg', 'generic_name' => 'Amlodipine',
                        'dose_morning' => 1, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => null,
                        'timing' => 'after_meal', 'duration_value' => 30, 'duration_unit' => 'days',
                        'custom_instruction' => 'সকালে একটি করে',
                    ],
                    [
                        'medicine_id' => 36, 'medicine_name' => 'Losartan', 'medicine_type' => 'Tablet',
                        'strength' => '50 mg', 'generic_name' => 'Losartan',
                        'dose_morning' => 1, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => null,
                        'timing' => 'after_meal', 'duration_value' => 30, 'duration_unit' => 'days',
                    ],
                    [
                        'medicine_id' => 24, 'medicine_name' => 'Ecosprin', 'medicine_type' => 'Tablet',
                        'strength' => '75 mg', 'generic_name' => 'Aspirin',
                        'dose_morning' => null, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => 1,
                        'timing' => 'after_meal', 'duration_value' => 30, 'duration_unit' => 'days',
                    ],
                ],
                'advices' => [
                    ['content' => 'Low salt diet — less than 5g/day (লবণ কম খাবেন)'],
                    ['content' => 'Regular moderate exercise 30 min/day (নিয়মিত হাঁটুন)'],
                    ['content' => 'Quit smoking and alcohol (ধূমপান ও মদ্যপান ত্যাগ করুন)'],
                    ['content' => 'Monitor blood pressure at home daily (প্রতিদিন রক্তচাপ পরিমাপ করুন)'],
                    ['content' => 'Do not stop medication without doctor advice'],
                ],
            ],

            // ──────────────────────────────────────────────────────────────
            // 5. Type 2 Diabetes Mellitus
            // ──────────────────────────────────────────────────────────────
            [
                'disease_name'   => 'Type 2 Diabetes Mellitus',
                'complaints'     => [
                    ['complaint_name' => 'Polyuria',    'duration_text' => ''],
                    ['complaint_name' => 'Polydipsia',  'duration_text' => ''],
                    ['complaint_name' => 'Weakness',    'duration_text' => ''],
                    ['complaint_name' => 'Weight loss', 'duration_text' => ''],
                ],
                'examinations'   => [
                    ['examination_name' => 'Blood pressure', 'finding_value' => ''],
                    ['examination_name' => 'Weight',         'finding_value' => ''],
                    ['examination_name' => 'BMI',            'finding_value' => ''],
                    ['examination_name' => 'Foot examination','finding_value' => ''],
                ],
                'investigations' => [
                    ['content' => 'Fasting blood sugar'],
                    ['content' => 'Post-prandial blood sugar'],
                    ['content' => 'HbA1c'],
                    ['content' => 'Lipid profile'],
                    ['content' => 'S. Creatinine'],
                    ['content' => 'Urine R/E (for microalbuminuria)'],
                    ['content' => 'ECG'],
                ],
                'medicines'      => [
                    [
                        'medicine_id' => 50, 'medicine_name' => 'Metformin', 'medicine_type' => 'Tablet',
                        'strength' => '500 mg', 'generic_name' => 'Metformin',
                        'dose_morning' => 1, 'dose_noon' => 1, 'dose_afternoon' => null, 'dose_night' => 1,
                        'timing' => 'after_meal', 'duration_value' => 30, 'duration_unit' => 'days',
                    ],
                    [
                        'medicine_id' => 52, 'medicine_name' => 'Glipita', 'medicine_type' => 'Tablet',
                        'strength' => '50 mg', 'generic_name' => 'Sitagliptin',
                        'dose_morning' => 1, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => null,
                        'timing' => 'before_meal', 'duration_value' => 30, 'duration_unit' => 'days',
                    ],
                ],
                'advices' => [
                    ['content' => 'Diabetic diet — avoid sugar and refined carbs (চিনি ও মিষ্টি খাবার বন্ধ)'],
                    ['content' => 'Daily fasting and post-meal blood sugar monitoring'],
                    ['content' => 'Walk 30–45 minutes daily (প্রতিদিন ৩০-৪৫ মিনিট হাঁটুন)'],
                    ['content' => 'Foot care daily — inspect for sores (প্রতিদিন পা পরীক্ষা করুন)'],
                    ['content' => 'Do not skip meals (খাবার বাদ দেবেন না)'],
                ],
            ],

            // ──────────────────────────────────────────────────────────────
            // 6. GERD / Acid Peptic Disease
            // ──────────────────────────────────────────────────────────────
            [
                'disease_name'   => 'Gastroesophageal Reflux Disease (GERD)',
                'complaints'     => [
                    ['complaint_name' => 'Heartburn',       'duration_text' => ''],
                    ['complaint_name' => 'Epigastric pain', 'duration_text' => ''],
                    ['complaint_name' => 'Nausea',          'duration_text' => ''],
                    ['complaint_name' => 'Bloating',        'duration_text' => ''],
                ],
                'examinations'   => [
                    ['examination_name' => 'Epigastric tenderness', 'finding_value' => ''],
                ],
                'investigations' => [
                    ['content' => 'H. pylori test (stool antigen)'],
                    ['content' => 'Upper GI endoscopy (if symptoms persist > 4 weeks)'],
                ],
                'medicines'      => [
                    [
                        'medicine_id' => 11, 'medicine_name' => 'Pantonix', 'medicine_type' => 'Tablet',
                        'strength' => '40 mg', 'generic_name' => 'Pantoprazole',
                        'dose_morning' => 1, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => 1,
                        'timing' => 'before_meal', 'duration_value' => 4, 'duration_unit' => 'months',
                        'custom_instruction' => 'খাবার ৩০ মিনিট আগে',
                    ],
                    [
                        'medicine_id' => 12, 'medicine_name' => 'Dextac', 'medicine_type' => 'Capsule',
                        'strength' => '30 mg', 'generic_name' => 'Lansoprazole',
                        'dose_morning' => 1, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => null,
                        'timing' => 'before_meal', 'duration_value' => 4, 'duration_unit' => 'months',
                    ],
                ],
                'advices' => [
                    ['content' => 'Small frequent meals (অল্প করে বারবার খান)'],
                    ['content' => 'Avoid spicy, fatty and acidic foods (ঝাল, তেলযুক্ত খাবার বাদ দিন)'],
                    ['content' => 'Elevate head of bed 6–8 inches'],
                    ['content' => 'Avoid eating within 2 hours of bedtime (ঘুমানোর ২ ঘণ্টা আগে খাবেন না)'],
                    ['content' => 'Avoid coffee, alcohol, and smoking'],
                ],
            ],

            // ──────────────────────────────────────────────────────────────
            // 7. Allergic Rhinitis
            // ──────────────────────────────────────────────────────────────
            [
                'disease_name'   => 'Allergic Rhinitis',
                'complaints'     => [
                    ['complaint_name' => 'Sneezing',           'duration_text' => ''],
                    ['complaint_name' => 'Nasal discharge',    'duration_text' => ''],
                    ['complaint_name' => 'Nasal congestion',   'duration_text' => ''],
                    ['complaint_name' => 'Itchy eyes',         'duration_text' => ''],
                ],
                'examinations'   => [
                    ['examination_name' => 'Nasal mucosa', 'finding_value' => ''],
                ],
                'investigations' => [
                    ['content' => 'CBC with eosinophil count'],
                    ['content' => 'Total IgE'],
                ],
                'medicines'      => [
                    [
                        'medicine_id' => 28, 'medicine_name' => 'Fexo', 'medicine_type' => 'Tablet',
                        'strength' => '180 mg', 'generic_name' => 'Fexofenadine',
                        'dose_morning' => 1, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => null,
                        'timing' => 'after_meal', 'duration_value' => 14, 'duration_unit' => 'days',
                    ],
                    [
                        'medicine_id' => 56, 'medicine_name' => 'Monas', 'medicine_type' => 'Tablet',
                        'strength' => '10 mg', 'generic_name' => 'Montelukast',
                        'dose_morning' => null, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => 1,
                        'timing' => 'after_meal', 'duration_value' => 14, 'duration_unit' => 'days',
                    ],
                ],
                'advices' => [
                    ['content' => 'Identify and avoid triggers (অ্যালার্জি সৃষ্টিকারী বিষয় এড়িয়ে চলুন)'],
                    ['content' => 'Use N95 mask outdoors during high pollen season'],
                    ['content' => 'Keep windows closed during pollen season'],
                    ['content' => 'Nasal saline rinse twice daily (নাকে স্যালাইন দিন)'],
                ],
            ],

            // ──────────────────────────────────────────────────────────────
            // 8. Urinary Tract Infection (UTI)
            // ──────────────────────────────────────────────────────────────
            [
                'disease_name'   => 'Urinary Tract Infection (UTI)',
                'complaints'     => [
                    ['complaint_name' => 'Dysuria',                   'duration_text' => ''],
                    ['complaint_name' => 'Increased urinary frequency','duration_text' => ''],
                    ['complaint_name' => 'Lower abdominal pain',      'duration_text' => ''],
                ],
                'examinations'   => [
                    ['examination_name' => 'Suprapubic tenderness', 'finding_value' => ''],
                    ['examination_name' => 'Temperature',           'finding_value' => ''],
                ],
                'investigations' => [
                    ['content' => 'Urine R/E with microscopy'],
                    ['content' => 'Urine C/S'],
                    ['content' => 'CBC'],
                    ['content' => 'S. Creatinine'],
                ],
                'medicines'      => [
                    [
                        'medicine_id' => 16, 'medicine_name' => 'Ciprox', 'medicine_type' => 'Tablet',
                        'strength' => '500 mg', 'generic_name' => 'Ciprofloxacin',
                        'dose_morning' => 1, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => 1,
                        'timing' => 'after_meal', 'duration_value' => 7, 'duration_unit' => 'days',
                    ],
                    [
                        'medicine_id' => 10, 'medicine_name' => 'Pantonix', 'medicine_type' => 'Tablet',
                        'strength' => '20 mg', 'generic_name' => 'Pantoprazole',
                        'dose_morning' => 1, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => null,
                        'timing' => 'before_meal', 'duration_value' => 7, 'duration_unit' => 'days',
                    ],
                ],
                'advices' => [
                    ['content' => 'Drink at least 2–3 litres of water daily (প্রতিদিন ২-৩ লিটার পানি পান করুন)'],
                    ['content' => 'Complete the full antibiotic course'],
                    ['content' => 'Void after intercourse'],
                    ['content' => 'Avoid holding urine for long periods'],
                ],
            ],

            // ──────────────────────────────────────────────────────────────
            // 9. Bronchial Asthma
            // ──────────────────────────────────────────────────────────────
            [
                'disease_name'   => 'Bronchial Asthma',
                'complaints'     => [
                    ['complaint_name' => 'Wheezing',            'duration_text' => ''],
                    ['complaint_name' => 'Shortness of breath', 'duration_text' => ''],
                    ['complaint_name' => 'Chest tightness',     'duration_text' => ''],
                    ['complaint_name' => 'Cough (nocturnal)',    'duration_text' => ''],
                ],
                'examinations'   => [
                    ['examination_name' => 'SpO2',              'finding_value' => ''],
                    ['examination_name' => 'Respiratory rate',  'finding_value' => ''],
                    ['examination_name' => 'Chest auscultation','finding_value' => 'Bilateral wheeze'],
                ],
                'investigations' => [
                    ['content' => 'Spirometry (FEV1/FVC)'],
                    ['content' => 'Peak expiratory flow rate'],
                    ['content' => 'CBC with eosinophil count'],
                    ['content' => 'Total IgE'],
                    ['content' => 'Chest X-ray'],
                ],
                'medicines'      => [
                    [
                        'medicine_id' => 57, 'medicine_name' => 'Salbu', 'medicine_type' => 'Inhaler',
                        'strength' => '100 mcg', 'generic_name' => 'Salbutamol',
                        'dose_morning' => null, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => null,
                        'timing' => 'as_needed', 'duration_value' => null, 'duration_unit' => null,
                        'custom_instruction' => '2 puff প্রয়োজনে, দিনে সর্বোচ্চ 4 বার',
                    ],
                    [
                        'medicine_id' => 43, 'medicine_name' => 'Beklo', 'medicine_type' => 'Inhaler',
                        'strength' => '200 mcg', 'generic_name' => 'Beclometasone',
                        'dose_morning' => null, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => null,
                        'timing' => null, 'duration_value' => 30, 'duration_unit' => 'days',
                        'custom_instruction' => '2 puff সকালে ও রাতে, মুখ কুলি করুন',
                    ],
                    [
                        'medicine_id' => 56, 'medicine_name' => 'Monas', 'medicine_type' => 'Tablet',
                        'strength' => '10 mg', 'generic_name' => 'Montelukast',
                        'dose_morning' => null, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => 1,
                        'timing' => 'after_meal', 'duration_value' => 30, 'duration_unit' => 'days',
                    ],
                ],
                'advices' => [
                    ['content' => 'Always carry reliever inhaler (সবসময় ইনহেলার সাথে রাখুন)'],
                    ['content' => 'Avoid known triggers — dust, smoke, cold air'],
                    ['content' => 'Correct inhaler technique is essential'],
                    ['content' => 'Rinse mouth after steroid inhaler use'],
                    ['content' => 'Seek emergency care if reliever does not help within 15 min'],
                ],
            ],

            // ──────────────────────────────────────────────────────────────
            // 10. Anxiety / Insomnia
            // ──────────────────────────────────────────────────────────────
            [
                'disease_name'   => 'Anxiety and Insomnia',
                'complaints'     => [
                    ['complaint_name' => 'Anxiety / restlessness', 'duration_text' => ''],
                    ['complaint_name' => 'Insomnia',               'duration_text' => ''],
                    ['complaint_name' => 'Palpitation',            'duration_text' => ''],
                    ['complaint_name' => 'Headache',               'duration_text' => ''],
                ],
                'examinations'   => [
                    ['examination_name' => 'Blood pressure', 'finding_value' => ''],
                    ['examination_name' => 'Pulse',          'finding_value' => ''],
                ],
                'investigations' => [
                    ['content' => 'CBC'],
                    ['content' => 'Thyroid function test (TSH)'],
                    ['content' => 'Blood sugar (fasting)'],
                    ['content' => 'ECG'],
                ],
                'medicines'      => [
                    [
                        'medicine_id' => 31, 'medicine_name' => 'Rivotril', 'medicine_type' => 'Tablet',
                        'strength' => '0.5 mg', 'generic_name' => 'Clonazepam',
                        'dose_morning' => null, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => 1,
                        'timing' => 'bedtime', 'duration_value' => 14, 'duration_unit' => 'days',
                        'custom_instruction' => 'রাতে ঘুমানোর আগে, দীর্ঘমেয়াদি ব্যবহার করবেন না',
                    ],
                    [
                        'medicine_id' => 7, 'medicine_name' => 'Sergel', 'medicine_type' => 'Capsule',
                        'strength' => '20 mg', 'generic_name' => 'Omeprazole',
                        'dose_morning' => 1, 'dose_noon' => null, 'dose_afternoon' => null, 'dose_night' => null,
                        'timing' => 'before_meal', 'duration_value' => 14, 'duration_unit' => 'days',
                    ],
                ],
                'advices' => [
                    ['content' => 'Sleep hygiene — fixed sleep/wake time (নির্দিষ্ট সময়ে ঘুমান ও উঠুন)'],
                    ['content' => 'Avoid caffeine after 4 PM (বিকালের পরে চা-কফি বন্ধ)'],
                    ['content' => 'Relaxation techniques — deep breathing, meditation'],
                    ['content' => 'Avoid phone/screen 1 hour before bed'],
                    ['content' => 'Short course only — do not take benzodiazepines beyond 2 weeks'],
                ],
            ],
        ];
    }
}
