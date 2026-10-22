import { useId, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CheckCircle2, Inbox, Search, X } from 'lucide-react';
import {
  getGetApiTodosQueryKey,
  useGetApiTodos,
  usePatchApiTodosReorder,
} from '../api/todos';
import type { TodoListResponse } from '../api/model';
import { Layout } from '../components/Layout';
import { AddTodoForm } from '../components/AddTodoForm';
import { TodoItem } from '../components/TodoItem';
import { dueDateStatus } from '../lib/due-date';

type TodoFilter = 'all' | 'today' | 'overdue' | 'upcoming';

const FILTERS: ReadonlyArray<{ value: TodoFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Due today' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'upcoming', label: 'Upcoming' },
];

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
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [sortBy, setSortBy] = useState<'default' | 'dueDate'>('default');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const searchId = useId();
  const sortId = useId();
  const normalizedQuery = query.trim().toLowerCase();
  const todos = data?.data ?? [];

  const counts = useMemo(() => {
    let today = 0;
    let overdue = 0;
    let upcoming = 0;
    for (const todo of todos) {
      const status = dueDateStatus(todo.dueDate);
      if (status === 'today') today += 1;
      else if (status === 'overdue') overdue += 1;
      else if (status === 'upcoming') upcoming += 1;
    }
    return { all: todos.length, today, overdue, upcoming };
  }, [todos]);

  const canReorder =
    sortBy === 'default' && normalizedQuery.length === 0 && filter === 'all';
  const filteredTodos = normalizedQuery
    ? todos.filter((todo) => todo.title.toLowerCase().includes(normalizedQuery))
    : todos;
  const statusFiltered =
    filter === 'all'
      ? filteredTodos
      : filteredTodos.filter((todo) => dueDateStatus(todo.dueDate) === filter);
  const visibleTodos =
    sortBy === 'dueDate'
      ? [...statusFiltered].sort((a, b) => {
          if (a.dueDate === null && b.dueDate === null) return 0;
          if (a.dueDate === null) return 1;
          if (b.dueDate === null) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        })
      : statusFiltered;
  const hasFilters = normalizedQuery.length > 0 || filter !== 'all';

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

  function clearFilters() {
    setQuery('');
    setFilter('all');
  }

  return (
    <Layout>
      <section className="atmosphere">
        <div className="mx-auto flex w-full max-w-2xl flex-col py-16 sm:py-20 md:py-24">
          <header className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Today
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Your to-do list
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
              A calm place to keep track of what matters.
            </p>
          </header>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <SummaryCard
              label="Overdue"
              value={counts.overdue}
              tone={counts.overdue > 0 ? 'destructive' : 'muted'}
            />
            <SummaryCard
              label="Due today"
              value={counts.today}
              tone={counts.today > 0 ? 'primary' : 'muted'}
            />
            <SummaryCard label="Total" value={counts.all} tone="muted" />
          </div>

          <div className="mt-6">
            <AddTodoForm />
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                  className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
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
                onChange={(event) =>
                  setSortBy(event.currentTarget.value === 'dueDate' ? 'dueDate' : 'default')
                }
                className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="default">Default order</option>
                <option value="dueDate">Due date (soonest)</option>
              </select>
            </div>

            <div
              role="tablist"
              aria-label="Filter todos"
              className="flex flex-wrap gap-2"
            >
              {FILTERS.map((option) => {
                const active = filter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(option.value)}
                    className={
                      active
                        ? 'inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity'
                        : 'inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
                    }
                  >
                    {option.label}
                    <span className={active ? 'text-primary-foreground/80' : 'text-muted-foreground/70'}>
                      {counts[option.value]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            {isLoading ? (
              <TodoSkeleton />
            ) : error ? (
              <ErrorPanel onRetry={() => void refetch()} />
            ) : todos.length === 0 ? (
              <EmptyState />
            ) : visibleTodos.length === 0 ? (
              <NoMatches
                hasFilters={hasFilters}
                query={query}
                onClear={clearFilters}
              />
            ) : (
              <ul className="flex flex-col gap-3">
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

function SummaryCard({
  label,
  value,
  tone,
}: {
  readonly label: string;
  readonly value: number;
  readonly tone: 'primary' | 'destructive' | 'muted';
}) {
  const toneClass =
    tone === 'destructive'
      ? 'border-destructive/30 text-destructive'
      : tone === 'primary'
        ? 'border-primary/30 text-primary'
        : 'border-border text-muted-foreground';
  return (
    <div className={`rounded-xl border bg-card/70 px-4 py-3 text-left ${toneClass}`}>
      <span className="block text-2xl font-semibold tabular-nums text-foreground">{value}</span>
      <span className="mt-0.5 block text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
  );
}

function TodoSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card px-4 py-4">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function ErrorPanel({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-border bg-card px-6 py-12 text-center text-card-foreground"
    >
      <h2 className="text-lg font-semibold">Couldn't load your todos</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
        Something went wrong on our end. Please try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-xl font-semibold">No todos yet</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        Add your first task above to get started.
      </p>
      <button
        type="button"
        onClick={() => document.getElementById('new-todo')?.focus()}
        className="inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-medium text-primary transition-opacity hover:bg-muted"
      >
        Add your first todo
      </button>
    </div>
  );
}

function NoMatches({
  hasFilters,
  query,
  onClear,
}: {
  readonly hasFilters: boolean;
  readonly query: string;
  readonly onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
      {hasFilters && query.trim() ? (
        <Search className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      ) : hasFilters ? (
        <CalendarClock className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      )}
      <h2 className="text-xl font-semibold">
        {hasFilters && query.trim() ? 'No matching todos' : 'Nothing here'}
      </h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        {hasFilters && query.trim()
          ? `Nothing matches “${query.trim()}”. Try a different search or filter.`
          : 'No todos match this filter right now.'}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-medium text-primary transition-opacity hover:bg-muted"
      >
        Clear filters
      </button>
    </div>
  );
}
