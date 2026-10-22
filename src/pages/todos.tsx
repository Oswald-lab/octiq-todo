import { useState, useId } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Inbox, Search, X } from 'lucide-react';
import {
  getGetApiTodosQueryKey,
  useGetApiTodos,
  usePatchApiTodosReorder,
} from '../api/todos';
import type { TodoListResponse } from '../api/model';
import { Layout } from '../components/Layout';
import { AddTodoForm } from '../components/AddTodoForm';
import { TodoItem } from '../components/TodoItem';

export default function TodosPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useGetApiTodos({
    query: { staleTime: 30_000 },
  });

  const reorderTodos = usePatchApiTodosReorder({
    mutation: {
      onSettled: () => queryClient.invalidateQueries({ queryKey: getGetApiTodosQueryKey() }),
    },
  });

  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'dueDate'>('default');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const searchId = useId();
  const sortId = useId();
  const normalizedQuery = query.trim().toLowerCase();
  const todos = data?.data ?? [];
  const canReorder = sortBy === 'default' && normalizedQuery.length === 0;
  const filteredTodos = normalizedQuery
    ? todos.filter((todo) => todo.title.toLowerCase().includes(normalizedQuery))
    : todos;
  const visibleTodos =
    sortBy === 'dueDate'
      ? [...filteredTodos].sort((a, b) => {
          if (a.dueDate === null && b.dueDate === null) return 0;
          if (a.dueDate === null) return 1;
          if (b.dueDate === null) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        })
      : filteredTodos;

  function endDrag() {
    setDraggingId(null);
    setDragOverId(null);
  }

  function handleDrop(targetId: string) {
    if (!canReorder || draggingId === null || draggingId === targetId) {
      endDrag();
      return;
    }
    const ids = todos.map((todo) => todo.id);
    const fromIndex = ids.indexOf(draggingId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) {
      endDrag();
      return;
    }
    const nextIds = [...ids];
    nextIds.splice(fromIndex, 1);
    nextIds.splice(toIndex, 0, draggingId);
    queryClient.setQueryData<TodoListResponse>(getGetApiTodosQueryKey(), (previous) => {
      if (previous === undefined) return previous;
      const reordered = nextIds.flatMap((id) => {
        const todo = previous.data.find((item) => item.id === id);
        return todo === undefined ? [] : [todo];
      });
      return { data: reordered };
    });
    reorderTodos.mutate({ data: { ids: nextIds } });
    endDrag();
  }

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

          <div className="mt-10 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor={searchId} className="sr-only">
              Search todos
            </label>
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search todos"
                className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-opacity hover:bg-muted"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <label htmlFor={sortId} className="sr-only">
              Sort todos
            </label>
            <select
              id={sortId}
              value={sortBy}
              onChange={(event) => setSortBy(event.currentTarget.value === 'dueDate' ? 'dueDate' : 'default')}
              className="rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="default">Default order</option>
              <option value="dueDate">Due date (soonest)</option>
            </select>
          </div>

          <div className="mt-6">
            {isLoading ? (
              <TodoSkeleton />
            ) : error ? (
              <ErrorPanel onRetry={() => void refetch()} />
            ) : todos.length === 0 ? (
              <EmptyState />
            ) : visibleTodos.length === 0 ? (
              <NoMatches query={query} onClear={() => setQuery('')} />
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {visibleTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    draggable={canReorder}
                    isDragging={draggingId === todo.id}
                    isDragOver={dragOverId === todo.id && draggingId !== todo.id}
                    onDragStart={(id) => setDraggingId(id)}
                    onDragEnter={(id) => setDragOverId(id)}
                    onDragEnd={endDrag}
                    onDrop={handleDrop}
                  />
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

function NoMatches({ query, onClear }: { readonly query: string; readonly onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Search className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-xl font-semibold">No matching todos</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        Nothing matches “{query.trim()}” — try a different search.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-medium text-primary transition-opacity hover:bg-muted"
      >
        Clear search
      </button>
    </div>
  );
}
