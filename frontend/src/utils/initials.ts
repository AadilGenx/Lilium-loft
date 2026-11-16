/** Up to two capital letters from a person's name, shown in place of a photo. */
export function initials(firstName: string, lastName = ''): string {
  const letters = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
  return letters || '?';
}
