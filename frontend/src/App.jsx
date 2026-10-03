import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import AppLayout from './components/AppLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProdutosPage from './pages/ProdutosPage.jsx'
import NovoProdutoPage from './pages/NovoProdutoPage.jsx'
import EditarProdutoPage from './pages/EditarProdutoPage.jsx'
import HistoricoPrecosPage from './pages/HistoricoPrecosPage.jsx'
import PesagemPage from './pages/PesagemPage.jsx'
import CaixaPage from './pages/CaixaPage.jsx'

import RelatorioVendasPage from './pages/RelatorioVendasPage.jsx'
import UsuariosPage from './pages/UsuariosPage.jsx'
import ClientesPage from './pages/ClientesPage.jsx'
import PromocoesPage from './pages/PromocoesPage.jsx'
import EstoquePage from './pages/EstoquePage.jsx'

function ProtectedRoute({ children, gerenteOnly = false }) {
  const { isAuthenticated, isGerente, carregando } = useAuth()

  if (carregando) {
    return <div className="load-message empty-state">Verificando credenciais...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (gerenteOnly && !isGerente) {
    return <Navigate to="/caixa" replace />
  }

  return children
}

function RotaInicial() {
  const { isAuthenticated, isGerente, carregando } = useAuth()

  if (carregando) {
    return <div className="load-message empty-state">Iniciando sistema...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return isGerente ? <Navigate to="/produtos" replace /> : <Navigate to="/caixa" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Rota Raiz Inteligente */}
      <Route path="/" element={<RotaInicial />} />

      {/* Frente de Caixa PDV (Acessível por Operador e Gerente) */}
      <Route
        path="/caixa"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CaixaPage />} />
      </Route>

      {/* Módulo de Gestão (Apenas Gerente) */}
      <Route
        element={
          <ProtectedRoute gerenteOnly>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/produtos" element={<ProdutosPage />} />
        <Route path="/produtos/novo" element={<NovoProdutoPage />} />
        <Route path="/produtos/:id/editar" element={<EditarProdutoPage />} />
        <Route path="/produtos/:id/historico-precos" element={<HistoricoPrecosPage />} />
        <Route path="/promocoes" element={<PromocoesPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/relatorios" element={<RelatorioVendasPage />} />
        <Route path="/estoque" element={<EstoquePage />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="/pesagem" element={<PesagemPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
