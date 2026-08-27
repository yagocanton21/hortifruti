import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const peso = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

function EtiquetaPesagem({ pesagem }) {
  const codigoBarras = useRef(null)

  useEffect(() => {
    if (!codigoBarras.current) return
    JsBarcode(codigoBarras.current, pesagem.codigo_pesagem, {
      format: 'CODE128',
      displayValue: false,
      width: 2,
      height: 54,
      margin: 0,
      background: '#ffffff',
      lineColor: '#111111',
    })
  }, [pesagem.codigo_pesagem])

  return (
    <section className="label-preview-section">
      <div className="label-preview-heading">
        <div>
          <span className="eyebrow">ETIQUETA</span>
          <h2>Prévia da etiqueta</h2>
          <p>Representação visual para conferência. A impressão física será integrada depois.</p>
        </div>
        <div className="preview-actions">
          <span className="preview-badge">60 × 40 mm · Code 128</span>
          <button className="button primary" type="button" onClick={() => window.print()}>
            Imprimir etiqueta
          </button>
        </div>
      </div>

      <div className="produce-label" aria-label={`Etiqueta da pesagem ${pesagem.codigo_pesagem}`}>
        <header>
          <strong>HORTIFRUTI</strong>
          <span>Produto pesado</span>
        </header>
        <div className="label-product">
          <span>{pesagem.codigo_interno}</span>
          <strong>{pesagem.produto_nome}</strong>
        </div>
        <div className="label-values">
          <div><span>Peso</span><strong>{peso.format(Number(pesagem.peso_kg))} kg</strong></div>
          <div><span>Preço/kg</span><strong>{moeda.format(Number(pesagem.preco_kg))}</strong></div>
        </div>
        <div className="label-total"><span>Total</span><strong>{moeda.format(Number(pesagem.total))}</strong></div>
        <div className="barcode-area">
          <svg ref={codigoBarras} role="img" aria-label={`Código de barras ${pesagem.codigo_pesagem}`} />
          <code>{pesagem.codigo_pesagem}</code>
        </div>
      </div>
    </section>
  )
}

export default EtiquetaPesagem
