import { toast } from "@/components/ui/use-toast";

type DbError = { message?: string } | Error | null | undefined;

const getErrorMessage = (error: DbError): string =>
  error?.message ?? "Something went wrong.";

/**
 * Run a Supabase mutation (insert/update/delete) and show success or error toast.
 * Returns true if successful, false otherwise.
 */
export async function withMutationToast<T>(
  operation: () => Promise<{ error: DbError; data?: T }>,
  options: { successMessage?: string; errorMessage?: string } = {}
): Promise<boolean> {
  const { data, error } = await operation();
  if (error) {
    toast.error(options.errorMessage ?? getErrorMessage(error));
    return false;
  }
  if (options.successMessage) {
    toast.success(options.successMessage);
  }
  return true;
}

/**
 * Run an async action and show error toast on failure. Does not show success toast.
 * Returns true if no error, false otherwise.
 */
export async function withErrorToast<T>(
  operation: () => Promise<{ error: DbError; data?: T }>,
  errorMessage?: string
): Promise<boolean> {
  const result = await operation();
  const err = result.error;
  if (err) {
    toast.error(errorMessage ?? getErrorMessage(err));
    return false;
  }
  return true;
}

/**
 * Extract user-friendly message from Supabase or Edge function response.
 */
export function getSupabaseErrorMessage(
  error: DbError,
  fallback = "Something went wrong."
): string {
  if (!error) return fallback;
  return error.message || fallback;
}
