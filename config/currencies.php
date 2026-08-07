<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Supported currencies
    |--------------------------------------------------------------------------
    |
    | The fixed set a hospital may pick from for in-app money display, and the
    | set the super admin may pick from for the platform base currency used on
    | plan prices and the landing page.
    |
    | These are display definitions only — there is no exchange-rate table and
    | no conversion anywhere. A hospital billing in USD simply enters and reads
    | USD figures; nothing recalculates them from BDT.
    |
    | `position` is where the symbol sits relative to the number.
    |
    */

    'supported' => [
        'BDT' => ['symbol' => '৳', 'name' => 'Bangladeshi Taka', 'decimals' => 2, 'position' => 'before'],
        'USD' => ['symbol' => '$', 'name' => 'US Dollar', 'decimals' => 2, 'position' => 'before'],
        'EUR' => ['symbol' => '€', 'name' => 'Euro', 'decimals' => 2, 'position' => 'before'],
        'GBP' => ['symbol' => '£', 'name' => 'British Pound', 'decimals' => 2, 'position' => 'before'],
        'INR' => ['symbol' => '₹', 'name' => 'Indian Rupee', 'decimals' => 2, 'position' => 'before'],
        'PKR' => ['symbol' => '₨', 'name' => 'Pakistani Rupee', 'decimals' => 2, 'position' => 'before'],
        'NPR' => ['symbol' => '₨', 'name' => 'Nepalese Rupee', 'decimals' => 2, 'position' => 'before'],
        'LKR' => ['symbol' => 'Rs', 'name' => 'Sri Lankan Rupee', 'decimals' => 2, 'position' => 'before'],
        'AED' => ['symbol' => 'د.إ', 'name' => 'UAE Dirham', 'decimals' => 2, 'position' => 'before'],
        'SAR' => ['symbol' => '﷼', 'name' => 'Saudi Riyal', 'decimals' => 2, 'position' => 'before'],
        'MYR' => ['symbol' => 'RM', 'name' => 'Malaysian Ringgit', 'decimals' => 2, 'position' => 'before'],
        'SGD' => ['symbol' => 'S$', 'name' => 'Singapore Dollar', 'decimals' => 2, 'position' => 'before'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Fallback currency
    |--------------------------------------------------------------------------
    |
    | Used when no platform base currency has been set in platform_settings and
    | when a hospital's currency column holds an unrecognised code.
    |
    */

    'default' => 'BDT',

];
