/// <reference types="vite/client" />

declare module 'virtual:zip-data' {
  const data: Record<string, [string, string]>;
  export default data;
}
