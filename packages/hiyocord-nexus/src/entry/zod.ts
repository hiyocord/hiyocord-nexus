import { validator } from 'hono/validator';
import { z } from 'zod'

export const schemaForType = <T>() => <S extends z.ZodType<T, any, any>>(arg: S) => {
  return arg;
};


export const createValidator = (InputType: Parameters<typeof validator>[0], schema: z.ZodTypeAny) => {
  return validator(InputType, (v, c) => {
    const result = schema.safeParse(v);
    if (result.success) {
      return result.data;
    } else {
      return c.json({
        errors: result.error.issues.map(it => ({
          path: it.path,
          message: it.message,
        }))
      }, 400);
    }
  });
}
