<?php

namespace App\Services;

use App\Models\Medicine;
use Generator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MedicineBulkImportService
{
    public const ALLOWED_TYPES = [
        'Tablet', 'Syrup', 'Capsule', 'Injection', 'Suppository', 'Cream',
        'Drops', 'Mouthwash', 'Toothpaste', 'Gel', 'Powder', 'Suspension',
        'Ointment', 'Inhaler',
    ];

    /**
     * Rows-per-transaction. Keeps memory + rollback blast radius bounded when
     * importing the full DGDA feed (~25,900 rows).
     */
    public const CHUNK_SIZE = 500;

    public function __construct(private readonly MedicineSearchService $search)
    {
    }

    /**
     * Import medicines from structured rows (any iterable — array or generator).
     *
     * Row shape: brand_name, generic_name, type, strength, manufacturer, price.
     * Returns: ['created' => int, 'skipped' => int, 'errors' => array].
     *
     * The iterable is processed in chunks of CHUNK_SIZE rows, one DB
     * transaction per chunk. A validation failure on a single row does not
     * roll back siblings.
     */
    public function importRows(iterable $rows): array
    {
        $created = 0;
        $skipped = 0;
        $errors = [];
        $index = 0;
        $buffer = [];

        $flush = function () use (&$buffer, &$created, &$skipped, &$errors, &$index) {
            if (empty($buffer)) return;

            DB::transaction(function () use ($buffer, &$created, &$skipped, &$errors, &$index) {
                foreach ($buffer as $row) {
                    $index++;
                    $row = $this->normalizeRow($row);

                    $validator = Validator::make($row, [
                        'brand_name'   => ['required', 'string', 'max:255'],
                        'generic_name' => ['nullable', 'string', 'max:255'],
                        'type'         => ['required', 'string', 'in:' . implode(',', self::ALLOWED_TYPES)],
                        'strength'     => ['nullable', 'string', 'max:100'],
                        'manufacturer' => ['nullable', 'string', 'max:255'],
                        'price'        => ['nullable', 'numeric', 'min:0'],
                    ]);

                    if ($validator->fails()) {
                        $errors[] = ['row' => $index, 'errors' => $validator->errors()->toArray()];
                        continue;
                    }

                    $duplicate = Medicine::query()
                        ->where('brand_name', $row['brand_name'])
                        ->when(! empty($row['strength']), fn ($qq) => $qq->where('strength', $row['strength']))
                        ->when(! empty($row['manufacturer']), fn ($qq) => $qq->where('manufacturer', $row['manufacturer']))
                        ->exists();

                    if ($duplicate) {
                        $skipped++;
                        continue;
                    }

                    Medicine::create([
                        'brand_name'         => $row['brand_name'],
                        'generic_name'       => $row['generic_name'] ?? null,
                        'type'               => $row['type'],
                        'strength'           => $row['strength'] ?? null,
                        'manufacturer'       => $row['manufacturer'] ?? null,
                        'price'              => $row['price'] ?? null,
                        'is_active'          => true,
                        'is_pending_approval' => false,
                    ]);

                    $created++;
                }
            });

            $buffer = [];
        };

        foreach ($rows as $row) {
            $buffer[] = $row;
            if (count($buffer) >= self::CHUNK_SIZE) {
                $flush();
            }
        }
        $flush();

        $this->search->invalidate();

        return compact('created', 'skipped', 'errors');
    }

    public function importFile(string $path): array
    {
        if (! is_file($path)) {
            throw new \RuntimeException("File not found: {$path}");
        }

        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return match ($ext) {
            'json' => $this->importRows($this->readJson($path)),
            'csv'  => $this->importRows($this->readCsv($path)),
            default => throw new \RuntimeException("Unsupported file type: {$ext}. Use .csv or .json."),
        };
    }

    protected function normalizeRow(array $row): array
    {
        $out = [];
        foreach (['brand_name', 'generic_name', 'type', 'strength', 'manufacturer', 'price'] as $k) {
            if (array_key_exists($k, $row)) {
                $v = is_string($row[$k]) ? trim($row[$k]) : $row[$k];
                $out[$k] = $v === '' ? null : $v;
            }
        }
        return $out;
    }

    protected function readJson(string $path): iterable
    {
        $raw = file_get_contents($path);
        $data = json_decode($raw, true);
        if (! is_array($data)) {
            throw new \RuntimeException('Invalid JSON structure. Expected array of objects.');
        }
        return $data;
    }

    /**
     * Stream a CSV as a generator — never loads the whole file into memory.
     * Safe for tens of thousands of rows.
     */
    protected function readCsv(string $path): Generator
    {
        $handle = fopen($path, 'r');
        if (! $handle) {
            throw new \RuntimeException("Cannot open CSV: {$path}");
        }

        try {
            $header = fgetcsv($handle);
            if (! $header) {
                return;
            }
            $header = array_map(fn ($h) => trim((string) $h), $header);
            $count  = count($header);

            while (($cols = fgetcsv($handle)) !== false) {
                if (count($cols) < $count) {
                    $cols = array_pad($cols, $count, null);
                }
                yield array_combine($header, array_slice($cols, 0, $count));
            }
        } finally {
            fclose($handle);
        }
    }
}
