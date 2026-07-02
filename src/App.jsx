import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import JoinPage from './pages/JoinPage'
import CreateTripPage from './pages/CreateTripPage'
import TripPage from './pages/TripPage'
import HistoryPage from './pages/HistoryPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#FFFFFF',
              color:      '#1F231F',
              border:     '1px solid #E5E2D9',
              boxShadow:  '0 8px 24px rgba(31,35,31,0.10)',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize:   13,
              fontWeight: 500,
            },
            success: { iconTheme: { primary: '#1B6B4A', secondary: '#FFFFFF' } },
            error:   { iconTheme: { primary: '#BE4B3B', secondary: '#FFFFFF' } },
          }}
        />
        <Routes>
          <Route path="/"               element={<JoinPage />} />
          <Route path="/join"           element={<JoinPage />} />
          <Route path="/create"         element={<CreateTripPage />} />
          <Route path="/history"        element={<HistoryPage />} />
          <Route path="/trip/:tripCode" element={<TripPage />} />
          <Route path="*"               element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
