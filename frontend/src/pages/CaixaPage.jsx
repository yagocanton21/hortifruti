import { useCallback, useEffect, useRef, useState } from 'react'
import BuscaProdutosModal from '../components/caixa/BuscaProdutosModal.jsx'
import CaixaAberturaCard from '../components/caixa/CaixaAberturaCard.jsx'
import CaixaHeader from '../components/caixa/CaixaHeader.jsx'
import CarrinhoTabela from '../components/caixa/CarrinhoTabela.jsx'
import FechamentoCaixaModal from '../components/caixa/FechamentoCaixaModal.jsx'
import MovimentacaoModal from '../components/caixa/MovimentacaoModal.jsx'
import PagamentoModal from '../components/caixa/PagamentoModal.jsx'
import PainelTotais from '../components/caixa/PainelTotais.jsx'
import PesoManualModal from '../components/caixa/PesoManualModal.jsx'
import ReciboModal from '../components/caixa/ReciboModal.jsx'
import RelatorioFechamentoView from '../components/caixa/RelatorioFechamentoView.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  abrirCaixa,
  fecharCaixa,
  listarClientes,
  listarProdutos,
  listarPromocoes,
  obterStatusCaixa,
  registrarMovimentacaoCaixa,
  registrarVenda,
} from '../services/api.js'

export default function CaixaPage() {
  const { usuario, logout } = useAuth()

  // Dados do Catálogo e Negócio
  const [produtosCatalogo, setProdutosCatalogo] = useState([])
  const [promocoesAtivas, setPromocoesAtivas] = useState([])
  const [clientesFiado, setClientesFiado] = useState([])

  // Estado da Venda Atual
  const [carrinho, setCarrinho] = useState([])
  const [codigoInput, setCodigoInput] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' })

  // Estado do Caixa / Turno
  const [caixaStatus, setCaixaStatus] = useState(null)
  const [carregandoCaixa, setCarregandoCaixa] = useState(true)
  const [relatorioFechamento, setRelatorioFechamento] = useState(null)

  // Modais
  const [modalBuscaAberto, setModalBuscaAberto] = useState(false)
  const [modalPesoAberto, setModalPesoAberto] = useState(false)
  const [produtoPendentePeso, setProdutoPendentePeso] = useState(null)
  const [modalMovAberto, setModalMovAberto] = useState(false)
  const [modalFecharAberto, setModalFecharAberto] = useState(false)
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false)
  const [vendaConcluida, setVendaConcluida] = useState(null)

  const inputCodigoRef = useRef(null)

  // Carrega status do caixa
  const carregarStatusCaixa = useCallback(async () => {
    try {
      const data = await obterStatusCaixa()
      setCaixaStatus(data)
    } catch (err) {
      console.error('Erro ao verificar caixa:', err)
    } finally {
      setCarregandoCaixa(false)
    }
  }, [])

  useEffect(() => {
    carregarStatusCaixa()
  }, [carregarStatusCaixa])

  // Carrega catálogo de produtos, promoções ativas e clientes
  useEffect(() => {
    listarProdutos({ ativo: 'true' })
      .then((dados) => {
        const lista = Array.isArray(dados) ? dados : (dados.itens ?? [])
        setProdutosCatalogo(lista)
      })
      .catch((err) => {
        setMensagem({ tipo: 'erro', texto: `Falha ao carregar produtos: ${err.message}` })
      })

    listarPromocoes({ apenasAtivas: true })
      .then((dados) => setPromocoesAtivas(dados || []))
      .catch(() => {})

    listarClientes({ apenasAtivos: true })
      .then((dados) => setClientesFiado(dados || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (caixaStatus?.aberto) {
      inputCodigoRef.current?.focus()
    }
  }, [caixaStatus?.aberto])

  // Totais calculados
  const subtotal = carrinho.reduce((acc, item) => acc + item.subtotal, 0)
  const total = subtotal // Desconto aplicado no modal de pagamento

  // Atalhos Globais
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'F3') {
        e.preventDefault()
        setModalBuscaAberto(true)
      } else if (e.key === 'F10') {
        e.preventDefault()
        if (caixaStatus?.aberto && carrinho.length > 0 && !modalPagamentoAberto) {
          setModalPagamentoAberto(true)
        }
      } else if (e.key === 'Escape') {
        if (modalBuscaAberto) setModalBuscaAberto(false)
        if (modalPesoAberto) setModalPesoAberto(false)
        if (modalMovAberto) setModalMovAberto(false)
        if (modalFecharAberto) setModalFecharAberto(false)
        if (modalPagamentoAberto && !vendaConcluida) setModalPagamentoAberto(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [caixaStatus?.aberto, carrinho.length, modalPagamentoAberto, modalBuscaAberto, modalPesoAberto, modalMovAberto, modalFecharAberto, vendaConcluida])

  // Utilitário de Promoção
  function obterInfoPreco(produto) {
    const agora = new Date()
    const promo = promocoesAtivas.find((p) => {
      if (p.produto_id !== produto.id || !p.ativa) return false
      if (p.data_inicio && new Date(p.data_inicio) > agora) return false
      if (p.data_fim && new Date(p.data_fim) < agora) return false
      return true
    })
    if (promo) {
      return {
        preco: Number(promo.preco_promocional),
        isPromo: true,
        tituloPromo: promo.titulo || 'Oferta',
        precoOriginal: Number(produto.preco_atual),
      }
    }
    return {
      preco: Number(produto.preco_atual),
      isPromo: false,
      tituloPromo: null,
      precoOriginal: Number(produto.preco_atual),
    }
  }

  // Parser de balança etiquetadora EAN-13 (iniciado em 2)
  const decodificarCodigoBalanca = useCallback((codigo) => {
    if (codigo.length !== 13 || !codigo.startsWith('2')) return null

    for (const produto of produtosCatalogo) {
      const codInt = produto.codigo_interno.replace(/\D/g, '')
      if (!codInt) continue

      const pedaco4 = codigo.slice(1, 5)
      const pedaco5 = codigo.slice(1, 6)
      const bate4 = codInt.padStart(4, '0') === pedaco4 || codInt === pedaco4
      const bate5 = codInt.padStart(5, '0') === pedaco5 || codInt === pedaco5

      if (bate4 || bate5) {
        const valorCentavosStr = bate4 ? codigo.slice(5, 11) : codigo.slice(6, 11)
        const valorTotal = parseInt(valorCentavosStr, 10) / 100
        const precoKg = Number(produto.preco_atual)
        const pesoCalculado = precoKg > 0 ? valorTotal / precoKg : 0

        return {
          produto,
          quantidade_ou_peso: pesoCalculado > 0 ? Number(pesoCalculado.toFixed(3)) : 1,
          preco_unitario: precoKg,
          subtotal: valorTotal,
          origem: 'balanca',
        }
      }
    }
    return null
  }, [produtosCatalogo])

  function adicionarItem(produto, qtdOuPeso, subtotalCustom = null) {
    const { preco: unitario, isPromo, tituloPromo, precoOriginal } = obterInfoPreco(produto)
    const sub = subtotalCustom !== null ? subtotalCustom : Number((qtdOuPeso * unitario).toFixed(2))

    const novoItem = {
      idTemp: Date.now() + Math.random(),
      produto_id: produto.id,
      codigo_interno: produto.codigo_interno,
      nome: produto.nome,
      unidade_venda: produto.unidade_venda,
      quantidade_ou_peso: qtdOuPeso,
      preco_unitario: unitario,
      isPromo,
      tituloPromo,
      precoOriginal,
      subtotal: sub,
    }

    setCarrinho((antigo) => [novoItem, ...antigo])
    setMensagem({
      tipo: 'sucesso',
      texto: isPromo ? `🔥 Oferta aplicada (${tituloPromo}): ${produto.nome}` : `Adicionado: ${produto.nome}`,
    })
  }

  function processarEntradaCodigo(e) {
    e.preventDefault()
    const raw = codigoInput.trim()
    if (!raw) return
    setMensagem({ tipo: '', texto: '' })

    const produtoExato = produtosCatalogo.find((p) => p.codigo_interno.toLowerCase() === raw.toLowerCase())
    const matchApenasMultiplicador = raw.match(/^(\d+(?:[.,]\d+)?)\s*[*xX]?$/)
    if (matchApenasMultiplicador && !produtoExato && (raw.includes('*') || raw.includes('x') || raw.includes('X') || (raw.length <= 2 && parseFloat(raw) > 0))) {
      const q = parseFloat(matchApenasMultiplicador[1].replace(',', '.'))
      if (!isNaN(q) && q > 0) {
        setQuantidade(q)
        setCodigoInput('')
        setMensagem({ tipo: 'aviso', texto: `Quantidade fixada em ${q}x para o próximo produto!` })
        return
      }
    }

    let multiplicador = quantidade
    let codigoBuscado = raw
    const inlineMatch = raw.match(/^(\d+(?:[.,]\d+)?)\s*[*xX\s]\s*(.+)$/)
    if (inlineMatch) {
      const m = parseFloat(inlineMatch[1].replace(',', '.'))
      if (!isNaN(m) && m > 0) {
        multiplicador = m
        codigoBuscado = inlineMatch[2].trim()
      }
    }

    const infoBalanca = decodificarCodigoBalanca(codigoBuscado)
    if (infoBalanca) {
      adicionarItem(infoBalanca.produto, infoBalanca.quantidade_ou_peso, infoBalanca.subtotal)
      setCodigoInput('')
      setQuantidade(1)
      return
    }

    const termo = codigoBuscado.toLowerCase().trim()
    const produto = produtosCatalogo.find(
      (p) =>
        p.codigo_interno.toLowerCase() === termo ||
        p.nome.toLowerCase() === termo ||
        p.nome.toLowerCase().startsWith(termo) ||
        p.nome.toLowerCase().includes(termo)
    )

    if (!produto) {
      setMensagem({ tipo: 'erro', texto: `Produto "${raw}" não localizado.` })
      return
    }

    if (produto.unidade_venda === 'KG') {
      setProdutoPendentePeso(produto)
      setModalPesoAberto(true)
      return
    }

    adicionarItem(produto, multiplicador)
    setCodigoInput('')
    setQuantidade(1)
  }

  function handleConfirmarPesoManual(prod, pesoKg) {
    adicionarItem(prod, pesoKg)
    setModalPesoAberto(false)
    setProdutoPendentePeso(null)
    setCodigoInput('')
    inputCodigoRef.current?.focus()
  }

  function handleSelecionarProdutoBusca(produto) {
    setModalBuscaAberto(false)
    if (produto.unidade_venda === 'KG') {
      setProdutoPendentePeso(produto)
      setModalPesoAberto(true)
    } else {
      adicionarItem(produto, 1)
      inputCodigoRef.current?.focus()
    }
  }

  async function handleConfirmarVenda(dados) {
    const payload = {
      forma_pagamento: dados.formaPagamento,
      valor_pago: dados.valorPago,
      desconto: dados.desconto,
      cliente_id: dados.clienteId,
      itens: carrinho.map((item) => ({
        produto_id: item.produto_id,
        codigo_interno: item.codigo_interno,
        nome: item.nome,
        unidade_venda: item.unidade_venda,
        quantidade_ou_peso: item.quantidade_ou_peso.toString(),
        preco_unitario: item.preco_unitario.toString(),
      })),
    }

    const res = await registrarVenda(payload)
    setVendaConcluida(res)
    setModalPagamentoAberto(false)
    setCarrinho([])
    carregarStatusCaixa()
    listarClientes({ apenasAtivos: true }).then((d) => setClientesFiado(d || [])).catch(() => {})
  }

  async function handleAbrirCaixa(saldoInicial) {
    await abrirCaixa(saldoInicial)
    await carregarStatusCaixa()
    setMensagem({ tipo: 'sucesso', texto: 'Caixa aberto com sucesso!' })
  }

  async function handleRegistrarMov(tipo, valor, motivo) {
    await registrarMovimentacaoCaixa(tipo, valor, motivo)
    await carregarStatusCaixa()
    setMensagem({ tipo: 'sucesso', texto: `${tipo === 'SANGRIA' ? 'Sangria' : 'Suprimento'} registrado!` })
  }

  async function handleFecharCaixa(valor, observacoes) {
    const turno = await fecharCaixa(valor, observacoes)
    setRelatorioFechamento(turno)
    await carregarStatusCaixa()
    setCarrinho([])
  }

  if (carregandoCaixa) {
    return (
      <div className="pos-screen" style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <p style={{ color: '#fff', fontSize: '1.2rem' }}>Carregando dados do caixa...</p>
      </div>
    )
  }

  if (!caixaStatus?.aberto && !relatorioFechamento) {
    return <CaixaAberturaCard usuario={usuario} onLogout={logout} onAbrirCaixa={handleAbrirCaixa} />
  }

  if (relatorioFechamento) {
    return (
      <RelatorioFechamentoView
        relatorio={relatorioFechamento}
        usuario={usuario}
        onConcluir={() => setRelatorioFechamento(null)}
      />
    )
  }

  return (
    <div className="pos-screen">
      <CaixaHeader
        usuario={usuario}
        saldoGaveta={caixaStatus?.saldo_atual_gaveta}
        onAbrirMovimentacao={() => setModalMovAberto(true)}
        onAbrirFechamento={() => setModalFecharAberto(true)}
        onLogout={logout}
      />

      <div className="pos-body">
        <section className="pos-cart-section">
          <form className="pos-code-form" onSubmit={processarEntradaCodigo}>
            <label>
              <span>Código de Barras / Código Interno (Ex: 0001 ou 2000010012503):</span>
              <div className="code-input-wrapper">
                <input
                  ref={inputCodigoRef}
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value)}
                  placeholder="Passe o leitor ou digite o código... (F3 para buscar)"
                  autoComplete="off"
                />
                <button type="submit" className="button primary">
                  Inserir (Enter)
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setModalBuscaAberto(true)}
                  title="Consultar catálogo de produtos (F3)"
                >
                  🔍 Buscar (F3)
                </button>
              </div>
            </label>
          </form>

          {mensagem.texto && <div className={`pos-status-alert ${mensagem.tipo}`}>{mensagem.texto}</div>}

          <CarrinhoTabela
            carrinho={carrinho}
            onRemoverItem={(idTemp) => setCarrinho((antigo) => antigo.filter((item) => item.idTemp !== idTemp))}
          />
        </section>

        <PainelTotais
          total={total}
          subtotal={subtotal}
          descontoNum={0}
          itensCount={carrinho.length}
          totalProdutosCatalogo={produtosCatalogo.length}
          totalAtendimentos={caixaStatus?.total_clientes_atendidos}
          onAbrirPagamento={() => setModalPagamentoAberto(true)}
          onCancelarVenda={() => {
            if (carrinho.length > 0 && window.confirm('Deseja realmente cancelar toda a venda atual?')) {
              setCarrinho([])
              setMensagem({ tipo: 'aviso', texto: 'Venda cancelada com sucesso.' })
              inputCodigoRef.current?.focus()
            }
          }}
        />
      </div>

      {/* Modais de Fluxo */}
      {modalBuscaAberto && (
        <BuscaProdutosModal
          produtos={produtosCatalogo}
          obterInfoPreco={obterInfoPreco}
          onSelecionarProduto={handleSelecionarProdutoBusca}
          onClose={() => setModalBuscaAberto(false)}
        />
      )}

      {modalPesoAberto && produtoPendentePeso && (
        <PesoManualModal
          produto={produtoPendentePeso}
          onConfirmar={handleConfirmarPesoManual}
          onClose={() => {
            setModalPesoAberto(false)
            setProdutoPendentePeso(null)
            inputCodigoRef.current?.focus()
          }}
        />
      )}

      {modalMovAberto && (
        <MovimentacaoModal
          onClose={() => setModalMovAberto(false)}
          onConfirmar={handleRegistrarMov}
        />
      )}

      {modalFecharAberto && (
        <FechamentoCaixaModal
          caixaStatus={caixaStatus}
          onClose={() => setModalFecharAberto(false)}
          onConfirmar={handleFecharCaixa}
        />
      )}

      {modalPagamentoAberto && (
        <PagamentoModal
          subtotal={subtotal}
          total={total}
          clientesFiado={clientesFiado}
          onClose={() => setModalPagamentoAberto(false)}
          onConfirmarVenda={handleConfirmarVenda}
        />
      )}

      {vendaConcluida && (
        <ReciboModal
          venda={vendaConcluida}
          onNovaVenda={() => {
            setVendaConcluida(null)
            setCodigoInput('')
            inputCodigoRef.current?.focus()
          }}
        />
      )}
    </div>
  )
}
