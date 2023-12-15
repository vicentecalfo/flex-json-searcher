import diacritics from "diacritics";

interface FJSOptions {
  ignoreAccents?: boolean;
  ignoreCase?: boolean;
  fuzzyThreshold?: number;
}

interface FJSQuery {
  [key: string]: any | { [operator: string]: any };
}

interface FJSResult {
  result: any[];
  metadata: {
    date: string;
    query: FJSQuery;
    executionTime: number;
  };
}

export default class FJS {
  private data: any[];

  /**
   * Cria um novo objeto FJS com o array de objetos fornecido.
   * @param data O array de objetos para realizar a busca.
   */
  constructor(data: any[]) {
    this.data = data;
  }

  /**
   * Realiza a busca no array de objetos com base nos critérios definidos na consulta.
   * @param query Objeto que define os critérios de busca. Cada chave é um campo e seu valor é o critério.
   * @param FJSOptions Opções para a busca.
   * @returns Um array contendo os objetos que atendem aos critérios da busca, com metadados.
   */
  async search(query: FJSQuery, FJSOptions: FJSOptions = {}): Promise<FJSResult> {
    const startTime = Date.now();

    const result = this.data.filter((obj) => {
      return Object.keys(query).every((key) => {
        const fieldValue = this.deepValue(obj, key);
        const searchValue = query[key];

        if (typeof searchValue === "object") {
          for (const operator in searchValue) {
            if (!this.checkOperator(fieldValue, operator, searchValue[operator], FJSOptions)) {
              return false;
            }
          }
          return true;
        } else {
          return this.checkOperator(fieldValue, "$eq", searchValue, FJSOptions);
        }
      });
    });

    const endTime = Date.now();
    const metadata = {
      date: new Date().toISOString(),
      query,
      executionTime: endTime - startTime,
    };

    return { result, metadata };
  }

  private checkOperator(fieldValue: any, operator: string, searchValue: any, FJSOptions: FJSOptions): boolean {
    const operators: Record<string, (a: any, b: any, opts?: FJSOptions) => boolean> = {
      $eq: (a, b, opts) => this.isEqual(a, b, opts),
      $ne: (a, b, opts) => !this.isEqual(a, b, opts),
      $gt: (a, b) => a > b,
      $lt: (a, b) => a < b,
      $gte: (a, b) => a >= b,
      $lte: (a, b) => a <= b,
      $in: (a, b) => Array.isArray(b) && b.includes(a),
      $regex: (a, b, opts) => {
        if (typeof a === "string" && typeof b === "string") {
          const regex = new RegExp(b, "i");
          return regex.test((opts?.ignoreCase) ? a.toLowerCase() : a);
        }
        return false;
      },
      $exists: (a, b) => (a !== undefined) === b,
      $nin: (a, b) => Array.isArray(b) && !b.includes(a),
      $startsWith: (a, b, opts) => {
        if (typeof a === "string" && typeof b === "string") {
          const regex = new RegExp("^" + this.escapeRegex(b), "i");
          return regex.test((opts?.ignoreCase) ? a.toLowerCase() : a);
        }
        return false;
      },
      $endsWith: (a, b, opts) => {
        if (typeof a === "string" && typeof b === "string") {
          const regex = new RegExp(this.escapeRegex(b) + "$", "i");
          return regex.test((opts?.ignoreCase) ? a.toLowerCase() : a);
        }
        return false;
      },
      $contains: (a, b, opts) => {
        if (typeof a === "string" && typeof b === "string") {
          const regex = new RegExp(this.escapeRegex(b), "i");
          return regex.test((opts?.ignoreCase) ? a.toLowerCase() : a);
        }
        return false;
      },
      $size: (a, b) => Array.isArray(a) && a.length === b,
      $fuzz: (a, b, opts) => {
        if (typeof a === "string" && typeof b === "string") {
          const threshold = typeof opts?.fuzzyThreshold === "number"
            ? opts.fuzzyThreshold
            : 0.8;
          return this.fuzzySearch(a, b, threshold);
        }
        return false;
      },
      $date: (a, b, opts) => {
        if (typeof a === "string" && typeof b === "string") {
          const dateA = new Date(a);
          const dateB = new Date(b);
          if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
            return this.compareDates(dateA.getTime(), dateB.getTime(), operator);
          }
        } else if (typeof a === "number" && typeof b === "number") {
          return this.compareDates(a, b, operator);
        }
        return false;
      },
    };

    const FJSOperatorFunction = operators[operator];
    return FJSOperatorFunction
      ? FJSOperatorFunction(fieldValue, searchValue, FJSOptions)
      : false;
  }

  private compareDates(dateA: number, dateB: number, operator: string): boolean {
    switch (operator) {
      case "$eq":
        return dateA === dateB;
      case "$ne":
        return dateA !== dateB;
      case "$gt":
        return dateA > dateB;
      case "$lt":
        return dateA < dateB;
      case "$gte":
        return dateA >= dateB;
      case "$lte":
        return dateA <= dateB;
        default:
          return false; // Operador inválido para datas
      }
    }
  
    private deepValue(obj: any, path: string): any {
      const keys = path.split(".");
      return keys.reduce((value, key) => value && value[key] !== undefined ? value[key] : undefined, obj);
    }
  
    private isEqual(value1: any, value2: any, FJSOptions?: FJSOptions): boolean {
      if (typeof value1 === "string" && typeof value2 === "string") {
        if (FJSOptions?.ignoreAccents) {
          value1 = diacritics.remove(value1);
          value2 = diacritics.remove(value2);
        }
        if (FJSOptions?.ignoreCase) {
          value1 = value1.toLowerCase();
          value2 = value2.toLowerCase();
        }
      }
      return value1 === value2;
    }
  
    private escapeRegex(str: string): string {
      return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    }
  
    private fuzzySearch(str: string, query: string, threshold: number): boolean {
      // Implementação da busca fuzzy
      const searchValue = diacritics.remove(query.toLowerCase());
      const text = diacritics.remove(str.toLowerCase());
      if (text.includes(searchValue)) {
        return true;
      }
      const score = this.calculateFuzzyScore(text, searchValue);
      return score >= threshold;
    }
  
    private calculateFuzzyScore(text: string, query: string): number {
      // Implementação do cálculo do score fuzzy
      const queryLength = query.length;
      if (queryLength === 0) {
        return 1.0;
      }
      const textLength = text.length;
      let totalMatches = 0;
      let fuzzyScore = 0;
      let i = 0;
      let j = 0;
      while (i < textLength) {
        if (text[i] === query[j]) {
          totalMatches++;
          fuzzyScore += totalMatches / (i + 1);
          j++;
        }
        i++;
      }
      const finalScore = fuzzyScore / queryLength;
      return finalScore;
    }
  }
  
