import { Link, useNavigate } from 'react-router-dom'
import ProdutoForm from '../components/ProdutoForm.jsx'
import { criarProduto } from '../services/api.js'

const INICIAL = {
  codigo_interno: '',
  nome: '',
  unidade_venda: 'KG',
  preco_atual: '',
  ativo: true,
}

function NovoProdutoPage() {
  const navigate = useNavigate()

  async function salvar(produto) {
    await criarProduto(produto)
    navigate('/produtos', { replace: true })
  }

  return (
    <main className="content narrow">
        <Link className="back-link" to="/produtos">← Voltar para produtos</Link>
        <div className="page-heading">
          <div>
            <span className="eyebrow">CADASTRO</span>
            <h1>Novo produto</h1>
            <p>Informe os dados usados na identificação e na venda.</p>
          </div>
        </div>
        <ProdutoForm valoresIniciais={INICIAL} aoSalvar={salvar} textoBotao="Cadastrar produto" />
    </main>
  )
}

export default NovoProdutoPage
