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
  const [titleError, setTitleError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
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

    setTitleError(validTitle ? null : 'A title is required.');
    setPhoneError(validPhone ? null : 'Enter a valid phone number.');
    if (!validTitle || !validPhone) return;

    createTodo.mutate(
      { data: { title: trimmedTitle, ...(trimmedPhone ? { phone: trimmedPhone } : {}) } },
      {
        onSuccess: () => {
          setTitle('');
          setPhone('');
        },
        onError: () => setTitleError('Could not add that todo. Please try again.'),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
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
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium text-foreground transition-opacity hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {createTodo.isPending ? 'Adding…' : 'Add'}
        </button>
      </div>
      {titleError ? (
        <p id="new-todo-error" role="alert" className="text-sm text-destructive">
          {titleError}
        </p>
      ) : null}

      <label htmlFor="new-todo-phone" className="sr-only">
        Phone (optional)
      </label>
      <input
        id="new-todo-phone"
        type="tel"
        value={phone}
        onChange={(event) => setPhone(event.currentTarget.value)}
        placeholder="Phone (optional)"
        autoComplete="tel"
        aria-invalid={!!phoneError}
        aria-describedby={phoneError ? 'new-todo-phone-error' : undefined}
        className="input"
      />
      {phoneError ? (
        <p id="new-todo-phone-error" role="alert" className="text-sm text-destructive">
          {phoneError}
        </p>
      ) : null}
    </form>
  );
}
