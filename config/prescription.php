<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Prescription form presets
    |--------------------------------------------------------------------------
    |
    | Quick-pick suggestions offered by the prescription builder and by both
    | template forms (a doctor's personal templates and a hospital's global
    | ones).
    |
    | These lived as hardcoded arrays in Doctor\TemplateController and
    | Hospital\TemplateController and had drifted apart — the hospital form,
    | which builds the templates every doctor in the hospital uses, offered
    | strictly fewer options than the personal form. One list, read by both.
    |
    | All of these are suggestions, never whitelists: every field they feed
    | accepts free text.
    |
    */

    'duration_presets' => [
        '1 day', '2 days', '3 days', '4 days', '5 days', '6 days', '7 days',
        '10 days', '15 days', '20 days',
        '1 month', '2 months', '3 months', '6 months', '1 year',
        'Few days', 'Frequent', 'Continuous', 'At night',
    ],

    /** Bilingual per CLAUDE.md — advice is printed on the prescription. */
    'advice_suggestions' => [
        ['en' => 'Get tests done', 'bn' => 'পরীক্ষা করে দেখান'],
        ['en' => 'Drink plenty of water', 'bn' => 'প্রচুর পানি খাবেন'],
        ['en' => 'Take rest', 'bn' => 'বিশ্রাম নিবেন'],
        ['en' => 'Avoid cold food', 'bn' => 'ঠাণ্ডা খাবার এড়িয়ে চলুন'],
        ['en' => 'Avoid oily food', 'bn' => 'তৈলাক্ত খাবার এড়িয়ে চলুন'],
        ['en' => 'Walk daily', 'bn' => 'প্রতিদিন হাঁটবেন'],
        ['en' => 'Take medicine regularly', 'bn' => 'নিয়মিত ঔষধ সেবন করবেন'],
    ],

    /** How a medicine is taken, shown as chips under the dose row. */
    'instruction_presets' => [
        'খাবারের পরে', 'খাবারের আগে', 'খাবারের সাথে',
        'If Fever or Pain', 'যন্ত্রণা থাকলে',
    ],

    /** One-tap day counts for a medicine's duration. */
    'duration_day_presets' => [1, 5, 7, 14, 30],

];
