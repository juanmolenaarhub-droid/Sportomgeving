// Verwijder HTML tags en gevaarlijke tekens uit gebruikersinput
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')           // verwijder HTML tags
    .replace(/[<>&"']/g, (c) => ({     // escape gevaarlijke tekens
      '<': '', '>': '', '&': '&', '"': '', "'": ''
    }[c] ?? c))
    .trim()
}

// Beperkt de lengte van een string
export function limitLength(input: string, max: number): string {
  return input.slice(0, max)
}
