<?php

namespace App\Services\Reports;

use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportExporter
{
    public function pdfFromColumns(string $filename, string $title, array $rows, array $columns, array $meta = []): \Symfony\Component\HttpFoundation\Response
    {
        $headers = array_values($columns);
        $keys = array_keys($columns);

        $body = view('reports.pdf', [
            'title' => $title,
            'headers' => $headers,
            'keys' => $keys,
            'rows' => $rows,
            'meta' => $meta,
            'generated_at' => now()->toDateTimeString(),
        ])->render();

        $pdf = Pdf::loadHTML($body)->setPaper('a4', 'portrait');
        return $pdf->download($filename);
    }

    public function csv(string $filename, array $rows, array $headers): StreamedResponse
    {
        return response()->streamDownload(function () use ($rows, $headers) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $headers);
            foreach ($rows as $row) {
                fputcsv($out, array_map(fn ($k) => $row[$k] ?? '', array_keys(array_combine($headers, $headers))));
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function csvFromColumns(string $filename, array $rows, array $columns): StreamedResponse
    {
        $headers = array_values($columns);
        $keys = array_keys($columns);

        return response()->streamDownload(function () use ($rows, $keys, $headers) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $headers);
            foreach ($rows as $row) {
                fputcsv($out, array_map(fn ($k) => is_array($row) ? ($row[$k] ?? '') : '', $keys));
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
