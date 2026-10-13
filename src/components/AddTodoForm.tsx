import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { usePostApiTodos, getGetApiTodosQueryKey } from '../api/todos';

/**
 * Create form. Owns its title state so it can clear the field on success and
 * surface the empty-title validation inline.
 */
export function AddTodoForm() {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const createTodo = usePostApiTodos({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetApiTodosQueryKey() }),
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('A title is required.');
      return;
    }
    setError(null);
    createTodo.mutate(
      { data: { title: trimmed } },
      {
        onSuccess: () => setTitle(''),
        onError: () => setError('Could not add that todo. Please try again.'),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-2">
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
          aria-invalid={!!error}
          aria-describedby={error ? 'new-todo-error' : undefined}
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
      {error ? (
        <p id="new-todo-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
