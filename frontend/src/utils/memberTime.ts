// LocalDateTime 沒有時區；只調整顯示格式，不轉換資料庫時間。
export function formatMemberTime(value: string | null | undefined): string {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d{1,9})?$/.exec(value ?? '');
  if (!match) return '暫未提供';
  const timestamp = match[1] + 'T' + match[2];
  const date = new Date(timestamp + 'Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 19) !== timestamp) {
    return '暫未提供';
  }
  return match[1] + ' ' + match[2];
}
