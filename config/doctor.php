<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Specialization suggestions
    |--------------------------------------------------------------------------
    |
    | Offered as a searchable dropdown wherever a doctor's specialization is
    | edited, so the same discipline is not stored five different ways
    | ("Cardiology" / "cardiology" / "Cardiologist" / "Heart").
    |
    | This is a SUGGESTION list, not a whitelist — the field stays free text and
    | accepts anything typed in, so an unlisted or sub-specialty discipline is
    | never blocked. Nothing validates against these values.
    |
    */

    'specializations' => [
        'Anesthesiology',
        'Cardiology',
        'Cardiac Surgery',
        'Dentistry',
        'Dermatology',
        'Diabetology',
        'Emergency Medicine',
        'Endocrinology',
        'ENT (Otolaryngology)',
        'Family Medicine',
        'Gastroenterology',
        'General Surgery',
        'Gynecology & Obstetrics',
        'Hematology',
        'Hepatology',
        'Internal Medicine',
        'Nephrology',
        'Neurology',
        'Neurosurgery',
        'Oncology',
        'Ophthalmology',
        'Orthopedics',
        'Pediatrics',
        'Pediatric Surgery',
        'Physical Medicine & Rehabilitation',
        'Plastic Surgery',
        'Psychiatry',
        'Pulmonology (Respiratory Medicine)',
        'Radiology & Imaging',
        'Rheumatology',
        'Urology',
    ],

];
