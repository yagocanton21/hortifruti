import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProdutoForm from '../components/ProdutoForm.jsx'
import {
  buscarProduto,
  listarHistoricoPrecos,
  substituirProduto,
} from '../services/api.js'

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dataHora = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function EditarProdutoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [produto, setProduto] = useState(null)
  const [historico, setHistorico] = useState([])
  const [totalHistorico, setTotalHistorico] = useState(0)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    Promise.all([buscarProduto(id), listarHistoricoPrecos(id, { tamanho: 5 })])
      .then(([dados, precos]) => {
        if (ativo) {
          setProduto({
            codigo_interno: dados.codigo_interno,
            nome: dados.nome,
            unidade_venda: dados.unidade_venda,
            preco_atual: dados.preco_atual,
            ativo: dados.ativo,
          })
          setHistorico(precos.itens)
          setTotalHistorico(precos.total)
        }
      })
      .catch((error) => {
        if (ativo) setErro(error.message)
      })
    return () => { ativo = false }
  }, [id])

  async function salvar(dados) {
    await substituirProduto(id, dados)
    navigate('/produtos', { replace: true })
  }

  return (
    <main className="content narrow">
        <Link className="back-link" to="/produtos">← Voltar para produtos</Link>
        <div className="page-heading">
          <div>
            <span className="eyebrow">EDIÇÃO</span>
            <h1>Editar produto</h1>
            <p>Atualize os dados usados na identificação e na venda.</p>
          </div>
        </div>

        {erro ? (
          <div className="panel load-message">
            <div className="alert error" role="alert">{erro}</div>
            <Link className="button ghost" to="/produtos">Voltar para a listagem</Link>
          </div>
        ) : produto ? (
          <>
            <ProdutoForm valoresIniciais={produto} aoSalvar={salvar} textoBotao="Salvar alterações" />
            <section className="panel history-panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">AUDITORIA</span>
                  <h2>Histórico de preços</h2>
                </div>
                <span className="history-count">
                  {totalHistorico} {totalHistorico === 1 ? 'registro' : 'registros'}
                </span>
              </div>

              {historico.length === 0 ? (
                <div className="empty-state compact">Nenhum preço registrado.</div>
              ) : (
                <ol className="price-history">
                  {historico.map((item, index) => (
                    <li key={item.id}>
                      <span className="timeline-marker" aria-hidden="true" />
                      <div>
                        <strong>{moeda.format(Number(item.preco))}</strong>
                        <time dateTime={item.registrado_em}>{dataHora.format(new Date(item.registrado_em))}</time>
                      </div>
                      {index === 0 && <span className="current-price">Preço atual</span>}
                    </li>
                  ))}
                </ol>
              )}
              {totalHistorico > 0 && (
                <div className="history-footer">
                  <span>Mostrando os {Math.min(5, totalHistorico)} registros mais recentes.</span>
                  <Link className="button ghost" to={`/produtos/${id}/historico-precos`}>
                    Ver histórico completo
                  </Link>
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="panel empty-state">Carregando produto...</div>
        )}
    </main>
  )
}

export default EditarProdutoPage
