import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { TimerProvider } from './context/TimerContext.jsx';
import { router } from './routes/index.jsx';

export default function App() {
  return (
    <AuthProvider>
      <TimerProvider>
        <RouterProvider router={router} />
      </TimerProvider>
    </AuthProvider>
  );
}
