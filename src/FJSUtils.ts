import diacritics from "diacritics";
import { FJSOptions } from "./FJSTypes";

export class FJSUtils {
  public isEqual(value1: any, value2: any, FJSOptions?: FJSOptions) {
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

  public toNumber(value: any): number {
    const conversionMap: { [type: string]: (value: any) => number } = {
      number: (val) => val,
      string: (val) => parseFloat(val),
    };

    const conversionFunction = conversionMap[typeof value];
    return conversionFunction ? conversionFunction(value) : NaN;
  }

  public testIn(a: any, b: any, opts?: FJSOptions): boolean {
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

  public testRegex(a: any, b: any, opts?: FJSOptions) {
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

  public testStringStartsWith(a: any, b: any, opts?: FJSOptions) {
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

  public testStringEndsWith(a: any, b: any, opts?: FJSOptions) {
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

  public testStringContains(a: any, b: any, opts?: FJSOptions): boolean {
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

  private escapeRegex(str: string) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  }

  public compareDates(dateA: any, dateB: any, opts: FJSOptions = {}): boolean {
    return false;
  }
}
