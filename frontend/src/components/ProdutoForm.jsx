import { useState } from 'react'
import { Link } from 'react-router-dom'

function ProdutoForm({ valoresIniciais, aoSalvar, textoBotao }) {
  const [formulario, setFormulario] = useState(valoresIniciais)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  function alterarCampo(event) {
    const { name, value, type, checked } = event.target
    setFormulario((atual) => ({
      ...atual,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function salvar(event) {
    event.preventDefault()
    setSalvando(true)
    setErro('')
    try {
      await aoSalvar({
        ...formulario,
        preco_atual: formulario.preco_atual.replace(',', '.'),
      })
    } catch (error) {
      setErro(error.message)
      setSalvando(false)
    }
  }

  return (
    <form className="panel product-form" onSubmit={salvar}>
      {erro && <div className="alert error" role="alert">{erro}</div>}
      <div className="form-grid">
        <label>
          <span>Código interno</span>
          <input name="codigo_interno" value={formulario.codigo_interno} onChange={alterarCampo} placeholder="Ex.: 0001" maxLength="20" required autoFocus />
        </label>
        <label className="wide">
          <span>Nome do produto</span>
          <input name="nome" value={formulario.nome} onChange={alterarCampo} placeholder="Ex.: Tomate Italiano" maxLength="120" required />
        </label>
        <label>
          <span>Unidade de venda</span>
          <select name="unidade_venda" value={formulario.unidade_venda} onChange={alterarCampo}>
            <option value="KG">Quilograma (KG)</option>
            <option value="UN">Unidade (UN)</option>
          </select>
        </label>
        <label>
          <span>Preço atual</span>
          <div className="money-input">
            <span>R$</span>
            <input name="preco_atual" value={formulario.preco_atual} onChange={alterarCampo} inputMode="decimal" placeholder="0,00" required />
          </div>
        </label>
      </div>
      <label className="check-field">
        <input type="checkbox" name="ativo" checked={formulario.ativo} onChange={alterarCampo} />
        <span><strong>Produto ativo</strong><small>Disponível para operações de venda.</small></span>
      </label>
      <div className="form-actions">
        <Link className="button ghost" to="/produtos">Cancelar</Link>
        <button className="button primary" disabled={salvando} type="submit">
          {salvando ? 'Salvando...' : textoBotao}
        </button>
      </div>
    </form>
  )
}

export default ProdutoForm
