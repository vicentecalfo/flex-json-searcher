import diacritics from "diacritics";

export type FJSSearchResult = {
  result: any[];
  metadata: {
    date: string;
    query: any;
    executionTime: number;
  };
};

export interface FJSOptions {
  ignoreAccents?: boolean;
  ignoreCase?: boolean;
  fuzzyThreshold?: number;
  date?: {
    operator: string;
  };
}

export type FJSOperatorFunction = (
  a: any,
  b: any,
  opts?: FJSOptions
) => boolean;

export class FJS {
  private data: any[];

  // Definição do objeto de operadores
  private operators: { [op: string]: FJSOperatorFunction } = {
    $eq: (a, b, opts) => this.isEqual(a, b, opts),
    $ne: (a, b, opts) => !this.isEqual(a, b, opts),
    $gt: (a, b) => this.toNumber(a) > this.toNumber(b),
    $lt: (a, b) => this.toNumber(a) < this.toNumber(b),
    $gte: (a, b) => this.toNumber(a) >= this.toNumber(b),
    $lte: (a, b) => this.toNumber(a) <= this.toNumber(b),
    $in: (a, b, opts) => this.testIn(a, b, opts),
    $nin: (a, b, opts) => !this.testIn(a, b, opts),
    $regex: (a, b, opts) => this.testRegex(a, b, opts),
    $exists: (a, b) => (a !== undefined) === b,
    $startsWith: (a, b, opts) => this.testStringStartsWith(a, b, opts),
    $endsWith: (a, b, opts) => this.testStringEndsWith(a, b, opts),
    $contains: (a, b, opts) => this.testStringContains(a, b, opts),
    $size: (a, b) => Array.isArray(a) && a.length === b,
    $fuzz: (a, b, opts) => this.fuzzySearch(a, b, opts),
    $date: (a, b, opts) => this.compareDates(a, b, opts),
  };

  constructor(data: any[]) {
    this.data = data;
  }

  public async search(
    query: any,
    FJSOptions: FJSOptions = { ignoreAccents: false, ignoreCase: false }
  ): Promise<FJSSearchResult> {
    const startTime = Date.now();
    const result = this.data.filter((obj) =>
      this.matchQuery(obj, query, FJSOptions)
    );
    const endTime = Date.now();

    const metadata = {
      date: new Date().toISOString(),
      query,
      executionTime: endTime - startTime,
    };

    return { result, metadata };
  }

  private matchQuery(obj: any, query: any, FJSOptions: FJSOptions): boolean {
    const isObject = (value: any) =>
      typeof value === "object" && !Array.isArray(value);
    const isArray = (value: any) => Array.isArray(value);
    const isObjectWithOperators = (value: any) =>
      isObject(value) && !isArray(value);

    const hasMatchingField = (fieldValue: any, searchValue: any): boolean => {
      if (isObject(fieldValue)) {
        // Caso o fieldValue seja um objeto, precisamos verificar recursivamente
        return this.matchQuery(fieldValue, searchValue, FJSOptions);
      } else if (isObjectWithOperators(searchValue)) {
        // Aqui tratamos o caso em que o searchValue é um objeto com operadores
        for (const operator in searchValue) {
          const searchOperator = searchValue[operator];
          if (
            !this.checkOperator(
              fieldValue,
              operator,
              searchOperator,
              FJSOptions
            )
          ) {
            return false;
          }
        }
        return true;
      } else {
        // Demais casos de operadores
        return this.checkOperator(fieldValue, "$eq", searchValue, FJSOptions);
      }
    };

    return Object.keys(query).every((key) => {
      const fieldValue = this.deepValue(obj, key);
      const searchValue = query[key];
      return hasMatchingField(fieldValue, searchValue);
    });
  }

  private checkOperator(
    fieldValue: any,
    operator: string,
    searchValue: any,
    FJSOptions?: FJSOptions
  ): boolean {
    const FJSOperatorFunction = this.operators[operator];
    return FJSOperatorFunction
      ? FJSOperatorFunction(fieldValue, searchValue, FJSOptions)
      : false;
  }

  private testIn(a: any, b: any, opts?: FJSOptions): boolean {
    const processValue = (value: any) => {
      const isArrayValue = Array.isArray(value);
      const isStringValue = typeof value === "string";

      if (isArrayValue) {
        return value.map((item) => processValue(item));
      }

      if (isStringValue) {
        if (opts?.ignoreAccents) {
          value = diacritics.remove(value);
        }

        if (opts?.ignoreCase) {
          value = value.toLowerCase();
        }

        if (!isNaN(Number(value))) {
          value = this.toNumber(value);
        }
      }

      return value;
    };

    const normalizedA = processValue(a);
    const normalizedB = processValue(b);

    const areBothArrays =
      Array.isArray(normalizedA) && Array.isArray(normalizedB);
    const areBothNonArrays =
      !Array.isArray(normalizedA) && !Array.isArray(normalizedB);
    const isOnlyAArray =
      Array.isArray(normalizedA) && !Array.isArray(normalizedB);
    const isOnlyBArray =
      !Array.isArray(normalizedA) && Array.isArray(normalizedB);

    if (areBothArrays) {
      // Both a and b are arrays
      return normalizedA.some((item) =>
        normalizedB.some((value) =>
          this.isEqualStringOrNumber(item, value, opts)
        )
      );
    }

    if (areBothNonArrays) {
      // Both a and b are non-arrays
      return this.isEqualStringOrNumber(normalizedA, normalizedB, opts);
    }

    if (isOnlyAArray) {
      // Only a is an array, b is not an array
      return normalizedA.some((item) =>
        this.isEqualStringOrNumber(item, normalizedB, opts)
      );
    }

    if (isOnlyBArray) {
      // Only b is an array, a is not an array
      return normalizedB.some((item) =>
        this.isEqualStringOrNumber(normalizedA, item, opts)
      );
    }

    return false;
  }

  private isEqualStringOrNumber(
    value1: any,
    value2: any,
    opts?: FJSOptions
  ): boolean {
    const isValue1String = typeof value1 === "string";
    const isValue2String = typeof value2 === "string";

    if (isValue1String && isValue2String) {
      if (opts?.ignoreCase) {
        return value1.toLowerCase() === value2.toLowerCase();
      } else {
        return value1 === value2;
      }
    }

    const numValue1 = this.toNumber(value1);
    const numValue2 = this.toNumber(value2);
    return !isNaN(numValue1) && !isNaN(numValue2) && numValue1 === numValue2;
  }

  private toNumber(value: any): number {
    const conversionMap: { [type: string]: (value: any) => number } = {
      number: (val) => val,
      string: (val) => parseFloat(val),
    };

    const conversionFunction = conversionMap[typeof value];
    return conversionFunction ? conversionFunction(value) : NaN;
  }

  private isEqual(value1: any, value2: any, FJSOptions?: FJSOptions) {
    if (typeof value1 === "string" && typeof value2 === "string") {
      let modifiedValue1 = value1;
      let modifiedValue2 = value2;

      if (FJSOptions?.ignoreAccents) {
        modifiedValue1 = diacritics.remove(value1);
        modifiedValue2 = diacritics.remove(value2);
      }
      if (FJSOptions?.ignoreCase) {
        modifiedValue1 = modifiedValue1.toLowerCase();
        modifiedValue2 = modifiedValue2.toLowerCase();
      }

      return modifiedValue1 === modifiedValue2;
    }

    return value1 === value2;
  }

  private testRegex(a: any, b: any, opts?: FJSOptions) {
    if (typeof a === "string" && typeof b === "string") {
      let regexOptions = opts?.ignoreCase ? "i" : "";
      if (opts?.ignoreAccents) {
        b = diacritics.remove(b);
        a = diacritics.remove(a);
      }
      const regex = new RegExp(b, regexOptions);
      return regex.test(a);
    }
    return false;
  }

  private testStringStartsWith(a: any, b: any, opts?: FJSOptions) {
    if (typeof a === "string" && typeof b === "string") {
      let regexOptions = opts?.ignoreCase ? "i" : "";
      if (opts?.ignoreAccents) {
        b = diacritics.remove(b);
        a = diacritics.remove(a);
      }
      const regex = new RegExp("^" + this.escapeRegex(b), regexOptions);
      return regex.test(a);
    }
    return false;
  }

  private testStringEndsWith(a: any, b: any, opts?: FJSOptions) {
    if (typeof a === "string" && typeof b === "string") {
      let regexOptions = opts?.ignoreCase ? "i" : "";
      if (opts?.ignoreAccents) {
        b = diacritics.remove(b);
        a = diacritics.remove(a);
      }
      const regex = new RegExp(this.escapeRegex(b) + "$", regexOptions);
      return regex.test(a);
    }
    return false;
  }

  private testStringContains(a: any, b: any, opts?: FJSOptions): boolean {
    const processValue = (value: any) => {
      if (typeof value === "string") {
        if (opts?.ignoreAccents) {
          value = diacritics.remove(value);
        }
        if (opts?.ignoreCase) {
          value = value.toLowerCase();
        }
      }
      return value;
    };

    const processedA = processValue(a);
    const processedB = processValue(b);

    if (typeof processedA === "string" && typeof processedB === "string") {
      const regex = new RegExp(this.escapeRegex(processedB), "i");
      return regex.test(processedA);
    }

    return false;
  }

  private compareDates(dateA: any, dateB: any, opts: FJSOptions = {}): boolean {
    if (typeof dateA === "string" || typeof dateB === "string") {
      const dateValueA = new Date(dateA).getTime();
      const dateValueB = new Date(dateB).getTime();

      if (!isNaN(dateValueA) && !isNaN(dateValueB)) {
        return this.checkOperator(
          dateValueA,
          opts?.date?.operator || "$eq",
          dateValueB
        );
      }
    } else if (typeof dateA === "number" && typeof dateB === "number") {
      return this.checkOperator(dateA, opts?.date?.operator || "$eq", dateB);
    }

    return false;
  }

  private deepValue(obj: any, path: string) {
    const keys = path.split(".");
    return keys.reduce(
      (value, key) =>
        value && value[key] !== undefined ? value[key] : undefined,
      obj
    );
  }

  private escapeRegex(str: string) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  }

  private fuzzySearch(str: string, query: string, opts?: FJSOptions): boolean {
    // Implementação da busca fuzzy...
    const searchValue = diacritics.remove(query.toLowerCase());
    const text = diacritics.remove(str.toLowerCase());

    if (text.includes(searchValue)) {
      return true;
    }

    const score = this.calculateFuzzyScore(text, searchValue);
    return score >= (opts?.fuzzyThreshold ?? 0.8);
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
