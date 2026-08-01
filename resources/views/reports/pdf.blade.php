<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #222; }
        h1 { font-size: 16px; margin: 0 0 4px; }
        .meta { color: #666; font-size: 10px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background: #f3f4f6; }
        tr:nth-child(even) td { background: #fafafa; }
        .footer { margin-top: 18px; color: #888; font-size: 9px; text-align: right; }
    </style>
</head>
<body>
    <h1>{{ $title }}</h1>
    <div class="meta">
        @foreach ($meta as $k => $v)
            <span><strong>{{ $k }}:</strong> {{ $v }}</span>&nbsp;&nbsp;
        @endforeach
    </div>

    <table>
        <thead>
            <tr>
                @foreach ($headers as $h)
                    <th>{{ $h }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach ($rows as $row)
                <tr>
                    @foreach ($keys as $k)
                        <td>{{ is_array($row) ? ($row[$k] ?? '') : '' }}</td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">Generated {{ $generated_at }}</div>
</body>
</html>
