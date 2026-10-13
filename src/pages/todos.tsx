import { Inbox } from 'lucide-react';
import { useGetApiTodos } from '../api/todos';
import { Layout } from '../components/Layout';
import { AddTodoForm } from '../components/AddTodoForm';
import { TodoItem } from '../components/TodoItem';

export default function TodosPage() {
  const { data, isLoading, error, refetch } = useGetApiTodos({
    query: { staleTime: 30_000 },
  });

  const todos = data?.data ?? [];

  return (
    <Layout>
      <section className="atmosphere">
        <div className="mx-auto flex w-full max-w-xl flex-col py-20 sm:py-28 md:py-32">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Quietly</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Your todos
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">One thing at a time.</p>

          <div className="mt-12">
            <AddTodoForm />
          </div>

          <div className="mt-10">
            {isLoading ? (
              <TodoSkeleton />
            ) : error ? (
              <ErrorPanel onRetry={() => void refetch()} />
            ) : todos.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {todos.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function TodoSkeleton() {
  return (
    <div aria-hidden="true" className="border-t border-border">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="border-b border-border py-4">
          <div className="h-5 w-full max-w-xs animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function ErrorPanel({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-md border border-border bg-card px-6 py-12 text-center text-card-foreground">
      <h2 className="text-lg font-semibold">Couldn't load your todos</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
        Something went wrong on our end. Please try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-xl font-semibold">No todos yet</h2>
      <p className="max-w-xs text-sm text-muted-foreground">Add your first todo above to begin.</p>
      <button
        type="button"
        onClick={() => document.getElementById('new-todo')?.focus()}
        className="inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-medium text-primary transition-opacity hover:bg-muted"
      >
        Add your first todo
      </button>
    </div>
  );
}
