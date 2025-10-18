import z from 'zod';

export function prettyZodError(e: z.ZodError): string {
  const i = e.issues[0];
  if (!i) return 'Некорректное значение';
  return i.message;
}
