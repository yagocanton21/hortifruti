import { useState } from 'react'
import { moeda } from '../../utils/formatters.js'

export default function BuscaProdutosModal({
  produtos,
  obterInfoPreco,
  onSelecionarProduto,
  onClose,
}) {
  const [termo, setTermo] = useState('')

  const filtrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(termo.toLowerCase()) ||
      p.codigo_interno.includes(termo)
  )

  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div className="pos-modal-content lg" onClick={(e) => e.stopPropagation()}>
        <div className="pos-modal-header">
          <h3>🔍 Consulta de Produtos (F3)</h3>
          <button className="pos-close-modal" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="pos-modal-body">
          <input
            autoFocus
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Digite o nome ou código para filtrar..."
            className="pos-search-input"
          />
          <div className="pos-products-grid">
            {filtrados.map((produto) => {
              const info = obterInfoPreco(produto)
              return (
                <div
                  key={produto.id}
                  className="pos-product-card"
                  onClick={() => onSelecionarProduto(produto)}
                >
                  <span className="card-code">{produto.codigo_interno}</span>
                  <strong>{produto.nome}</strong>
                  <div className="card-price">
                    {info.isPromo ? (
                      <>
                        <span
                          style={{
                            textDecoration: 'line-through',
                            color: '#94a3b8',
                            fontSize: '0.85rem',
                            marginRight: '6px',
                          }}
                        >
                          {moeda.format(info.precoOriginal)}
                        </span>
                        <strong style={{ color: '#4eed84' }}>
                          {moeda.format(info.preco)} / {produto.unidade_venda}
                        </strong>
                        <span
                          style={{
                            marginLeft: '6px',
                            fontSize: '0.72rem',
                            backgroundColor: '#14532d',
                            color: '#86efac',
                            padding: '1px 5px',
                            borderRadius: '4px',
                          }}
                        >
                          🔥 OFERTA
                        </span>
                      </>
                    ) : (
                      <>{moeda.format(Number(produto.preco_atual))} / {produto.unidade_venda}</>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
