interface ObjectConstructor {
  assign<T>(t: T, ...objects:any[]): T;
}

interface NumberConstructor {
  isFinite(n: number): boolean;
}

