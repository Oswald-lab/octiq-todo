import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { usePostApiTodos, getGetApiTodosQueryKey } from '../api/todos';

const PHONE_PATTERN = /^\+?[1-9][0-9]{6,14}$/;

/**
 * Create form. Owns its title and optional phone state so it can clear fields
 * on success and surface validation inline.
 */
export function AddTodoForm() {
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [dueDateError, setDueDateError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const createTodo = usePostApiTodos({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetApiTodosQueryKey() }),
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedPhone = phone.trim();

    const validTitle = trimmedTitle.length > 0;
    const validPhone = trimmedPhone.length === 0 || PHONE_PATTERN.test(trimmedPhone);
    const validDueDate = dueDate.length === 0 || /^\d{4}-\d{2}-\d{2}$/.test(dueDate);

    setTitleError(validTitle ? null : 'A title is required.');
    setPhoneError(validPhone ? null : 'Enter a valid phone number.');
    setDueDateError(validDueDate ? null : 'Enter a valid due date.');
    if (!validTitle || !validPhone || !validDueDate) return;

    createTodo.mutate(
      {
        data: {
          title: trimmedTitle,
          ...(trimmedPhone ? { phone: trimmedPhone } : {}),
          ...(dueDate ? { dueDate } : {}),
        },
      },
      {
        onSuccess: () => {
          setTitle('');
          setPhone('');
          setDueDate('');
        },
        onError: () => setTitleError('Could not add that todo. Please try again.'),
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">New task</h2>
        <span className="text-xs text-muted-foreground">Press Add to save</span>
      </div>

      <label htmlFor="new-todo" className="sr-only">
        New todo
      </label>
      <div className="flex gap-2">
        <input
          id="new-todo"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          placeholder="What needs doing?"
          autoComplete="off"
          aria-invalid={!!titleError}
          aria-describedby={titleError ? 'new-todo-error' : undefined}
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={createTodo.isPending}
          aria-busy={createTodo.isPending}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {createTodo.isPending ? 'Adding…' : 'Add'}
        </button>
      </div>
      {titleError ? (
        <p id="new-todo-error" role="alert" className="mt-2 text-sm text-destructive">
          {titleError}
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="new-todo-phone" className="mb-1 block text-xs font-medium text-muted-foreground">
            Phone (optional)
          </label>
          <input
            id="new-todo-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.currentTarget.value)}
            placeholder="+1 555 010 0100"
            autoComplete="tel"
            aria-invalid={!!phoneError}
            aria-describedby={phoneError ? 'new-todo-phone-error' : undefined}
            className="input"
          />
          {phoneError ? (
            <p id="new-todo-phone-error" role="alert" className="mt-1 text-sm text-destructive">
              {phoneError}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="new-todo-due-date" className="mb-1 block text-xs font-medium text-muted-foreground">
            Due date (optional)
          </label>
          <input
            id="new-todo-due-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.currentTarget.value)}
            aria-invalid={!!dueDateError}
            aria-describedby={dueDateError ? 'new-todo-due-date-error' : undefined}
            className="input"
          />
          {dueDateError ? (
            <p id="new-todo-due-date-error" role="alert" className="mt-1 text-sm text-destructive">
              {dueDateError}
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
