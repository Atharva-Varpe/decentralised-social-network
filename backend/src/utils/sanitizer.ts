export function sanitizeInput(input: string | undefined): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Basic sanitization - remove script tags, HTML tags, and trim
  const clean = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  const trimmed = clean.trim();

  if (trimmed.length === 0) {
    return null;
  }

  return trimmed;
}