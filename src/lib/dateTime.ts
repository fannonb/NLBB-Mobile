const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-KE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export const formatReadableDateTime = (value: string | null | undefined, fallback = 'Recently') => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return trimmed;
  }

  return DATE_TIME_FORMATTER.format(date);
};
