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
    date?: {
      operator: string;
    };
  }
  
  export type FJSOperatorFunction = (
    a: any,
    b: any,
    query?:any,
    opts?: FJSOptions
  ) => boolean;
  