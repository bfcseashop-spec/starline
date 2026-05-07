import { toast } from "@/components/ui/use-toast";

type ApiError = { message?: string } | Error | null | undefined;

const getErrorMessage = (error: ApiError): string => error?.message ?? "Something went wrong.";

/**
 * Run an API-backed mutation (insert/update/delete) and show success or error toast.
 */
export async function withMutationToast<T>(
  operation: () => Promise<{ error: ApiError; data?: T }>,
  options: { successMessage?: string; errorMessage?: string } = {}
): Promise<boolean> {
  const { error } = await operation();
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
 * Same as mutation toast helper but only surfaces failures.
 */
export async function withErrorToast<T>(
  operation: () => Promise<{ error: ApiError; data?: T }>,
  errorMessage?: string
): Promise<boolean> {
  const result = await operation();
  if (result.error) {
    toast.error(errorMessage ?? getErrorMessage(result.error));
    return false;
  }
  return true;
}

export function getApiErrorMessage(error: ApiError, fallback = "Something went wrong."): string {
  if (!error) return fallback;
  return error.message || fallback;
}
