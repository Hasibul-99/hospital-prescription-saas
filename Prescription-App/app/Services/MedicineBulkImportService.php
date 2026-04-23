<?php

namespace App\Services;

use App\Models\Medicine;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MedicineBulkImportService
{
    public const ALLOWED_TYPES = [
        'Tablet', 'Syrup', 'Capsule', 'Injection', 'Suppository', 'Cream',
        'Drops', 'Mouthwash', 'Toothpaste', 'Gel', 'Powder', 'Suspension',
        'Ointment', 'Inhaler',
    ];

    public function __construct(private readonly MedicineSearchService $search)
    {
    }

    /**
     * Import medicines from structured rows.
     *
     * Row shape: brand_name, generic_name, type, strength, manufacturer, price.
     * Returns: ['created' => int, 'skipped' => int, 'errors' => array].
     */
    public function importRows(iterable $rows): array
    {
        $created = 0;
        $skipped = 0;
        $errors = [];
        $index = 0;

        DB::transaction(function () use ($rows, &$created, &$skipped, &$errors, &$index) {
            foreach ($rows as $row) {
                $index++;
                $row = $this->normalizeRow($row);

                $validator = Validator::make($row, [
                    'brand_name' => ['required', 'string', 'max:255'],
                    'generic_name' => ['nullable', 'string', 'max:255'],
                    'type' => ['required', 'string', 'in:' . implode(',', self::ALLOWED_TYPES)],
                    'strength' => ['nullable', 'string', 'max:100'],
                    'manufacturer' => ['nullable', 'string', 'max:255'],
                    'price' => ['nullable', 'numeric', 'min:0'],
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
                    'brand_name' => $row['brand_name'],
                    'generic_name' => $row['generic_name'] ?? null,
                    'type' => $row['type'],
                    'strength' => $row['strength'] ?? null,
                    'manufacturer' => $row['manufacturer'] ?? null,
                    'price' => $row['price'] ?? null,
                    'is_active' => true,
                    'is_pending_approval' => false,
                ]);

                $created++;
            }
        });

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
            'csv' => $this->importRows($this->readCsv($path)),
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

    protected function readCsv(string $path): iterable
    {
        $handle = fopen($path, 'r');
        if (! $handle) {
            throw new \RuntimeException("Cannot open CSV: {$path}");
        }

        $header = fgetcsv($handle);
        if (! $header) {
            fclose($handle);
            return [];
        }
        $header = array_map(fn ($h) => trim((string) $h), $header);

        $rows = [];
        while (($cols = fgetcsv($handle)) !== false) {
            if (count($cols) < count($header)) {
                $cols = array_pad($cols, count($header), null);
            }
            $rows[] = array_combine($header, array_slice($cols, 0, count($header)));
        }
        fclose($handle);
        return $rows;
    }
}
