import { Navigate, Routes, Route } from 'react-router-dom';
import { recipeRoutes } from './recipes';
import { RequireAuth } from './recipes/email-password-auth/pages';
import TodosPage from './pages/todos';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/todos" replace />} />
      <Route
        path="/todos"
        element={
          <RequireAuth>
            <TodosPage />
          </RequireAuth>
        }
      />
      {recipeRoutes}
    </Routes>
  );
}
