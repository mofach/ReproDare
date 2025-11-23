/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // Tambahkan variabel lain disini jika ada
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}