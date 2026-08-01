<?php

namespace App\Console\Commands;

use App\Services\MedicineBulkImportService;
use Illuminate\Console\Command;

class ImportMedicinesCommand extends Command
{
    protected $signature = 'medicines:import {file : Path to .csv or .json file}';

    protected $description = 'Bulk import medicines from a CSV or JSON file.';

    public function handle(MedicineBulkImportService $importer): int
    {
        $file = (string) $this->argument('file');

        $this->info("Importing medicines from: {$file}");

        try {
            $result = $importer->importFile($file);
        } catch (\Throwable $e) {
            $this->error($e->getMessage());
            return self::FAILURE;
        }

        $this->info("Created: {$result['created']}");
        $this->info("Skipped (duplicates): {$result['skipped']}");

        if (! empty($result['errors'])) {
            $this->warn('Errors: ' . count($result['errors']));
            foreach (array_slice($result['errors'], 0, 10) as $err) {
                $this->line("  Row {$err['row']}: " . json_encode($err['errors']));
            }
            if (count($result['errors']) > 10) {
                $this->line('  ... and ' . (count($result['errors']) - 10) . ' more.');
            }
        }

        return self::SUCCESS;
    }
}
