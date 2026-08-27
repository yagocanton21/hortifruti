import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { buscarProduto, listarHistoricoPrecos } from '../services/api.js'

const TAMANHO = 20
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dataHora = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function HistoricoPrecosPage() {
  const { id } = useParams()
  const [produto, setProduto] = useState(null)
  const [dados, setDados] = useState(null)
  const [pagina, setPagina] = useState(1)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true

    Promise.all([
      buscarProduto(id),
      listarHistoricoPrecos(id, { pagina, tamanho: TAMANHO }),
    ])
      .then(([produtoRecebido, historicoRecebido]) => {
        if (ativo) {
          setProduto(produtoRecebido)
          setDados(historicoRecebido)
        }
      })
      .catch((error) => {
        if (ativo) setErro(error.message)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => { ativo = false }
  }, [id, pagina])

  function mudarPagina(novaPagina) {
    setCarregando(true)
    setErro('')
    setPagina(novaPagina)
  }

  return (
    <main className="content narrow">
      <Link className="back-link" to={`/produtos/${id}/editar`}>← Voltar para edição</Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">AUDITORIA</span>
          <h1>Histórico de preços</h1>
          <p>{produto ? `${produto.codigo_interno} — ${produto.nome}` : 'Carregando produto...'}</p>
        </div>
      </div>

      <section className="panel history-panel full-history">
        {erro ? (
          <div className="alert error" role="alert">{erro}</div>
        ) : carregando ? (
          <div className="empty-state">Carregando histórico...</div>
        ) : dados?.itens.length ? (
          <>
            <div className="section-heading">
              <div><strong>{dados.total} alterações registradas</strong></div>
              <span className="history-count">Página {dados.pagina} de {dados.total_paginas}</span>
            </div>
            <ol className="price-history">
              {dados.itens.map((item, index) => (
                <li key={item.id}>
                  <span className="timeline-marker" aria-hidden="true" />
                  <div>
                    <strong>{moeda.format(Number(item.preco))}</strong>
                    <time dateTime={item.registrado_em}>{dataHora.format(new Date(item.registrado_em))}</time>
                  </div>
                  {pagina === 1 && index === 0 && <span className="current-price">Preço atual</span>}
                </li>
              ))}
            </ol>
            <div className="pagination">
              <button className="button ghost" type="button" disabled={pagina === 1} onClick={() => mudarPagina(pagina - 1)}>← Anterior</button>
              <span>Página {pagina} de {dados.total_paginas}</span>
              <button className="button ghost" type="button" disabled={pagina >= dados.total_paginas} onClick={() => mudarPagina(pagina + 1)}>Próxima →</button>
            </div>
          </>
        ) : (
          <div className="empty-state">Nenhum preço registrado.</div>
        )}
      </section>
    </main>
  )
}

export default HistoricoPrecosPage
