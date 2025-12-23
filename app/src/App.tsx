import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import CadastroPage from './pages/auth/CadastroPage'
import { useAuth } from './contexts/AuthContext'

function App() {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      
      {/* Redirecionar raiz */}
      <Route path="/" element={
        isAuthenticated ? (
          user?.type === 'admin' 
            ? <Navigate to="/admin" replace /> 
            : <Navigate to={`/${user?.tenantId}/dashboard`} replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* TODO: Rotas admin */}
      <Route path="/admin/*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Painel Admin</h1>
            <p className="text-gray-600 mt-2">Em desenvolvimento...</p>
          </div>
        </div>
      } />

      {/* TODO: Rotas tenant */}
      <Route path="/:tenantId/*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard ERP</h1>
            <p className="text-gray-600 mt-2">Em desenvolvimento...</p>
          </div>
        </div>
      } />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
