import { useEffect, useMemo, useState } from 'react'
import EtiquetaPesagem from '../components/EtiquetaPesagem.jsx'
import { calcularPesagem, listarProdutos, registrarPesagem } from '../services/api.js'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const pesoFormatado = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

function PesagemPage() {
  const [produtos, setProdutos] = useState([])
  const [produtoId, setProdutoId] = useState('')
  const [peso, setPeso] = useState('')
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [calculando, setCalculando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [pesagemConfirmada, setPesagemConfirmada] = useState(null)

  useEffect(() => {
    let ativo = true
    listarProdutos({ ativo: 'true' })
      .then((dados) => {
        if (ativo) setProdutos(dados.filter((produto) => produto.unidade_venda === 'KG'))
      })
      .catch((error) => {
        if (ativo) setErro(error.message)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => { ativo = false }
  }, [])

  const produtoSelecionado = useMemo(
    () => produtos.find((produto) => produto.id === Number(produtoId)),
    [produtoId, produtos],
  )

  async function calcular(event) {
    event.preventDefault()
    setErro('')
    setCalculando(true)
    setPesagemConfirmada(null)
    try {
      setResultado(await calcularPesagem(Number(produtoId), peso.replace(',', '.')))
    } catch (error) {
      setResultado(null)
      setErro(error.message)
    } finally {
      setCalculando(false)
    }
  }

  function trocarProduto(event) {
    setProdutoId(event.target.value)
    setResultado(null)
    setPesagemConfirmada(null)
  }

  async function confirmarPesagem() {
    setConfirmando(true)
    setErro('')
    try {
      const confirmada = await registrarPesagem(resultado.produto_id, resultado.peso_kg)
      setResultado(confirmada)
      setPesagemConfirmada(confirmada)
    } catch (error) {
      setErro(error.message)
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <main className="content weighing-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">OPERAÇÃO</span>
          <h1>Pesagem</h1>
          <p>Selecione o produto, informe o peso e confira o valor calculado.</p>
        </div>
      </div>

      <div className="weighing-grid">
        <form className="panel weighing-form" onSubmit={calcular}>
          <div className="section-heading">
            <div><span className="step-number">1</span><strong>Dados da pesagem</strong></div>
          </div>
          {erro && <div className="alert error" role="alert">{erro}</div>}
          <label>
            <span>Produto</span>
            <select value={produtoId} onChange={trocarProduto} required disabled={carregando}>
              <option value="">{carregando ? 'Carregando produtos...' : 'Selecione um produto'}</option>
              {produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>{produto.codigo_interno} — {produto.nome}</option>
              ))}
            </select>
          </label>

          {produtoSelecionado && (
            <div className="selected-product">
              <div><span>Código</span><strong>{produtoSelecionado.codigo_interno}</strong></div>
              <div><span>Preço/kg</span><strong>{moeda.format(Number(produtoSelecionado.preco_atual))}</strong></div>
            </div>
          )}

          <label>
            <span>Peso em quilogramas</span>
            <div className="weight-input">
              <input
                value={peso}
                onChange={(event) => { setPeso(event.target.value); setResultado(null); setPesagemConfirmada(null) }}
                inputMode="decimal"
                placeholder="0,000"
                required
                aria-label="Peso em quilogramas"
              />
              <span>kg</span>
            </div>
          </label>
          <button className="button primary calculate-button" type="submit" disabled={calculando || !produtoId}>
            {calculando ? 'Calculando...' : 'Calcular total'}
          </button>
          {!carregando && produtos.length === 0 && <p className="field-note">Não há produtos ativos vendidos por KG.</p>}
        </form>

        <section className={`panel weighing-result${resultado ? ' ready' : ''}`}>
          <div className="result-label">TOTAL DA PESAGEM</div>
          {resultado ? (
            <>
              <div className="result-product">{resultado.produto_nome}</div>
              <div className="result-total">{moeda.format(Number(resultado.total))}</div>
              <div className="calculation-line">
                <span>{pesoFormatado.format(Number(resultado.peso_kg))} kg</span>
                <span>×</span>
                <span>{moeda.format(Number(resultado.preco_kg))}/kg</span>
              </div>
              {pesagemConfirmada ? (
                <div className="confirmed-weighing">
                  <strong>Pesagem confirmada</strong>
                  <code>{pesagemConfirmada.codigo_pesagem}</code>
                  <span>Registro #{pesagemConfirmada.id} · {pesagemConfirmada.status}</span>
                </div>
              ) : (
                <button className="button confirm-weighing" type="button" disabled={confirmando} onClick={confirmarPesagem}>
                  {confirmando ? 'Confirmando...' : 'Confirmar pesagem'}
                </button>
              )}
            </>
          ) : (
            <div className="result-placeholder">
              <span>0,000 kg</span>
              <strong>R$ 0,00</strong>
              <p>O total aparecerá aqui após o cálculo.</p>
            </div>
          )}
        </section>
      </div>
      {pesagemConfirmada && <EtiquetaPesagem pesagem={pesagemConfirmada} />}
    </main>
  )
}

export default PesagemPage
