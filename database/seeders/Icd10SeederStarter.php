<?php

namespace Database\Seeders;

use App\Models\Icd10Code;
use Illuminate\Database\Seeder;

/**
 * Starter set of common ICD-10 codes for outpatient/primary-care use.
 * The full 70k catalog is a data-ops task — use `medicines:import`-style
 * bulk loader once the CSV is on hand. This seeder is idempotent.
 */
class Icd10SeederStarter extends Seeder
{
    public function run(): void
    {
        $rows = [
            // A/B — Infectious
            ['A09',   'Diarrhoea and gastroenteritis of presumed infectious origin', 'A00-B99 Infectious'],
            ['B34.9', 'Viral infection, unspecified',                                 'A00-B99 Infectious'],
            ['B54',   'Unspecified malaria',                                          'A00-B99 Infectious'],

            // D50-D89 — Blood
            ['D50.9', 'Iron deficiency anaemia, unspecified',                         'D50-D89 Blood'],

            // E — Endocrine
            ['E11.9', 'Type 2 diabetes mellitus without complications',              'E00-E90 Endocrine'],
            ['E78.5', 'Hyperlipidaemia, unspecified',                                 'E00-E90 Endocrine'],
            ['E03.9', 'Hypothyroidism, unspecified',                                  'E00-E90 Endocrine'],

            // F — Mental
            ['F32.9', 'Depressive episode, unspecified',                              'F00-F99 Mental'],
            ['F41.1', 'Generalized anxiety disorder',                                 'F00-F99 Mental'],
            ['F51.0', 'Nonorganic insomnia',                                          'F00-F99 Mental'],

            // G — Nervous system
            ['G43.9', 'Migraine, unspecified',                                        'G00-G99 Nervous'],
            ['G44.2', 'Tension-type headache',                                        'G00-G99 Nervous'],

            // H — Eye/Ear
            ['H10.9', 'Conjunctivitis, unspecified',                                  'H00-H59 Eye'],
            ['H66.9', 'Otitis media, unspecified',                                    'H60-H95 Ear'],

            // I — Circulatory
            ['I10',   'Essential (primary) hypertension',                             'I00-I99 Circulatory'],
            ['I25.9', 'Chronic ischaemic heart disease, unspecified',                'I00-I99 Circulatory'],
            ['I50.9', 'Heart failure, unspecified',                                   'I00-I99 Circulatory'],

            // J — Respiratory
            ['J00',   'Acute nasopharyngitis (common cold)',                          'J00-J99 Respiratory'],
            ['J06.9', 'Acute upper respiratory infection, unspecified',              'J00-J99 Respiratory'],
            ['J18.9', 'Pneumonia, unspecified organism',                              'J00-J99 Respiratory'],
            ['J20.9', 'Acute bronchitis, unspecified',                                'J00-J99 Respiratory'],
            ['J45.9', 'Asthma, unspecified',                                          'J00-J99 Respiratory'],
            ['J30.1', 'Allergic rhinitis due to pollen',                              'J00-J99 Respiratory'],

            // K — Digestive
            ['K21.9', 'Gastro-oesophageal reflux disease without oesophagitis',      'K00-K93 Digestive'],
            ['K29.7', 'Gastritis, unspecified',                                       'K00-K93 Digestive'],
            ['K59.0', 'Constipation',                                                 'K00-K93 Digestive'],

            // L — Skin
            ['L23.9', 'Allergic contact dermatitis, unspecified',                    'L00-L99 Skin'],
            ['L50.9', 'Urticaria, unspecified',                                       'L00-L99 Skin'],

            // M — Musculoskeletal
            ['M25.5', 'Pain in joint',                                                'M00-M99 Musculoskeletal'],
            ['M54.5', 'Low back pain',                                                'M00-M99 Musculoskeletal'],
            ['M79.1', 'Myalgia',                                                      'M00-M99 Musculoskeletal'],

            // N — Genitourinary
            ['N30.9', 'Cystitis, unspecified',                                        'N00-N99 Genitourinary'],
            ['N39.0', 'Urinary tract infection, site not specified',                 'N00-N99 Genitourinary'],
            ['N91.2', 'Amenorrhoea, unspecified',                                     'N00-N99 Genitourinary'],

            // O — Pregnancy
            ['O26.9', 'Pregnancy related condition, unspecified',                    'O00-O99 Pregnancy'],

            // R — Symptoms
            ['R05',   'Cough',                                                        'R00-R99 Symptoms'],
            ['R10.4', 'Other and unspecified abdominal pain',                        'R00-R99 Symptoms'],
            ['R11',   'Nausea and vomiting',                                          'R00-R99 Symptoms'],
            ['R50.9', 'Fever, unspecified',                                           'R00-R99 Symptoms'],
            ['R51',   'Headache',                                                     'R00-R99 Symptoms'],
            ['R60.0', 'Localized oedema',                                             'R00-R99 Symptoms'],

            // Z — Factors influencing health
            ['Z00.0', 'General adult medical examination',                            'Z00-Z99 Factors'],
        ];

        foreach ($rows as [$code, $title, $chapter]) {
            Icd10Code::updateOrCreate(
                ['code' => $code],
                ['title' => $title, 'chapter' => $chapter],
            );
        }
    }
}
