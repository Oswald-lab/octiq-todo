import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/home';
import { recipeRoutes } from './recipes';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {recipeRoutes}
    </Routes>
  );
}
