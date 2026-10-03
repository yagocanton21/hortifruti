import { moeda, pesoFmt } from '../../utils/formatters.js'

export default function CarrinhoTabela({ carrinho, onRemoverItem }) {
  if (carrinho.length === 0) {
    return (
      <div className="pos-cart-table-wrapper">
        <div className="pos-empty-cart">
          <span className="empty-icon">🛒</span>
          <p>Nenhum item na venda atual</p>
          <small>Passe o código de barras no leitor ou tecle <strong>F3</strong> para pesquisar</small>
        </div>
      </div>
    )
  }

  return (
    <div className="pos-cart-table-wrapper">
      <table className="pos-cart-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Cód</th>
            <th>Descrição</th>
            <th className="text-right">Qtd / Peso</th>
            <th className="text-right">Unitário</th>
            <th className="text-right">Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {carrinho.map((item, index) => (
            <tr key={item.idTemp}>
              <td className="item-index">{carrinho.length - index}</td>
              <td className="item-code">{item.codigo_interno}</td>
              <td>
                <strong>{item.nome}</strong>
                {item.isPromo && (
                  <span
                    style={{
                      marginLeft: '6px',
                      fontSize: '0.72rem',
                      backgroundColor: '#14532d',
                      color: '#86efac',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                    title={`Preço regular: ${moeda.format(item.precoOriginal)}`}
                  >
                    🔥 OFERTA
                  </span>
                )}
              </td>
              <td className="text-right">
                {item.unidade_venda === 'KG'
                  ? `${pesoFmt.format(item.quantidade_ou_peso)} kg`
                  : `${item.quantidade_ou_peso} UN`}
              </td>
              <td className="text-right">{moeda.format(item.preco_unitario)}</td>
              <td className="text-right font-bold">{moeda.format(item.subtotal)}</td>
              <td className="text-right">
                <button
                  type="button"
                  className="pos-remove-item-btn"
                  onClick={() => onRemoverItem(item.idTemp)}
                  title="Remover item da venda"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
