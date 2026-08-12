/** Returns the i18n key for a time-of-day greeting ("Good morning", etc.). */
export function useGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return 'dashboard.greetingMorning';
  if (hour < 17) return 'dashboard.greetingAfternoon';
  return 'dashboard.greetingEvening';
}
