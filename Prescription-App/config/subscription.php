<?php

return [
    'plans' => [
        'free' => [
            'price' => 0,
            'max_doctors' => 1,
            'max_patients_per_month' => 50,
        ],
        'basic' => [
            'price' => 1000,
            'max_doctors' => 5,
            'max_patients_per_month' => 500,
        ],
        'premium' => [
            'price' => 5000,
            'max_doctors' => 20,
            'max_patients_per_month' => 5000,
        ],
        'enterprise' => [
            'price' => 15000,
            'max_doctors' => 100,
            'max_patients_per_month' => 50000,
        ],
    ],
];
