# Desafio Técnico Backend — Green Acesso

API em Node.js + TypeScript para importar os boletos do sistema financeiro do Condomínio Green Park
(arquivos `.csv` e `.pdf`) para o sistema da portaria, e para exportar um relatório dos boletos em PDF.

## Stack

- **Node.js + TypeScript**
- **Express 5**: framework HTTP
- **PostgreSQL 16** (via Docker) + **Sequelize**: ORM, migrations e seeders
- **multer**: upload de arquivos
- **csv-parse**: leitura do CSV
- **pdf-lib**: separação do PDF em páginas e geração do relatório
- **pdf-parse**: extração do texto das páginas (validação dos nomes)

## Como rodar

Pré-requisitos: Node.js 20+ e Docker.

```bash
# 1. Instalar dependências
npm install

# 2. Criar o arquivo de ambiente
cp .env.example .env

# 3. Subir o banco
docker compose up -d

# 4. Criar as tabelas e popular os lotes e o mapeamento
npm run db:setup

# 5. Iniciar a API (http://localhost:3000)
npm run dev
```

Outros scripts:

| Script | O que faz |
|---|---|
| `npm run db:reset` | Recria o banco do zero (útil entre testes) |
| `npm run pdf:fake` | Gera novamente o PDF de exemplo em `fixtures/boletos.pdf` |
| `npm run build` / `npm start` | Compila e executa a versão de produção |

> Se a porta 5432 já estiver em uso por outro Postgres, altere `DB_PORT` no `.env` e rode `docker compose up -d` de novo.

## Arquivos de exemplo

- `fixtures/boletos.csv`: o CSV do enunciado
- `fixtures/boletos.pdf`: PDF fake com os boletos na ordem fixa do síndico (Marcia, José, Marcos), gerado por `scripts/gerar-pdf-fake.ts`

## Endpoints

### `POST /boletos/importar-csv` (Atividades 1 e 2)

Recebe o CSV (campo `arquivo`, multipart/form-data), mapeia cada unidade do sistema financeiro para o lote interno e insere os boletos.

```bash
curl -F "arquivo=@fixtures/boletos.csv" http://localhost:3000/boletos/importar-csv
```

- `201`: boletos importados
- `422`: alguma linha inválida (unidade sem mapeamento, valor inválido...). Retorna a lista de erros com o número da linha, e **nada é importado**.

### `POST /boletos/importar-pdf` (Atividade 3)

Recebe o PDF com todos os boletos (campo `arquivo`), separa as páginas e salva cada uma em `storage/boletos/{id_do_boleto}.pdf`.

```bash
curl -F "arquivo=@fixtures/boletos.pdf" http://localhost:3000/boletos/importar-pdf
```

O CSV precisa ter sido importado antes. A pasta de destino pode ser alterada em `BOLETOS_DIR` no `.env`.

### `GET /boletos` (Atividades 4 e 5)

Lista os boletos ativos. Filtros opcionais e combináveis:

| Parâmetro | Descrição |
|---|---|
| `nome` | busca parcial, sem diferenciar maiúsculas (`jose` encontra "JOSE DA SILVA") |
| `valor_inicial` | valor mínimo (inclusive) |
| `valor_final` | valor máximo (inclusive) |
| `id_lote` | id do lote interno |
| `relatorio=1` | retorna `{ "base64": "..." }` com um PDF em tabela dos boletos filtrados |

```bash
curl "http://localhost:3000/boletos?nome=JOSE&valor_inicial=100&valor_final=200"
curl "http://localhost:3000/boletos?relatorio=1"
```

Para salvar o relatório como arquivo no PowerShell:

```powershell
$r = Invoke-RestMethod "http://localhost:3000/boletos?relatorio=1"
[IO.File]::WriteAllBytes("$PWD\relatorio.pdf", [Convert]::FromBase64String($r.base64))
```

## Decisões técnicas

### Tabela de mapeamento

O sistema financeiro identifica a unidade como `17`, enquanto a portaria tem o lote `0017` com id `3`.
Em vez de deduzir um a partir do outro (por exemplo, completando com zeros), criei a tabela
`mapeamento_lotes`, que registra explicitamente a correspondência:

| unidade_externa | id_lote | ordem_pdf |
|---|---|---|
| 17 | 3 | 2 |
| 18 | 6 | 3 |
| 19 | 7 | 1 |

- A tabela não depende de nenhuma regra de formato do sistema externo.
- Ela mantém `lotes` como domínio da portaria: o código externo é um detalhe de integração.
- Ela resolve também a **ordem fixa do PDF** (`ordem_pdf`), como sugerido no enunciado.
- As restrições `UNIQUE` garantem um mapeamento um para um.

Os lotes e o mapeamento são criados pelos seeders, com ids fixos para corresponder ao enunciado.

### Importação do CSV

- Os mapeamentos são buscados **numa única consulta** (`WHERE unidade_externa IN (...)`), evitando uma consulta por linha.
- A ordem das linhas do CSV não influencia o resultado: cada linha é resolvida pela própria unidade.
- Todas as linhas são validadas antes de inserir. Se houver qualquer erro, nada é importado ("tudo ou nada").
- A inserção é feita com `bulkCreate` dentro de uma **transaction**.
- A leitura tolera o BOM do Excel, espaços extras, linhas vazias e valores com vírgula (`182,54`).

### Separação do PDF

- Página N → mapeamento com `ordem_pdf = N` → lote → boleto ativo mais recente desse lote → `{id}.pdf`.
- **Validação extra:** antes de gerar os arquivos, o texto de cada página é extraído e conferido
  com o nome do sacado mapeado. Se o síndico enviar as páginas fora da ordem combinada, a importação é
  recusada, em vez de entregar boletos para as pessoas erradas.
- Todas as validações acontecem antes de escrever qualquer arquivo.

### Relatório

- Gerado com a mesma biblioteca da separação (`pdf-lib`), sem dependência extra.
- Respeita os filtros da listagem, tem paginação automática com cabeçalho repetido e mostra o total ao final.

### Outros

- `valor` é `DECIMAL(10,2)`, nunca FLOAT, para evitar erros de arredondamento com dinheiro.
- `linha_digitavel` não é `UNIQUE`, porque no CSV de exemplo ela se repete entre os boletos.
- Erros de regra de negócio usam a classe `AppError` e são convertidos em JSON por um middleware central.

## Estrutura

```
src/
├── config/        # variáveis de ambiente, conexão com o banco e upload
├── controllers/   # camada HTTP: recebe a requisição e devolve a resposta
├── services/      # regras de negócio (importações, listagem, relatório)
├── models/        # models do Sequelize e associações
├── routes/        # definição das rotas
├── middlewares/   # tratamento centralizado de erros
└── errors/        # AppError
database/
├── migrations/
└── seeders/
fixtures/          # CSV e PDF de exemplo
scripts/           # gerador do PDF fake
storage/boletos/   # saída dos PDFs separados (ignorada pelo git)
```

## Suposições e limitações

- Cada lote tem um boleto vigente por importação. Se houver mais de um boleto ativo para o mesmo lote,
  a importação do PDF usa o mais recente.
- A validação dos nomes no PDF depende de o nome estar em texto na página. Boletos que sejam apenas
  imagem (escaneados) exigiriam OCR.
- Novas unidades externas precisam ser cadastradas em `mapeamento_lotes`.