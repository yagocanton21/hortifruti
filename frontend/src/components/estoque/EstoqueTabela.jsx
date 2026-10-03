import { moeda, pesoFmt } from '../../utils/formatters.js'

export default function EstoqueTabela({
  itens,
  carregando,
  onMovimentar,
  onHistorico,
  onConfig,
}) {
  if (carregando) {
    return <div className="empty-state">Carregando posições de estoque...</div>
  }

  if (itens.length === 0) {
    return (
      <div className="empty-state">
        <strong>Nenhum item encontrado</strong>
        <span>Ajuste os filtros de busca ou cadastre novos produtos no catálogo.</span>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Produto</th>
            <th>Unidade</th>
            <th>Estoque Físico</th>
            <th>Mínimo Alerta</th>
            <th>Valor Estimado</th>
            <th>Situação</th>
            <th className="text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => {
            const isKg = item.unidade_venda === 'KG'
            const atualNum = Number(item.estoque_atual || 0)
            const minNum = Number(item.estoque_minimo || 0)

            return (
              <tr key={item.id}>
                <td><span className="code">{item.codigo_interno}</span></td>
                <td><strong>{item.nome}</strong></td>
                <td>
                  <span className={`unit-tag ${isKg ? 'tag-kg' : 'tag-un'}`}>
                    {isKg ? '⚖️ Balança (KG)' : '📦 Unidade (UN)'}
                  </span>
                </td>
                <td>
                  <strong
                    style={{
                      fontSize: '1.05rem',
                      color: atualNum <= 0 ? '#ef4444' : atualNum <= minNum ? '#eab308' : '#22c55e',
                    }}
                  >
                    {isKg ? `${pesoFmt.format(atualNum)} kg` : `${atualNum} un`}
                  </strong>
                </td>
                <td style={{ color: '#64748b' }}>
                  {isKg ? `${pesoFmt.format(minNum)} kg` : `${minNum} un`}
                </td>
                <td className="price">
                  {moeda.format(Number(item.valor_estoque_estimado || 0))}
                </td>
                <td>
                  {!item.controla_estoque ? (
                    <span className="badge inactive">Não Controlado</span>
                  ) : item.status_estoque === 'ZERADO' ? (
                    <span className="badge inactive" style={{ background: '#450a0a', color: '#fca5a5' }}>
                      🔴 Zerado
                    </span>
                  ) : item.status_estoque === 'BAIXO' ? (
                    <span className="badge inactive" style={{ background: '#451a03', color: '#fcd34d' }}>
                      ⚠️ Reposição
                    </span>
                  ) : (
                    <span className="badge active">🟢 Normal</span>
                  )}
                </td>
                <td className="actions">
                  <button
                    type="button"
                    className="text-button"
                    style={{ color: '#059669', fontWeight: 600 }}
                    onClick={() => onMovimentar(item)}
                    title="Lançar entrada, perda ou balanço"
                  >
                    📦 Movimentar
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => onHistorico(item)}
                    title="Ver histórico de movimentações e perdas"
                  >
                    📄 Histórico
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => onConfig(item)}
                    title="Ajustar estoque mínimo e alertas"
                  >
                    ⚙️ Config
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
