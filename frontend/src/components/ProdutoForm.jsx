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
    setErro('')

    const cod = formulario.codigo_interno.trim()
    const nome = formulario.nome.trim()
    const precoLimpo = formulario.preco_atual.toString().replace(',', '.').trim()
    const precoNum = parseFloat(precoLimpo)

    if (!cod) {
      setErro('O código interno não pode estar em branco.')
      return
    }

    if (!nome) {
      setErro('O nome do produto não pode estar em branco.')
      return
    }

    if (isNaN(precoNum) || precoNum < 0) {
      setErro('O preço deve ser um valor válido maior ou igual a R$ 0,00.')
      return
    }

    setSalvando(true)
    try {
      await aoSalvar({
        ...formulario,
        codigo_interno: cod,
        nome,
        preco_atual: precoLimpo,
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
