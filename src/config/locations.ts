export const CONSULADOS = [
  { id: 'sp', city: 'São Paulo', state: 'SP', label: 'São Paulo – SP' },
  { id: 'rj', city: 'Rio de Janeiro', state: 'RJ', label: 'Rio de Janeiro – RJ' },
  { id: 'bsb', city: 'Brasília', state: 'DF', label: 'Brasília – DF' },
  { id: 'rec', city: 'Recife', state: 'PE', label: 'Recife – PE' },
  { id: 'poa', city: 'Porto Alegre', state: 'RS', label: 'Porto Alegre – RS' },
] as const

export const CASVS = [
  { id: 'sp', city: 'São Paulo', state: 'SP', label: 'São Paulo – SP' },
  { id: 'rj', city: 'Rio de Janeiro', state: 'RJ', label: 'Rio de Janeiro – RJ' },
  { id: 'bsb', city: 'Brasília', state: 'DF', label: 'Brasília – DF' },
  { id: 'bh', city: 'Belo Horizonte', state: 'MG', label: 'Belo Horizonte – MG' },
  { id: 'cwb', city: 'Curitiba', state: 'PR', label: 'Curitiba – PR' },
  { id: 'poa', city: 'Porto Alegre', state: 'RS', label: 'Porto Alegre – RS' },
  { id: 'ssa', city: 'Salvador', state: 'BA', label: 'Salvador – BA' },
  { id: 'for', city: 'Fortaleza', state: 'CE', label: 'Fortaleza – CE' },
  { id: 'rec', city: 'Recife', state: 'PE', label: 'Recife – PE' },
  { id: 'man', city: 'Manaus', state: 'AM', label: 'Manaus – AM' },
  { id: 'bel', city: 'Belém', state: 'PA', label: 'Belém – PA' },
] as const

export type ConsultadoId = (typeof CONSULADOS)[number]['id']
export type CasvId = (typeof CASVS)[number]['id']
