const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export function getToken() {
  return localStorage.getItem('hortifruti_token')
}

export function setAuth(token, usuario) {
  localStorage.setItem('hortifruti_token', token)
  localStorage.setItem('hortifruti_user', JSON.stringify(usuario))
}

export function clearAuth() {
  localStorage.removeItem('hortifruti_token')
  localStorage.removeItem('hortifruti_user')
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('hortifruti_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401 && !path.includes('/auth/login')) {
    clearAuth()
    window.location.href = '/login'
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail ?? 'Não foi possível concluir a operação.')
  }

  return response.json()
}

// Autenticação
export async function login(username, senha) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, senha }),
  })
  setAuth(data.access_token, data.usuario)
  return data
}

export function buscarMeuPerfil() {
  return request('/auth/me')
}

export function listarUsuarios() {
  return request('/auth/usuarios')
}

export function criarUsuario(usuario) {
  return request('/auth/usuarios', {
    method: 'POST',
    body: JSON.stringify(usuario),
  })
}

export function atualizarUsuario(id, dados) {
  return request(`/auth/usuarios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

// Produtos
export function listarProdutos({ pesquisa = '', ativo = '', unidade_venda = '', pagina = '', tamanho = '' } = {}) {
  const params = new URLSearchParams()
  if (pesquisa.trim()) params.set('pesquisa', pesquisa.trim())
  if (ativo !== '') params.set('ativo', ativo)
  if (unidade_venda) params.set('unidade_venda', unidade_venda)
  if (pagina) params.set('pagina', pagina)
  if (tamanho) params.set('tamanho', tamanho)

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

// Pesagem
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

// Vendas / Frente de Caixa
export function registrarVenda(venda) {
  return request('/vendas', {
    method: 'POST',
    body: JSON.stringify(venda),
  })
}

export function listarVendas({ data_inicio = '', data_fim = '', forma_pagamento = '', limite = 100 } = {}) {
  const params = new URLSearchParams()
  if (data_inicio) params.set('data_inicio', data_inicio)
  if (data_fim) params.set('data_fim', data_fim)
  if (forma_pagamento) params.set('forma_pagamento', forma_pagamento)
  if (limite) params.set('limite', limite)

  const query = params.toString()
  return request(`/vendas${query ? `?${query}` : ''}`)
}

export function obterResumoVendas({ data_inicio = '', data_fim = '' } = {}) {
  const params = new URLSearchParams()
  if (data_inicio) params.set('data_inicio', data_inicio)
  if (data_fim) params.set('data_fim', data_fim)

  const query = params.toString()
  return request(`/vendas/resumo${query ? `?${query}` : ''}`)
}

// Controle de Turno e Gaveta de Caixa
export function obterStatusCaixa() {
  return request('/caixa/status')
}

export function abrirCaixa(saldoInicial = 100.0) {
  return request('/caixa/abrir', {
    method: 'POST',
    body: JSON.stringify({ saldo_inicial: saldoInicial }),
  })
}

export function registrarMovimentacaoCaixa(tipo, valor, motivo) {
  return request('/caixa/movimentacoes', {
    method: 'POST',
    body: JSON.stringify({ tipo, valor, motivo }),
  })
}

export function fecharCaixa(saldoInformadoGaveta, observacoes = '') {
  return request('/caixa/fechar', {
    method: 'POST',
    body: JSON.stringify({
      saldo_informado_gaveta: saldoInformadoGaveta,
      observacoes: observacoes || null,
    }),
  })
}

export function cancelarVenda(vendaId, motivo) {
  return request(`/vendas/${vendaId}/cancelar`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
  })
}

// Clientes & Fiado
export function listarClientes({ busca = '', apenasComDebito = false, apenasAtivos = false } = {}) {
  const params = new URLSearchParams()
  if (busca.trim()) params.set('busca', busca.trim())
  if (apenasComDebito) params.set('apenas_com_debito', 'true')
  if (apenasAtivos) params.set('apenas_ativos', 'true')
  const query = params.toString()
  return request(`/clientes${query ? `?${query}` : ''}`)
}

export function buscarCliente(id) {
  return request(`/clientes/${id}`)
}

export function criarCliente(cliente) {
  return request('/clientes', {
    method: 'POST',
    body: JSON.stringify(cliente),
  })
}

export function atualizarCliente(id, dados) {
  return request(`/clientes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

export function obterExtratoCliente(id) {
  return request(`/clientes/${id}/extrato`)
}

export function receberPagamentoFiado(clienteId, valor, observacao = '') {
  return request(`/clientes/${clienteId}/pagamento`, {
    method: 'POST',
    body: JSON.stringify({ valor, observacao }),
  })
}

// Promoções & Ofertas
export function listarPromocoes({ apenasAtivas = false, produtoId = '' } = {}) {
  const params = new URLSearchParams()
  if (apenasAtivas) params.set('apenas_ativas', 'true')
  if (produtoId) params.set('produto_id', produtoId)
  const query = params.toString()
  return request(`/promocoes${query ? `?${query}` : ''}`)
}

export function criarPromocao(promocao) {
  return request('/promocoes', {
    method: 'POST',
    body: JSON.stringify(promocao),
  })
}

export function atualizarPromocao(id, dados) {
  return request(`/promocoes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

export function alternarStatusPromocao(id) {
  return request(`/promocoes/${id}/alternar-status`, {
    method: 'POST',
  })
}

// Controle de Estoque
export function listarEstoque({ busca = '', apenasBaixo = false, apenasZerados = false, unidadeVenda = '' } = {}) {
  const params = new URLSearchParams()
  if (busca.trim()) params.set('busca', busca.trim())
  if (apenasBaixo) params.set('apenas_baixo', 'true')
  if (apenasZerados) params.set('apenas_zerados', 'true')
  if (unidadeVenda) params.set('unidade_venda', unidadeVenda)
  const query = params.toString()
  return request(`/estoque${query ? `?${query}` : ''}`)
}

export function obterResumoEstoque() {
  return request('/estoque/resumo')
}

export function registrarMovimentacaoEstoque(dados) {
  return request('/estoque/movimentacao', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export function obterHistoricoEstoque(produtoId, limite = 50) {
  return request(`/estoque/${produtoId}/historico?limite=${limite}`)
}

export function atualizarConfiguracaoEstoque(produtoId, dados) {
  return request(`/estoque/${produtoId}/configuracao`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}
