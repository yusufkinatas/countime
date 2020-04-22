export default function(seconds) {
  const _hours = Math.floor(seconds / 3600);
  const _mins = Math.floor((seconds - _hours * 3600) / 60);
  const _secs = seconds - _hours * 3600 - _mins * 60;

  const hoursFormatted = String(_hours).padStart(2, '0');
  const minsFormatted = String(_mins).padStart(2, '0');
  const secsFormatted = String(_secs).padStart(2, '0');

  const formatted = `${hoursFormatted}:${minsFormatted}:${secsFormatted}`;

  return formatted;
}
