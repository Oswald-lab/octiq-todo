import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, Check, GripVertical, Pencil, Trash2, X } from 'lucide-react';
import { usePatchApiTodosId, useDeleteApiTodosId, getGetApiTodosQueryKey } from '../api/todos';
import type { TodoPublic } from '../api/model';
import { ConfirmDialog } from './ConfirmDialog';
import { dueDateStatus, formatDueDate } from '../lib/due-date';

type TodoItemProps = {
  readonly todo: TodoPublic;
  readonly draggable?: boolean;
  readonly isDragging?: boolean;
  readonly isDragOver?: boolean;
  readonly onDragStart?: (id: string) => void;
  readonly onDragEnter?: (id: string) => void;
  readonly onDragEnd?: () => void;
  readonly onDrop?: (id: string) => void;
};

/** One todo row: display, inline edit, drag reordering, and a confirmed delete. */
export function TodoItem({
  todo,
  draggable = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
}: TodoItemProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const [draftDueDate, setDraftDueDate] = useState(todo.dueDate ?? '');
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
    setDraftDueDate(todo.dueDate ?? '');
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(todo.title);
    setDraftDueDate(todo.dueDate ?? '');
    setError(null);
  }

  function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      setError('A title is required.');
      return;
    }
    const nextDueDate = draftDueDate.length > 0 ? draftDueDate : null;
    if (nextDueDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(nextDueDate)) {
      setError('Enter a valid due date.');
      return;
    }

    const changes: { title?: string; dueDate?: string | null } = {};
    if (trimmed !== todo.title) {
      changes.title = trimmed;
    }
    if (nextDueDate !== todo.dueDate) {
      changes.dueDate = nextDueDate;
    }

    if (changes.title === undefined && changes.dueDate === undefined) {
      setEditing(false);
      return;
    }

    setError(null);
    updateTodo.mutate(
      { id: todo.id, data: changes },
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
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor={`todo-${todo.id}-due-date`} className="mb-1 block text-sm text-muted-foreground">
                Due date (optional)
              </label>
              <input
                id={`todo-${todo.id}-due-date`}
                type="date"
                value={draftDueDate}
                onChange={(event) => setDraftDueDate(event.currentTarget.value)}
                className="input w-full"
              />
            </div>
            {draftDueDate ? (
              <button
                type="button"
                onClick={() => setDraftDueDate('')}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-md px-3 text-sm text-muted-foreground transition-opacity hover:bg-muted"
              >
                Clear
              </button>
            ) : null}
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

  const status = dueDateStatus(todo.dueDate);

  return (
    <li
      className={`group flex items-center justify-between gap-4 py-3${
        isDragging ? ' opacity-50' : ''
      }${isDragOver ? ' bg-muted/50' : ''}`}
      draggable={draggable}
      onDragStart={
        draggable
          ? (event) => {
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', todo.id);
              onDragStart?.(todo.id);
            }
          : undefined
      }
      onDragOver={
        draggable
          ? (event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }
          : undefined
      }
      onDragEnter={draggable ? () => onDragEnter?.(todo.id) : undefined}
      onDrop={
        draggable
          ? (event) => {
              event.preventDefault();
              onDrop?.(todo.id);
            }
          : undefined
      }
      onDragEnd={draggable ? () => onDragEnd?.() : undefined}
    >
      {draggable ? (
        <span
          aria-hidden="true"
          className="shrink-0 cursor-grab text-muted-foreground transition-colors group-hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <span className="block break-words text-foreground">{todo.title}</span>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          {todo.phone ? (
            <span className="block font-mono text-xs text-muted-foreground">{todo.phone}</span>
          ) : null}
          {todo.dueDate ? (
            <span
              className={
                status === 'overdue'
                  ? 'inline-flex items-center gap-1 text-xs font-medium text-destructive'
                  : status === 'today'
                    ? 'inline-flex items-center gap-1 text-xs font-medium text-foreground'
                    : 'inline-flex items-center gap-1 text-xs text-muted-foreground'
              }
            >
              {status === 'overdue' ? (
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {status === 'overdue'
                ? `Overdue — ${formatDueDate(todo.dueDate)}`
                : status === 'today'
                  ? `Due today — ${formatDueDate(todo.dueDate)}`
                  : `Due ${formatDueDate(todo.dueDate)}`}
            </span>
          ) : null}
        </div>
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
