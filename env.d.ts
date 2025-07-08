/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_FACTORY_ADDRESS_ETHEREUM: string
    readonly VITE_FACTORY_ADDRESS_SEPOLIA: string
    readonly VITE_FACTORY_ADDRESS_BSC: string
    readonly VITE_FACTORY_ADDRESS_BSC_TESTNET: string
    readonly VITE_FACTORY_ADDRESS_POLYGON: string
    readonly VITE_FACTORY_ADDRESS_POLYGON_MUMBAI: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
  