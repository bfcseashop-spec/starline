# Starline UI & Error Patterns

## Confirmation dialogs

Use the shared **ConfirmDialog** for any destructive or important confirmation (delete, role change, etc.). Do not use `window.confirm()`.

```tsx
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

// State: what is being confirmed (e.g. item to delete)
const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
const [deleteLoading, setDeleteLoading] = useState(false);

// Open dialog
const handleDeleteClick = (item: Item) => setDeleteTarget(item);

// On confirm: run async action, then clear target and refresh
const handleConfirmDelete = async () => {
  if (!deleteTarget) return;
  setDeleteLoading(true);
  const { error } = await supabase.from("table").delete().eq("id", deleteTarget.id);
  setDeleteLoading(false);
  if (error) {
    toast.error(error.message);
    return;
  }
  toast.success("Deleted");
  setDeleteTarget(null);
  refetch();
};

// In JSX
<ConfirmDialog
  open={!!deleteTarget}
  onOpenChange={(open) => { if (!open && !deleteLoading) setDeleteTarget(null); }}
  title="Delete this item?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  cancelLabel="Cancel"
  confirmVariant="destructive"
  loading={deleteLoading}
  onConfirm={handleConfirmDelete}
/>
```

## Toasts

Use the app’s single toast API from `@/components/ui/use-toast`:

- `toast.success("Message")` — success feedback
- `toast.error("Message")` — errors (uses destructive variant)
- `toast({ title, description, variant: "destructive" })` — custom toasts

## Supabase helpers

In `@/lib/supabase-helpers`:

- **withMutationToast(operation, { successMessage?, errorMessage? })**  
  Runs a Supabase mutation (returns `{ data, error }`), shows error toast on failure and optional success toast on success. Returns `true`/`false`.

- **withErrorToast(operation, errorMessage?)**  
  Runs an operation, shows error toast on failure only. Returns `true`/`false`.

- **getSupabaseErrorMessage(error, fallback?)**  
  Returns a user-facing string from a Postgrest/Error.

Use these in new code for consistent error handling; existing components can be refactored gradually.

## Loading and error states

- **Loading:** Show a centered spinner (e.g. `<Loader2 className="animate-spin ..." />`) and optional “Loading...” text.
- **Empty:** Show an icon, heading, and short description (e.g. “No projects yet”, “Your items will appear here”).
- **Error:** Show an error message and a **Retry** (or “Try again”) button that re-runs the fetch. Use `border-destructive/50` and `bg-destructive/10` for the error block.

Always handle `error` from Supabase calls and set local error state so the UI can show the message and retry.

## Theme

The app uses **next-themes** with `storageKey="starline-theme"`. Theme is persisted across reloads. Use `useTheme()` for the header toggle; avoid toggling `document.documentElement.classList` directly.

---

These patterns can be reused in other apps (e.g. primepos): add ConfirmDialog (or equivalent), a single toast API, optional Supabase helpers, and consistent loading/empty/error states.
