const ISO_DATE_TIME_PATTERN = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/g;

function toDdMmYyyyDateTime(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} ${hours}:${minutes}`;
}

export function normalizeStatusMessage(input: string): string {
  return input.replace(ISO_DATE_TIME_PATTERN, (match: string) => {
    const date = new Date(match);
    if (Number.isNaN(date.getTime())) {
      return match;
    }

    return toDdMmYyyyDateTime(date);
  });
}