import { FJSOperatorFunction } from "./FJSTypes";
import { FJSUtils } from "./FJSUtils";

const utils = new FJSUtils();

export const FJSOperators: { [op: string]: FJSOperatorFunction } = {
  $eq: (a, b, query, opts) => utils.isEqual(a, b, opts),
  $ne: (a, b, query, opts) => !utils.isEqual(a, b, opts),
  $gt: (a, b) => utils.toNumber(a) > utils.toNumber(b),
  $lt: (a, b) => utils.toNumber(a) < utils.toNumber(b),
  $gte: (a, b) => utils.toNumber(a) >= utils.toNumber(b),
  $lte: (a, b) => utils.toNumber(a) <= utils.toNumber(b),
  $in: (a, b, query, opts) => utils.testIn(a, b, opts),
  $nin: (a, b, query, opts) => !utils.testIn(a, b, opts),
  $regex: (a, b, query, opts) => utils.testRegex(a, b, opts),
  $exists: (a, b) => (a !== undefined) === b,
  $startsWith: (a, b, query, opts) => utils.testStringStartsWith(a, b, opts),
  $endsWith: (a, b, query, opts) => utils.testStringEndsWith(a, b, opts),
  $contains: (a, b, query, opts) => utils.testStringContains(a, b, opts),
  $size: (a, b) => Array.isArray(a) && a.length === b,
  $date: (a, b, query, opts) => utils.compareDates(a, b, opts),
};
