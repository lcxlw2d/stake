import { sepolia } from "viem/chains";
import { PublicClient, createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const rpcServerUrl = `https://sepolia.infura.io/v3/24704e9c4ee645e5a554ce2c53a0e20b`
export const viemClients = (chaiId: number): PublicClient => {
  const clients: {
    [key: number]: PublicClient
  } = {
    [sepolia.id]: createPublicClient({
      chain: sepolia,
      transport: http(rpcServerUrl)
    })
  }
  return clients[chaiId]
}
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
// from https://cloud.walletconnect.com/
const ProjectId = '78ec246eec13fc2202c32ebba6bee01d'

export const config = getDefaultConfig({
  appName: 'MetaNode Stake',
  projectId: ProjectId,
  chains: [
    sepolia
  ],
  transports: {
    [sepolia.id]: http(rpcServerUrl)
  },
  ssr: true,
});

export const defaultChainId: number = sepolia.id