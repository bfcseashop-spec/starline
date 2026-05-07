import { toast } from "@/components/ui/use-toast";

export function errMsg(err: unknown): string {
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = String((err as { message?: string }).message || "").trim();
    if (m) return m;
  }
  return "";
}

/** Standard admin error toast from API / thrown errors */
export function adminToastErr(err: unknown, fallback = "Something went wrong") {
  const m = errMsg(err);
  toast.error(m || fallback);
}

export function adminToastOk(message: string) {
  toast.success(message);
}
