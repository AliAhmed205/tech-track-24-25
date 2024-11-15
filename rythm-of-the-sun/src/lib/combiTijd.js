export function combineDateTime(date, time) {
  const [hours, minutes] = time.split(":");
  const newDate = new Date(date);
  newDate.setHours(hours, minutes);
  return newDate;
}
