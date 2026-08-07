<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

/**
 * Seeds the four subscription tiers that used to live in config/subscription.php.
 *
 * Values mirror the old config exactly so existing hospitals keep the limits they
 * already had, with two clarifications the config could not express:
 *   - NULL means unlimited (paid plans are not metered on prescriptions).
 *   - The free tier's 30-prescription cap — previously the hardcoded
 *     Hospital::FREE_TIER_RX_LIMIT constant — is now just max_prescriptions.
 *
 * Idempotent (updateOrCreate keyed on `code`) because the hospitals migration
 * runs it inline to have plan rows available for its backfill.
 */
class PlanSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->plans() as $plan) {
            Plan::withTrashed()->updateOrCreate(['code' => $plan['code']], $plan + ['deleted_at' => null]);
        }
    }

    private function plans(): array
    {
        return [
            [
                'code' => 'free',
                'name' => 'Free',
                'name_bn' => 'ফ্রি',
                'tagline' => 'Try the full workflow before you commit.',
                'tagline_bn' => 'পুরো সিস্টেম আগে যাচাই করুন।',
                'price_monthly' => 0,
                'price_yearly' => null,
                'max_doctors' => 1,
                'max_patients_per_month' => 50,
                'max_prescriptions' => 30,
                'trial_days' => 0,
                'features' => [
                    ['en' => '1 doctor', 'bn' => '১ জন ডাক্তার'],
                    ['en' => '30 prescriptions total', 'bn' => 'মোট ৩০টি প্রেসক্রিপশন'],
                    ['en' => 'Up to 50 patients per month', 'bn' => 'মাসে ৫০ জন রোগী পর্যন্ত'],
                    ['en' => 'Global medicine database', 'bn' => 'গ্লোবাল ওষুধ ডাটাবেজ'],
                    ['en' => 'A4 print & PDF export', 'bn' => 'A4 প্রিন্ট ও PDF এক্সপোর্ট'],
                ],
                'cta_label' => 'Start free',
                'cta_label_bn' => 'ফ্রি শুরু করুন',
                'is_public' => true,
                'is_featured' => false,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'code' => 'basic',
                'name' => 'Basic',
                'name_bn' => 'বেসিক',
                'tagline' => 'For single-doctor chambers and small clinics.',
                'tagline_bn' => 'ছোট চেম্বার ও ক্লিনিকের জন্য।',
                'price_monthly' => 1000,
                'price_yearly' => 10000,
                'max_doctors' => 5,
                'max_patients_per_month' => 500,
                'max_prescriptions' => null,
                'trial_days' => 30,
                'features' => [
                    ['en' => 'Up to 5 doctors', 'bn' => '৫ জন ডাক্তার পর্যন্ত'],
                    ['en' => 'Unlimited prescriptions', 'bn' => 'আনলিমিটেড প্রেসক্রিপশন'],
                    ['en' => 'Up to 500 patients per month', 'bn' => 'মাসে ৫০০ জন রোগী পর্যন্ত'],
                    ['en' => 'Appointments & serial queue', 'bn' => 'অ্যাপয়েন্টমেন্ট ও সিরিয়াল কিউ'],
                    ['en' => 'Disease templates', 'bn' => 'রোগভিত্তিক টেমপ্লেট'],
                ],
                'cta_label' => 'Start free trial',
                'cta_label_bn' => 'ফ্রি ট্রায়াল শুরু করুন',
                'is_public' => true,
                'is_featured' => false,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'code' => 'premium',
                'name' => 'Premium',
                'name_bn' => 'প্রিমিয়াম',
                'tagline' => 'For multi-doctor clinics that need full workflows.',
                'tagline_bn' => 'একাধিক ডাক্তারের ক্লিনিকের জন্য সম্পূর্ণ সমাধান।',
                'price_monthly' => 5000,
                'price_yearly' => 50000,
                'max_doctors' => 20,
                'max_patients_per_month' => 5000,
                'max_prescriptions' => null,
                'trial_days' => 30,
                'features' => [
                    ['en' => 'Up to 20 doctors', 'bn' => '২০ জন ডাক্তার পর্যন্ত'],
                    ['en' => 'Unlimited prescriptions', 'bn' => 'আনলিমিটেড প্রেসক্রিপশন'],
                    ['en' => 'Up to 5,000 patients per month', 'bn' => 'মাসে ৫,০০০ জন রোগী পর্যন্ত'],
                    ['en' => 'Online booking & public doctor profiles', 'bn' => 'অনলাইন বুকিং ও পাবলিক ডাক্তার প্রোফাইল'],
                    ['en' => 'Reports & daily statements', 'bn' => 'রিপোর্ট ও দৈনিক হিসাব'],
                    ['en' => 'Priority support', 'bn' => 'অগ্রাধিকার সাপোর্ট'],
                ],
                'cta_label' => 'Start free trial',
                'cta_label_bn' => 'ফ্রি ট্রায়াল শুরু করুন',
                'is_public' => true,
                'is_featured' => true,
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'code' => 'enterprise',
                'name' => 'Enterprise',
                'name_bn' => 'এন্টারপ্রাইজ',
                'tagline' => 'Multi-department hospitals with custom needs.',
                'tagline_bn' => 'বড় হাসপাতালের কাস্টম প্রয়োজনের জন্য।',
                'price_monthly' => 15000,
                'price_yearly' => 150000,
                'max_doctors' => 100,
                'max_patients_per_month' => 50000,
                'max_prescriptions' => null,
                'trial_days' => 30,
                'features' => [
                    ['en' => 'Up to 100 doctors', 'bn' => '১০০ জন ডাক্তার পর্যন্ত'],
                    ['en' => 'Unlimited prescriptions', 'bn' => 'আনলিমিটেড প্রেসক্রিপশন'],
                    ['en' => 'Multi-chamber & multi-department', 'bn' => 'একাধিক চেম্বার ও বিভাগ'],
                    ['en' => 'Audit logs & compliance reports', 'bn' => 'অডিট লগ ও কমপ্লায়েন্স রিপোর্ট'],
                    ['en' => 'Custom prescription branding', 'bn' => 'কাস্টম প্রেসক্রিপশন ব্র্যান্ডিং'],
                    ['en' => 'Dedicated account manager', 'bn' => 'ডেডিকেটেড অ্যাকাউন্ট ম্যানেজার'],
                ],
                'cta_label' => 'Talk to sales',
                'cta_label_bn' => 'সেলসের সাথে কথা বলুন',
                'is_public' => true,
                'is_featured' => false,
                'is_active' => true,
                'sort_order' => 4,
            ],
        ];
    }
}
