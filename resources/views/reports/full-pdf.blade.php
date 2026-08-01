<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #222; }
        h1 { font-size: 18px; margin: 0 0 2px; }
        h2 { font-size: 13px; margin: 16px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
        .meta { color: #666; font-size: 10px; margin-bottom: 6px; }
        .meta span { margin-right: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
        th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; }
        th { background: #f3f4f6; }
        tr:nth-child(even) td { background: #fafafa; }
        table.kv th { width: 40%; }
        table.chart { border: none; margin-bottom: 10px; }
        table.chart td { border: none; padding: 2px 4px; vertical-align: middle; }
        td.c-label { width: 35%; color: #333; }
        td.c-track { width: 55%; }
        td.c-val { width: 10%; text-align: right; color: #555; }
        .c-fill { background: #3f8f86; height: 11px; border-radius: 2px; font-size: 1px; }
        .empty { color: #999; font-style: italic; }
        .footer { margin-top: 18px; color: #888; font-size: 9px; text-align: right; }
    </style>
</head>
<body>
    <h1>{{ $title }}</h1>
    <div class="meta">
        @foreach ($meta as $k => $v)
            <span><strong>{{ $k }}:</strong> {{ $v }}</span>
        @endforeach
    </div>

    @foreach ($sections as $s)
        <h2>{{ $s['title'] }}</h2>

        @if (! empty($s['summary']))
            <table class="kv">
                @foreach ($s['summary'] as $k => $v)
                    <tr><th>{{ $k }}</th><td>{{ $v }}</td></tr>
                @endforeach
            </table>
        @else
            @php $rows = $s['rows'] ?? []; @endphp

            @if (count($rows) === 0)
                <p class="empty">No data for this period.</p>
            @else
                @if (! empty($s['chart']))
                    @php
                        $lk = $s['chart']['label'];
                        $vk = $s['chart']['value'];
                        $max = max(array_map(fn ($r) => (int) ($r[$vk] ?? 0), $rows)) ?: 1;
                    @endphp
                    <table class="chart">
                        @foreach ($rows as $r)
                            <tr>
                                <td class="c-label">{{ $r[$lk] ?? '' }}</td>
                                <td class="c-track">
                                    <div class="c-fill" style="width: {{ max(2, (int) round(((int) ($r[$vk] ?? 0) / $max) * 100)) }}%;">&nbsp;</div>
                                </td>
                                <td class="c-val">{{ $r[$vk] ?? 0 }}</td>
                            </tr>
                        @endforeach
                    </table>
                @endif

                <table>
                    <thead>
                        <tr>
                            @foreach ($s['columns'] as $label)
                                <th>{{ $label }}</th>
                            @endforeach
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($rows as $r)
                            <tr>
                                @foreach (array_keys($s['columns']) as $k)
                                    <td>{{ is_array($r) ? ($r[$k] ?? '') : '' }}</td>
                                @endforeach
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        @endif
    @endforeach

    <div class="footer">Generated {{ $generated_at }}</div>
</body>
</html>
