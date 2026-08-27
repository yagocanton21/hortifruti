import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import ProdutosPage from './pages/ProdutosPage.jsx'
import NovoProdutoPage from './pages/NovoProdutoPage.jsx'
import EditarProdutoPage from './pages/EditarProdutoPage.jsx'
import HistoricoPrecosPage from './pages/HistoricoPrecosPage.jsx'
import PesagemPage from './pages/PesagemPage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/produtos" replace />} />
        <Route path="/produtos" element={<ProdutosPage />} />
        <Route path="/produtos/novo" element={<NovoProdutoPage />} />
        <Route path="/produtos/:id/editar" element={<EditarProdutoPage />} />
        <Route path="/produtos/:id/historico-precos" element={<HistoricoPrecosPage />} />
        <Route path="/pesagem" element={<PesagemPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/produtos" replace />} />
    </Routes>
  )
}

export default App
