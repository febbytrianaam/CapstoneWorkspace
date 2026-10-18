<?php

declare(strict_types=1);

final class BeritaAcaraNumbering
{
    public static function forMeeting(string $meetingId, array $archives, array $drafts): int
    {
        $used = [];
        $assigned = [];
        $uncoded = [];
        $draftsByDate = [];
        foreach ($drafts as $draft) {
            $date = self::meetingDate((string) ($draft['meeting_date'] ?? ''));
            if ($date !== null) $draftsByDate[$date][(string) $draft['meeting_id']] = true;
        }
        foreach ($archives as $archive) {
            $number = null;
            foreach (['original_name', 'title'] as $field) {
                if (preg_match('/\bBA([0-9]{1,9})\b/i', (string) ($archive[$field] ?? ''), $match) && (int) $match[1] > 0) {
                    $number = (int) $match[1];
                    break;
                }
            }
            $linked = (string) ($archive['meeting_id'] ?? '');
            // Legacy manual uploads may have lost their meeting link. Infer only an unambiguous date.
            if ($linked === '' && $number !== null) {
                $date = self::meetingDate((string) ($archive['original_name'] ?? ''))
                    ?? self::meetingDate((string) ($archive['title'] ?? ''));
                $matches = $draftsByDate[$date ?? ''] ?? [];
                if (count($matches) === 1) $linked = (string) array_key_first($matches);
            }
            $identity = $linked !== '' ? 'meeting:' . $linked : ($number ? 'code:' . $number : 'archive:' . $archive['id']);
            if ($number) {
                $used[$number] = true;
                if ($linked !== '') {
                    if (isset($assigned[$linked]) && $assigned[$linked] !== $number) throw new RuntimeException('Kode BA pertemuan ini perlu diperiksa oleh pengelola.');
                    $assigned[$linked] = $number;
                }
                unset($uncoded[$identity]);
            } elseif (!isset($assigned[$linked])) $uncoded[$identity] = $linked;
        }
        foreach ($drafts as $draft) {
            $number = filter_var($draft['document_number'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($number !== false) {
                $used[$number] = true;
                $id = (string) $draft['meeting_id'];
                if (isset($assigned[$id]) && $assigned[$id] !== $number) throw new RuntimeException('Kode draft dan BA arsip berbeda. Hubungi pengelola.');
                $assigned[$id] = $number;
                unset($uncoded['meeting:' . $id]);
            }
        }
        $next = $used ? max(array_keys($used)) + 1 : 1;
        foreach ($uncoded as $linked) {
            if ($linked !== '' && isset($assigned[$linked])) continue;
            if ($linked !== '') $assigned[$linked] = $next;
            $next++;
        }
        // Legacy drafts reserve a place in creation order; manual BA + draft for one meeting share it.
        foreach ($drafts as $draft) {
            $id = (string) $draft['meeting_id'];
            if (!isset($assigned[$id])) $assigned[$id] = $next++;
        }
        return $assigned[$meetingId] ?? $next;
    }

    private static function meetingDate(string $text): ?string
    {
        if (!preg_match('/\b(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})\b/i', $text, $match)) return null;
        $months = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
        $month = array_search(strtolower($match[2]), $months, true) + 1;
        if (!checkdate($month, (int) $match[1], (int) $match[3])) return null;
        return sprintf('%04d-%02d-%02d', (int) $match[3], $month, (int) $match[1]);
    }
}
