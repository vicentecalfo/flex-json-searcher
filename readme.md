<img src="Cuj2HgW.png" style="height:70px; display:block; margin:60px auto;">

# FJS - Flex JSON Searcher

FJS é uma biblioteca JavaScript que permite fazer buscas em um array de objetos com base em critérios de consulta flexíveis. Com o FJS, você pode realizar buscas complexas e precisas em seus dados usando operadores atômicos e operadores de busca avançados, como busca fuzzy e busca por data.

## Instalação

A biblioteca FJS pode ser instalada via npm. Para isso, certifique-se de ter o Node.js instalado em seu ambiente. Em seguida, execute o seguinte comando:

`
npm install fjs
`


## Utilização

O FJS é fácil de usar e pode ser utilizado tanto em projetos TypeScript (com suporte a import/export) quanto em projetos JavaScript (com suporte a require). Abaixo estão os passos para utilização do FJS em ambos os cenários:

```typescript
import { FJS } from "flex-json-searcher";
// ou
// const { FJS } = require('flex-json-searcher'); 


// Seus dados em formato de array de objetos
const data = [
  { id: 1, name: "Alice", age: 30, city: "New York" },
  { id: 2, name: "Bob", age: 25, city: "Los Angeles" },
  { id: 3, name: "Charlie", age: 35, city: "Chicago" },
];

// Cria um novo objeto FJS com os dados
const fjs = new FJS(data);

// Define os critérios de busca
const query = { age: { $gt: 28 }, city: { $regex: "New" } };

// Realiza a busca
const result = fjs.search(query);

console.log(result.result); // Resultado da busca
console.log(result.metadata); // Metadados da busca
```

## Operadores Atômicos

O FJS é uma biblioteca que permite fazer buscas em um array de objetos com base em critérios de consulta, sendo uma alternativa flexível e de fácil utilização para a busca de dados em JavaScript. Inspirado no MongoDB, o FJS suporta uma variedade de operadores atômicos que podem ser usados em suas consultas, proporcionando uma experiência semelhante à realização de consultas no MongoDB.

Os seguintes operadores atômicos são suportados pelo FJS e podem ser utilizados em suas consultas:

| Operador   | Descrição                                        |
|------------|--------------------------------------------------|
| `$eq`      | Igual a                                         |
| `$ne`      | Diferente de                                    |
| `$gt`      | Maior que                                       |
| `$lt`      | Menor que                                       |
| `$gte`     | Maior ou igual a                                |
| `$lte`     | Menor ou igual a                                |
| `$in`      | Está contido em um conjunto                     |
| `$regex`   | Corresponde a uma expressão regular (case-insensitive) |
| `$exists`  | Verifica se um campo existe                     |
| `$nin`     | Não está contido em um conjunto                 |
| `$startsWith` | Começa com uma determinada substring (case-insensitive) |
| `$endsWith`   | Termina com uma determinada substring (case-insensitive) |
| `$contains`   | Contém uma determinada substring (case-insensitive)   |
| `$size`    | Tamanho de um array                             |
| `$fuzz`    | Busca fuzzy (busca aproximada)                  |
| `$date`    | Busca por data (aceita datas e timestamps)      |

Esses operadores podem ser combinados para realizar buscas mais complexas e precisas em seus dados.
