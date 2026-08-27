const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail ?? 'Não foi possível concluir a operação.')
  }

  return response.json()
}

export function listarProdutos({ pesquisa = '', ativo = '' } = {}) {
  const params = new URLSearchParams()
  if (pesquisa.trim()) params.set('pesquisa', pesquisa.trim())
  if (ativo !== '') params.set('ativo', ativo)
  const query = params.toString()
  return request(`/produtos${query ? `?${query}` : ''}`)
}

export function criarProduto(produto) {
  return request('/produtos', { method: 'POST', body: JSON.stringify(produto) })
}

export function buscarProduto(id) {
  return request(`/produtos/${id}`)
}

export function listarHistoricoPrecos(id, { pagina = 1, tamanho = 20 } = {}) {
  const params = new URLSearchParams({ pagina, tamanho })
  return request(`/produtos/${id}/historico-precos?${params}`)
}

export function substituirProduto(id, produto) {
  return request(`/produtos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(produto),
  })
}

export function alterarProduto(id, alteracoes) {
  return request(`/produtos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(alteracoes),
  })
}

export function calcularPesagem(produtoId, pesoKg) {
  return request('/pesagens/calcular', {
    method: 'POST',
    body: JSON.stringify({ produto_id: produtoId, peso_kg: pesoKg }),
  })
}

export function registrarPesagem(produtoId, pesoKg) {
  return request('/pesagens', {
    method: 'POST',
    body: JSON.stringify({ produto_id: produtoId, peso_kg: pesoKg }),
  })
}
