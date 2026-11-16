import type { FormInstance } from "antd";

/**
 * Shows the server's field errors on an antd form and clears errors left on
 * other fields by an earlier submit. Returns true if any field got an error.
 */
export function applyFieldErrors(
  form: FormInstance,
  fieldErrors: Partial<Record<string, string>> | undefined,
): boolean {
  const names = Object.keys(form.getFieldsValue(true) as object);
  form.setFields(
    names.map((name) => {
      const error = fieldErrors?.[name];
      return { name, errors: error ? [error] : [] };
    }),
  );
  return names.some((name) => fieldErrors?.[name]);
}

/**
 * `onValuesChange` handler that hides a field's server error once its value
 * changes. Server errors aren't tied to a validation rule, so antd would
 * otherwise keep showing them after the member fixes the field.
 */
export function clearErrorsOnChange(form: FormInstance) {
  return (changed: object) =>
    form.setFields(Object.keys(changed).map((name) => ({ name, errors: [] })));
}
