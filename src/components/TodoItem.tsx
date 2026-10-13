import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { usePatchApiTodosId, useDeleteApiTodosId, getGetApiTodosQueryKey } from '../api/todos';
import type { TodoPublic } from '../api/model';
import { ConfirmDialog } from './ConfirmDialog';

type TodoItemProps = {
  readonly todo: TodoPublic;
};

/** One todo row: display, inline edit, and a confirmed delete. */
export function TodoItem({ todo }: TodoItemProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const updateTodo = usePatchApiTodosId({
    mutation: {
      onSettled: () => queryClient.invalidateQueries({ queryKey: getGetApiTodosQueryKey() }),
    },
  });

  const deleteTodo = useDeleteApiTodosId({
    mutation: {
      onSettled: () => queryClient.invalidateQueries({ queryKey: getGetApiTodosQueryKey() }),
    },
  });

  function startEdit() {
    setDraft(todo.title);
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(todo.title);
    setError(null);
  }

  function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      setError('A title is required.');
      return;
    }
    setError(null);
    updateTodo.mutate(
      { id: todo.id, data: { title: trimmed } },
      {
        onSuccess: () => setEditing(false),
        onError: () => setError('Could not save that todo. Please try again.'),
      },
    );
  }

  function confirmDelete() {
    deleteTodo.mutate({ id: todo.id });
    setConfirmOpen(false);
  }

  if (editing) {
    return (
      <li className="py-3">
        <form onSubmit={saveEdit} noValidate className="space-y-2">
          <label htmlFor={`todo-${todo.id}`} className="sr-only">
            Edit todo
          </label>
          <div className="flex gap-2">
            <input
              id={`todo-${todo.id}`}
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.currentTarget.value)}
              aria-invalid={!!error}
              aria-describedby={error ? `todo-${todo.id}-error` : undefined}
              className="input flex-1"
              autoFocus
            />
            <button
              type="submit"
              aria-label="Save todo"
              disabled={updateTodo.isPending}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-foreground transition-opacity hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Cancel editing"
              onClick={cancelEdit}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-foreground transition-opacity hover:bg-muted"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {error ? (
            <p id={`todo-${todo.id}-error`} role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <span className="block break-words text-foreground">{todo.title}</span>
        {todo.phone ? (
          <span className="mt-1 block font-mono text-xs text-muted-foreground">{todo.phone}</span>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={startEdit}
          aria-label={`Edit ${todo.title}`}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-opacity hover:bg-muted"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label={`Delete ${todo.title}`}
          disabled={deleteTodo.isPending}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-opacity hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {confirmOpen ? (
        <ConfirmDialog
          title="Delete this todo?"
          description="This cannot be undone."
          confirmLabel="Delete todo"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </li>
  );
}
