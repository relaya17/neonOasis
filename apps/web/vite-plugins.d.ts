declare module '@vitejs/plugin-react' {
  import type { Plugin } from 'vite';
  interface ReactOptions {
    jsxRuntime?: 'classic' | 'automatic';
    jsxImportSource?: string;
    babel?: any;
  }
  function react(options?: ReactOptions): Plugin;
  export default react;
}
