import { FJSOperators } from './FJSOperators';

interface QueryResult {
  results: any[];
  query: any;
  timestamp: Date;
  executionTime: number;
  totalResults: number;
  totalItemsScanned: number;
}

export class FJS {
  private data: any[];
  private messages = {
    invalidQuery: "A query deve ser um objeto válido.",
    unsupportedQuery: "Operador não suportado na query.",
  };

  constructor(data: any[]) {
    this.data = data;
  }

  public async search(query: any): Promise<QueryResult> {
    const queryIsValid = typeof query !== "object" || query === null;
    if (queryIsValid) throw new Error(this.messages.invalidQuery);

    const operators = FJSOperators;

    const startTime = Date.now();

    const filteredData = await this.filterData(query, operators);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    return {
      results: filteredData,
      query: query,
      timestamp: new Date(),
      executionTime: executionTime,
      totalResults: filteredData.length,
      totalItemsScanned: this.data.length,
    };
  }

  private async filterData(query: any, operators: any): Promise<any[]> {
    const filteredData: any[] = [];

    for (const item of this.data) {
      let isValid = true;

      for (const field in query) {
        const operatorObj = query[field];

        for (const operator in operatorObj) {
          const value = operatorObj[operator];

          if (operator in operators) {
            isValid = isValid && operators[operator](item[field], value);
          } else {
            throw new Error(this.messages.unsupportedQuery);
          }
        }

        if (!isValid) {
          break;
        }
      }

      if (isValid) {
        filteredData.push(item);
      }
    }

    return filteredData;
  }
}
