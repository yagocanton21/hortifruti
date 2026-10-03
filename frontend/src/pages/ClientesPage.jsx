import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ClienteModal from '../components/clientes/ClienteModal.jsx'
import ExtratoClienteModal from '../components/clientes/ExtratoClienteModal.jsx'
import ReceberFiadoModal from '../components/clientes/ReceberFiadoModal.jsx'
import {
  atualizarCliente,
  criarCliente,
  listarClientes,
  receberPagamentoFiado,
} from '../services/api.js'
import { moeda } from '../utils/formatters.js'

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [pesquisa, setPesquisa] = useState('')
  const [filtroDebito, setFiltroDebito] = useState('') // '' = todos, 'com_debito', 'em_dia'
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  // Modais
  const [modalClienteAberto, setModalClienteAberto] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [clienteRecebimento, setClienteRecebimento] = useState(null)
  const [clienteExtrato, setClienteExtrato] = useState(null)

  const carregarLista = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const data = await listarClientes({
        busca: pesquisa,
        apenasComDebito: filtroDebito === 'com_debito',
      })
      setClientes(data)
    } catch (err) {
      setErro(err.message || 'Erro ao carregar clientes')
    } finally {
      setCarregando(false)
    }
  }, [pesquisa, filtroDebito])

  useEffect(() => {
    carregarLista()
  }, [carregarLista])

  async function handleSalvarCliente(dados) {
    if (clienteEditando) {
      await atualizarCliente(clienteEditando.id, dados)
      setMensagemSucesso(`Cadastro de ${dados.nome} atualizado com sucesso!`)
    } else {
      await criarCliente(dados)
      setMensagemSucesso('Cliente cadastrado com sucesso!')
    }
    carregarLista()
  }

  async function handleConfirmarRecebimento(clienteId, valor, observacao) {
    const res = await receberPagamentoFiado(clienteId, valor, observacao)
    setMensagemSucesso(
      `Pagamento de ${moeda.format(valor)} registrado com sucesso! Novo saldo devedor: ${moeda.format(
        res.novo_saldo_devedor
      )}`
    )
    carregarLista()
  }

  const clientesExibidos = clientes.filter((c) => {
    if (filtroDebito === 'em_dia') return Number(c.saldo_devedor) <= 0.001
    return true
  })

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CADERNETA & CRÉDITO</span>
          <h1>Clientes e Fiado</h1>
          <p>Gerencie o limite de crédito, saldos em aberto e pagamentos de caderneta.</p>
        </div>
        <div className="heading-actions">
          <Link className="button secondary" to="/caixa" title="Ir para o Caixa">
            🛒 Caixa
          </Link>
          <button
            className="button primary"
            type="button"
            onClick={() => {
              setClienteEditando(null)
              setModalClienteAberto(true)
            }}
          >
            + Novo Cliente
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="filters-container">
          <form className="search-bar" onSubmit={(e) => { e.preventDefault(); carregarLista(); }}>
            <div className="search-input-box">
              <span className="search-icon">🔍</span>
              <input
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Buscar por nome, telefone ou CPF..."
              />
              {pesquisa && (
                <button type="button" className="clear-search-btn" onClick={() => setPesquisa('')}>
                  ✕
                </button>
              )}
            </div>
            <button className="button secondary" type="submit">
              Buscar
            </button>
          </form>

          <div className="quick-filters-row">
            <span className="filter-label">Filtros rápidos:</span>
            <div className="filter-chips-group">
              <button
                type="button"
                className={`filter-chip ${filtroDebito === '' ? 'active' : ''}`}
                onClick={() => setFiltroDebito('')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`filter-chip ${filtroDebito === 'com_debito' ? 'active' : ''}`}
                onClick={() => setFiltroDebito('com_debito')}
              >
                🔴 Com Dívida Pendente
              </button>
              <button
                type="button"
                className={`filter-chip ${filtroDebito === 'em_dia' ? 'active' : ''}`}
                onClick={() => setFiltroDebito('em_dia')}
              >
                🟢 Em Dia / Sem Dívida
              </button>
            </div>

            {(pesquisa || filtroDebito) && (
              <button
                type="button"
                className="text-button reset-filters"
                onClick={() => { setPesquisa(''); setFiltroDebito(''); }}
              >
                Limpar filtros
              </button>
            )}
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

        {carregando ? (
          <div className="empty-state">Carregando lista de clientes e saldos...</div>
        ) : clientesExibidos.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum cliente encontrado</strong>
            <span>Cadastre um novo cliente ou altere os filtros de busca.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contato / CPF</th>
                  <th>Limite de Crédito</th>
                  <th>Saldo Devedor</th>
                  <th>Disponível</th>
                  <th>Situação</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientesExibidos.map((c) => {
                  const saldoDevedor = Number(c.saldo_devedor || 0)
                  const limiteCredito = Number(c.limite_credito || 0)
                  const disponivel = Math.max(0, limiteCredito - saldoDevedor)
                  const temDebito = saldoDevedor > 0.009

                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.nome}</strong>
                        {c.observacao && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.observacao}</div>}
                      </td>
                      <td>
                        <div>{c.telefone || '—'}</div>
                        {c.cpf && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>CPF: {c.cpf}</div>}
                      </td>
                      <td>{moeda.format(limiteCredito)}</td>
                      <td>
                        <strong style={{ color: temDebito ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                          {moeda.format(saldoDevedor)}
                        </strong>
                      </td>
                      <td>
                        <span style={{ color: disponivel <= 0 ? '#dc2626' : '#047857' }}>
                          {moeda.format(disponivel)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${c.ativo ? 'active' : 'inactive'}`}>
                          {c.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="actions">
                        {temDebito && (
                          <button
                            type="button"
                            className="text-button"
                            style={{ color: '#047857', fontWeight: 600 }}
                            onClick={() => setClienteRecebimento(c)}
                            title="Receber pagamento deste cliente"
                          >
                            💵 Receber
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => setClienteExtrato(c)}
                          title="Ver extrato completo de compras e pagamentos"
                        >
                          📄 Extrato
                        </button>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            setClienteEditando(c)
                            setModalClienteAberto(true)
                          }}
                          title="Editar dados cadastrais e limite"
                        >
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modais Especializados */}
      {modalClienteAberto && (
        <ClienteModal
          cliente={clienteEditando}
          onClose={() => {
            setModalClienteAberto(false)
            setClienteEditando(null)
          }}
          onSave={handleSalvarCliente}
        />
      )}

      {clienteRecebimento && (
        <ReceberFiadoModal
          cliente={clienteRecebimento}
          onClose={() => setClienteRecebimento(null)}
          onConfirm={handleConfirmarRecebimento}
        />
      )}

      {clienteExtrato && (
        <ExtratoClienteModal
          cliente={clienteExtrato}
          onClose={() => setClienteExtrato(null)}
        />
      )}
    </main>
  )
}
