"use client"
import { useState, useEffect } from "react"
import { viemClients } from "../../utils/client"
import { STAKE_CONTRACT_ADDRESS } from "../../config/consts"
import { stakeAbi } from "../../config/abi"
import Button from '@mui/material/Button'
import { getContract, parseEther } from "viem"
import { sepolia } from "viem/chains";
import { useSignMessage, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
const UseContract = () => {
  const sepoliaClient = viemClients(sepolia.id);
  const { signMessageAsync } = useSignMessage()
  const { writeContractAsync } = useWriteContract()
  const [txHash, setTxHash] = useState<`0x${string}`>();
  async function readContract() {
    const result = await sepoliaClient.readContract({
      address: STAKE_CONTRACT_ADDRESS,
      abi: stakeAbi,
      functionName: 'ETH_PID',
    })
    // const result = await getContract({
    //   abi: stakeAbi,
    //   address: STAKE_CONTRACT_ADDRESS,
    //   client: {
    //     public: viemClients(sepolia.id),
    //     // wallet: signer,
    //   },
    // })
    console.log('read contract:', result)
  }
  const sign = async () => {
    const signature = await signMessageAsync({
      message: 'hello'
    })
    console.log(signature);
  }
  const {
    isLoading,
    isSuccess,
    isError,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess && receipt) {
      console.log('交易确认成功，回执：', receipt)
      // 你可以在这里执行下一步逻辑
    }
  }, [isSuccess, receipt])
  const writeContract = async () => {
    try {
      const hash = await writeContractAsync({
        abi: stakeAbi,
        address: STAKE_CONTRACT_ADDRESS,
        functionName: 'depositETH',
        value: parseEther('0.001'),
      })
      console.log(hash);
      setTxHash(hash);

    } catch (error) {
      console.log(error);
    }
  }
  return (
    <div>
      <Button onClick={readContract}>read contract</Button>
      <Button onClick={sign}>sign</Button>
      <Button onClick={writeContract}>write contract</Button>
      {isLoading && <p>等待确认中...</p>}
      {isSuccess && (
        <div>
          <h4>交易已确认！</h4>

        </div>
      )}
      {isError && <p>等待交易确认失败！</p>}
    </div>
  )
}

export default UseContract;