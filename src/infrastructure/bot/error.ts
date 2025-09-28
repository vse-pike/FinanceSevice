import { BusinessException } from '@/shared/business-exception.js';
import { ValidationException } from '@/shared/validation-exception.js';

export function getErrorMessage(err: unknown) {
  if ((err instanceof BusinessException || err instanceof ValidationException) && err.message)
    return err.message;
  if (typeof err === 'string') return err;
  return 'Произошла ошибка. Попробуй ещё раз.';
}
