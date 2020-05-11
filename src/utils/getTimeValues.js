export default function(seconds) {
  const _hours = Math.floor(seconds / 3600);
  const _mins = Math.floor((seconds - _hours * 3600) / 60);
  const _secs = seconds - _hours * 3600 - _mins * 60;

  const hours = String(_hours).padStart(2, '0');
  const mins = String(_mins).padStart(2, '0');
  const secs = String(_secs).padStart(2, '0');

  return { hours, mins, secs };
}
