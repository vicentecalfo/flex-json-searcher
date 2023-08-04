import { FJSSearchResult, FJSOptions, FJSOperatorFunction } from "./FJSTypes";
import { FJSOperators } from "./FJSOperators";

export class FJS {
  private data: any[];
  private operators: { [op: string]: FJSOperatorFunction };

  constructor(data: any[]) {
    this.data = data;
    this.operators = FJSOperators;
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
        return this.matchQuery(fieldValue, searchValue, FJSOptions);
      } else if (isObjectWithOperators(searchValue)) {
        for (const operator in searchValue) {
          const searchOperator = searchValue[operator];
          if (
            !this.checkOperator(
              fieldValue,
              operator,
              searchOperator,
              query,
              FJSOptions
            )
          ) {
            return false;
          }
        }
        return true;
      } else {
        return this.checkOperator(
          fieldValue,
          "$eq",
          searchValue,
          query,
          FJSOptions
        );
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
    query?: any,
    FJSOptions?: FJSOptions
  ): boolean {
    const FJSOperatorFunction = this.operators[operator];
    return FJSOperatorFunction
      ? FJSOperatorFunction(fieldValue, searchValue, query, FJSOptions)
      : false;
  }

  private deepValue(obj: any, path: string) {
    const keys = path.split(".");
    return keys.reduce(
      (value, key) =>
        value && value[key] !== undefined ? value[key] : undefined,
      obj
    );
  }
}
