<?php

namespace Database\Seeders;

use App\Models\ComplaintDurationPreset;
use App\Models\ComplaintMaster;
use Illuminate\Database\Seeder;

class ComplaintMasterSeeder extends Seeder
{
    public function run(): void
    {
        $complaints = [
            ['name_en' => 'Fever', 'name_bn' => 'জ্বর', 'category' => 'General'],
            ['name_en' => 'Weakness', 'name_bn' => 'দুর্বলতা', 'category' => 'General'],
            ['name_en' => 'Cough', 'name_bn' => 'কাশি', 'category' => 'Respiratory'],
            ['name_en' => 'Memory loss', 'name_bn' => 'স্মৃতিশক্তি হ্রাস', 'category' => 'Neurological'],
            ['name_en' => 'Vomiting', 'name_bn' => 'বমি', 'category' => 'GI'],
            ['name_en' => 'Chest pain', 'name_bn' => 'বুকে ব্যথা', 'category' => 'Cardiovascular'],
            ['name_en' => 'Itching', 'name_bn' => 'চুলকানি', 'category' => 'Dermatology'],
            ['name_en' => 'Swelling of legs', 'name_bn' => 'পা ফোলা', 'category' => 'General'],
            ['name_en' => 'Sleep disturbances', 'name_bn' => 'ঘুমের সমস্যা', 'category' => 'Neurological'],
            ['name_en' => 'Abdominal pain', 'name_bn' => 'পেটে ব্যথা', 'category' => 'GI'],
            ['name_en' => 'Vaginal discharge', 'name_bn' => 'যোনি স্রাব', 'category' => 'Gynecology'],
            ['name_en' => 'Constipation', 'name_bn' => 'কোষ্ঠকাঠিন্য', 'category' => 'GI'],
            ['name_en' => 'Poor feeding', 'name_bn' => 'খাওয়ায় অনীহা', 'category' => 'Pediatrics'],
            ['name_en' => 'Skin discoloration', 'name_bn' => 'ত্বকের রঙ পরিবর্তন', 'category' => 'Dermatology'],
            ['name_en' => 'Burning during urination', 'name_bn' => 'প্রস্রাবে জ্বালাপোড়া', 'category' => 'Urology'],
            ['name_en' => 'Headache', 'name_bn' => 'মাথাব্যথা', 'category' => 'Neurological'],
            ['name_en' => 'Blood in stool', 'name_bn' => 'পায়খানায় রক্ত', 'category' => 'GI'],
            ['name_en' => 'Pain', 'name_bn' => 'ব্যথা', 'category' => 'General'],
            ['name_en' => 'Mood swings', 'name_bn' => 'মেজাজের পরিবর্তন', 'category' => 'Psychiatric'],
            ['name_en' => 'Ringing in ears', 'name_bn' => 'কানে শব্দ', 'category' => 'ENT'],
            ['name_en' => 'Hemoptysis', 'name_bn' => 'রক্তকাশি', 'category' => 'Respiratory'],
            ['name_en' => 'Chills', 'name_bn' => 'শীতশীত ভাব', 'category' => 'General'],
            ['name_en' => 'Lower abdominal pain', 'name_bn' => 'তলপেটে ব্যথা', 'category' => 'GI'],
            ['name_en' => 'Abdominal cramp', 'name_bn' => 'পেটে খিঁচুনি', 'category' => 'GI'],
            ['name_en' => 'Rash', 'name_bn' => 'ফুসকুড়ি', 'category' => 'Dermatology'],
            ['name_en' => 'Fatigue on exertion', 'name_bn' => 'পরিশ্রমে ক্লান্তি', 'category' => 'Cardiovascular'],
            ['name_en' => 'Hallucinations', 'name_bn' => 'হ্যালুসিনেশন', 'category' => 'Psychiatric'],
            ['name_en' => 'Nasal congestion', 'name_bn' => 'নাক বন্ধ', 'category' => 'ENT'],
            ['name_en' => 'Noisy breathing', 'name_bn' => 'শ্বাসে শব্দ', 'category' => 'Respiratory'],
            ['name_en' => 'Irregular periods', 'name_bn' => 'অনিয়মিত মাসিক', 'category' => 'Gynecology'],
            ['name_en' => 'Upper abdominal burning', 'name_bn' => 'পেটের উপরে জ্বালা', 'category' => 'GI'],
            ['name_en' => 'Skin dryness', 'name_bn' => 'ত্বক শুষ্কতা', 'category' => 'Dermatology'],
            ['name_en' => 'High blood pressure', 'name_bn' => 'উচ্চ রক্তচাপ', 'category' => 'Cardiovascular'],
            ['name_en' => 'Lack of concentration', 'name_bn' => 'মনোযোগহীনতা', 'category' => 'Neurological'],
            ['name_en' => 'Nosebleed', 'name_bn' => 'নাক দিয়ে রক্ত পড়া', 'category' => 'ENT'],
            ['name_en' => 'Joint pain', 'name_bn' => 'গিরায় ব্যথা', 'category' => 'Orthopedic'],
            ['name_en' => 'Sore throat', 'name_bn' => 'গলা ব্যথা', 'category' => 'ENT'],
            ['name_en' => 'Irregular heartbeat', 'name_bn' => 'অনিয়মিত হৃদস্পন্দন', 'category' => 'Cardiovascular'],
            ['name_en' => 'Suicidal thoughts', 'name_bn' => 'আত্মহত্যার চিন্তা', 'category' => 'Psychiatric'],
            ['name_en' => 'Post prandial bloating', 'name_bn' => 'খাওয়ার পর পেট ফাঁপা', 'category' => 'GI'],
            ['name_en' => 'Throat pain', 'name_bn' => 'গলায় ব্যথা', 'category' => 'ENT'],
            ['name_en' => 'Diarrhea', 'name_bn' => 'ডায়রিয়া', 'category' => 'GI'],
            ['name_en' => 'Back pain', 'name_bn' => 'পিঠে ব্যথা', 'category' => 'Orthopedic'],
            ['name_en' => 'Loss of appetite', 'name_bn' => 'ক্ষুধামন্দা', 'category' => 'GI'],
            ['name_en' => 'Heavy bleeding', 'name_bn' => 'অতিরিক্t রক্তস্রাব', 'category' => 'Gynecology'],
            ['name_en' => 'Cough and cold', 'name_bn' => 'কাশি ও সর্দি', 'category' => 'Respiratory'],
            ['name_en' => 'Voice change', 'name_bn' => 'গলার স্বর পরিবর্তন', 'category' => 'ENT'],
            ['name_en' => 'Abdominal fullness', 'name_bn' => 'পেট ভরা লাগা', 'category' => 'GI'],
            ['name_en' => 'Neck pain', 'name_bn' => 'ঘাড়ে ব্যথা', 'category' => 'Orthopedic'],
            ['name_en' => 'Dizziness', 'name_bn' => 'মাথা ঘোরা', 'category' => 'Neurological'],
            ['name_en' => 'Painful periods', 'name_bn' => 'মাসিকে ব্যথা', 'category' => 'Gynecology'],
            ['name_en' => 'Epigastric pain', 'name_bn' => 'পেটের উপরে ব্যথা', 'category' => 'GI'],
            ['name_en' => 'Nail changes', 'name_bn' => 'নখের পরিবর্তন', 'category' => 'Dermatology'],
            ['name_en' => 'Seizures', 'name_bn' => 'খিঁচুনি', 'category' => 'Neurological'],
            ['name_en' => 'Difficulty swallowing', 'name_bn' => 'গিলতে অসুবিধা', 'category' => 'ENT'],
            ['name_en' => 'Weight loss', 'name_bn' => 'ওজন কমে যাওয়া', 'category' => 'General'],
            ['name_en' => 'Heartburn (Acid reflux)', 'name_bn' => 'বুক জ্বালা', 'category' => 'GI'],
            ['name_en' => 'Swelling of joints', 'name_bn' => 'গিরা ফোলা', 'category' => 'Orthopedic'],
            ['name_en' => 'Nausea', 'name_bn' => 'বমি বমি ভাব', 'category' => 'GI'],
            ['name_en' => 'Pregnancy-related symptoms', 'name_bn' => 'গর্ভাবস্থা সংক্রান্ত উপসর্গ', 'category' => 'Gynecology'],
        ];

        foreach ($complaints as $i => $data) {
            ComplaintMaster::updateOrCreate(
                ['name_en' => $data['name_en']],
                array_merge($data, ['sort_order' => $i + 1, 'is_active' => true])
            );
        }

        // Common duration presets — applied globally (not per-complaint)
        $feverComplaint = ComplaintMaster::where('name_en', 'Fever')->first();
        if ($feverComplaint) {
            $durations = [
                ['duration_text_en' => '1 day', 'duration_text_bn' => '১ দিন'],
                ['duration_text_en' => '2 days', 'duration_text_bn' => '২ দিন'],
                ['duration_text_en' => '3 days', 'duration_text_bn' => '৩ দিন'],
                ['duration_text_en' => '4 days', 'duration_text_bn' => '৪ দিন'],
                ['duration_text_en' => '5 days', 'duration_text_bn' => '৫ দিন'],
                ['duration_text_en' => '6 days', 'duration_text_bn' => '৬ দিন'],
                ['duration_text_en' => '7 days', 'duration_text_bn' => '৭ দিন'],
                ['duration_text_en' => '10 days', 'duration_text_bn' => '১০ দিন'],
                ['duration_text_en' => '15 days', 'duration_text_bn' => '১৫ দিন'],
                ['duration_text_en' => '20 days', 'duration_text_bn' => '২০ দিন'],
                ['duration_text_en' => '1 month', 'duration_text_bn' => '১ মাস'],
                ['duration_text_en' => '2 months', 'duration_text_bn' => '২ মাস'],
                ['duration_text_en' => '3 months', 'duration_text_bn' => '৩ মাস'],
                ['duration_text_en' => '1 year', 'duration_text_bn' => '১ বছর'],
                ['duration_text_en' => 'For few days', 'duration_text_bn' => 'কয়েকদিন ধরে'],
                ['duration_text_en' => 'Frequent', 'duration_text_bn' => 'ঘন ঘন'],
            ];

            foreach ($durations as $i => $d) {
                ComplaintDurationPreset::updateOrCreate(
                    [
                        'complaint_master_id' => $feverComplaint->id,
                        'duration_text_en' => $d['duration_text_en'],
                    ],
                    array_merge($d, ['sort_order' => $i + 1])
                );
            }
        }
    }
}
