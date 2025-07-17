"use client"
import React, { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
export default function BasicInfo() {

  const { address } = useAccount();
  const { data: balanceData } = useBalance({
    address
  });
  // const { data: rccBalanceData } = useBalance({
  //   address,
  //   token: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  // });
  return (
    <div>
      <p>Address: {address}</p>
      <p>ETH Balance: {balanceData ? formatUnits(balanceData.value, 18) : ''}</p>
      {/* <p>RCC Balance: {rccBalanceData?.formatted}</p> */}
    </div>
  )
}