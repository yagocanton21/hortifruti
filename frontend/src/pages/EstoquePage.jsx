import { useCallback, useEffect, useState } from 'react'
import ConfigurarEstoqueModal from '../components/estoque/ConfigurarEstoqueModal.jsx'
import EstoqueFiltros from '../components/estoque/EstoqueFiltros.jsx'
import EstoqueKpiCards from '../components/estoque/EstoqueKpiCards.jsx'
import EstoqueTabela from '../components/estoque/EstoqueTabela.jsx'
import HistoricoEstoqueModal from '../components/estoque/HistoricoEstoqueModal.jsx'
import MovimentarEstoqueModal from '../components/estoque/MovimentarEstoqueModal.jsx'
import {
  atualizarConfiguracaoEstoque,
  listarEstoque,
  obterResumoEstoque,
  registrarMovimentacaoEstoque,
} from '../services/api.js'
import { pesoFmt } from '../utils/formatters.js'

export default function EstoquePage() {
  const [itens, setItens] = useState([])
  const [resumo, setResumo] = useState(null)
  const [pesquisa, setPesquisa] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('') // '' | 'baixo' | 'zerado'
  const [filtroUnidade, setFiltroUnidade] = useState('') // '' | 'KG' | 'UN'
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  // Modais
  const [modalMovimentarAberto, setModalMovimentarAberto] = useState(false)
  const [produtoMovimentando, setProdutoMovimentando] = useState(null)
  const [produtoHistorico, setProdutoHistorico] = useState(null)
  const [produtoConfig, setProdutoConfig] = useState(null)

  const carregarDados = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const [resumoData, listaData] = await Promise.all([
        obterResumoEstoque(),
        listarEstoque({
          busca: pesquisa,
          apenasBaixo: filtroStatus === 'baixo',
          apenasZerados: filtroStatus === 'zerado',
          unidadeVenda: filtroUnidade,
        }),
      ])
      setResumo(resumoData)
      setItens(listaData)
    } catch (err) {
      setErro(err.message || 'Erro ao carregar dados do estoque.')
    } finally {
      setCarregando(false)
    }
  }, [pesquisa, filtroStatus, filtroUnidade])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  async function handleConfirmarMovimentacao(dados) {
    const res = await registrarMovimentacaoEstoque(dados)
    const prod = itens.find((i) => i.id === dados.produto_id)
    const unidade = prod?.unidade_venda === 'KG' ? 'kg' : 'un'
    const formatQtd = prod?.unidade_venda === 'KG' ? pesoFmt.format(res.quantidade) : Number(res.quantidade)
    setMensagemSucesso(
      `Movimentação registrada com sucesso: ${res.tipo} de ${formatQtd} ${unidade}. Novo saldo: ${
        prod?.unidade_venda === 'KG' ? pesoFmt.format(res.estoque_posterior) : Number(res.estoque_posterior)
      } ${unidade}.`
    )
    carregarDados()
  }

  async function handleSalvarConfig(produtoId, dados) {
    await atualizarConfiguracaoEstoque(produtoId, dados)
    setMensagemSucesso('Parâmetros de estoque do produto atualizados com sucesso!')
    carregarDados()
  }

  function abrirMovimentacao(produto = null) {
    setProdutoMovimentando(produto)
    setModalMovimentarAberto(true)
  }

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CONTROLE DE MERCADORIAS</span>
          <h1>Estoque e Perdas</h1>
          <p>Monitore saldos físicos, compras, quebras/descartes de hortifruti e reposições.</p>
        </div>
        <div className="heading-actions">
          <button type="button" className="button secondary" onClick={carregarDados} title="Recarregar">
            🔄 Atualizar
          </button>
          <button type="button" className="button primary" onClick={() => abrirMovimentacao(null)}>
            + Movimentar Estoque
          </button>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="alert success" role="alert" style={{ marginBottom: '1rem' }}>
          <span>{mensagemSucesso}</span>
          <button
            type="button"
            className="text-button"
            style={{ marginLeft: 'auto', fontWeight: 'bold' }}
            onClick={() => setMensagemSucesso('')}
          >
            ✕
          </button>
        </div>
      )}

      {erro && <div className="alert error" role="alert" style={{ marginBottom: '1rem' }}>{erro}</div>}

      <EstoqueKpiCards resumo={resumo} />

      <section className="panel">
        <EstoqueFiltros
          pesquisa={pesquisa}
          setPesquisa={setPesquisa}
          filtroStatus={filtroStatus}
          setFiltroStatus={setFiltroStatus}
          filtroUnidade={filtroUnidade}
          setFiltroUnidade={setFiltroUnidade}
          onBuscar={(e) => { e.preventDefault(); carregarDados(); }}
          onLimpar={() => { setPesquisa(''); setFiltroStatus(''); setFiltroUnidade(''); }}
        />

        <EstoqueTabela
          itens={itens}
          carregando={carregando}
          onMovimentar={abrirMovimentacao}
          onHistorico={setProdutoHistorico}
          onConfig={setProdutoConfig}
        />
      </section>

      {modalMovimentarAberto && (
        <MovimentarEstoqueModal
          produtos={itens}
          produtoInicial={produtoMovimentando}
          onClose={() => {
            setModalMovimentarAberto(false)
            setProdutoMovimentando(null)
          }}
          onConfirm={handleConfirmarMovimentacao}
        />
      )}

      {produtoHistorico && (
        <HistoricoEstoqueModal
          produto={produtoHistorico}
          onClose={() => setProdutoHistorico(null)}
        />
      )}

      {produtoConfig && (
        <ConfigurarEstoqueModal
          produto={produtoConfig}
          onClose={() => setProdutoConfig(null)}
          onConfirm={handleSalvarConfig}
        />
      )}
    </main>
  )
}
