import React, { useState, useEffect } from "react";
import { ButtonBase } from "@mui/material";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ethers } from "ethers";

import ContractABI from "./Constant/ContractABI";
import FormHeader from "./FormHeader";
import StakeButton from "./StakingButton";
import Navbar from "./Navbar3";

const CONTRACT_ADDRESS = "0xF58d145b4BE7c46B32Af12dA4Fcf6fBC0DED5AbA";
const CONTRACT_ABI = ContractABI;

const Main = () => {
  // State variables
  const [amount, setAmount] = useState(0);
  const [noTokenLeft, setNoTokenLeft] = useState(0);
  const [noTokenPurchased, setNoTokenPurchased] = useState(0);
  const [buyLoading, setBuyLoading] = useState(false);
  const [price, setPrice] = useState(0);
  const [error, setError] = useState(null);

  // Moralis hooks
  const { isWeb3Enabled, account, chainId, Moralis } = useMoralis();
  const isCorrectNetwork = chainId === "0x61"; // BNB Testnet

  // Contract function hooks
  const { runContractFunction: getTokensLeft } = useWeb3Contract({
    abi: CONTRACT_ABI,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "getTokensLeft"
  });

  const { runContractFunction: getTokensPurchased } = useWeb3Contract({
    abi: CONTRACT_ABI,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "getTokensPurchased",
  });

  const { runContractFunction: getTokenPriceInBnb } = useWeb3Contract({
    abi: CONTRACT_ABI,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "getTokenPriceInBnb",
  });

  const { runContractFunction: buyTokens } = useWeb3Contract({
    abi: CONTRACT_ABI,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "buyTokens",
    /* params: {amount} */
  });

  // useEffect hook
  useEffect(() => {
    if (isWeb3Enabled && isCorrectNetwork) {
      updateTokenInfo();
      updateTokenPrice();
    } else {
      setNoTokenLeft(0);
      setNoTokenPurchased(0);
      setPrice(0);
    }
  }, [isWeb3Enabled, isCorrectNetwork]);

  // Helper functions
  const updateTokenInfo = async () => {
    try {
      const tokensLeft = await getTokensLeft();
      const tokensPurchased = await getTokensPurchased();
      
      setNoTokenLeft(Moralis.Units.FromWei(tokensLeft));
      
      setNoTokenPurchased(Moralis.Units.FromWei(tokensPurchased));
    } catch (error) {
      console.error("Error updating token info:", error);
    }
  };

  const updateTokenPrice = async () => {
    try {
      let tokenPrice = (await getTokenPriceInBnb()).toString();
      setPrice(tokenPrice || '0');
    } catch (error) {
      setError(error.message || "Error fetching token price");
    }
  };

  const handleBuy = async (e) => {
    e.preventDefault();
  
    if (!isCorrectNetwork) {
      toast.error("Please switch to the BNB Testnet to make a purchase", {
        containerId: 'notification'
      });
      return;
    }
  
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount", {
        containerId: 'notification'
      });
      return;
    }
  
    setBuyLoading(true);
  
    try {
      // Fetch token price in BNB
      const tokenPriceBnb = ethers.formatEther(await getTokenPriceInBnb());
      console.log("Token price in BNB:", tokenPriceBnb.toString());
  
      // Convert amount to BigNumber
      const tokenAmount = ethers.parseUnits(amount.toString(), 18);
      console.log("Token amount:", tokenAmount.toString());
  
      // Calculate the value (BNB amount to send)
      const oneBNB = ethers.parseUnits("1", 18);
      const value = tokenAmount * tokenPriceBnb / oneBNB;
      console.log("Value to send (in wei):", value.toString());
  
      // Call the buyTokens function on the contract
      await buyTokens({
        params: { tokenAmount: tokenAmount },
        msgValue: value,
        onError: (error) => {
          throw error;
        },
        onSuccess: (tx) => {
          console.log("Transaction hash:", tx.hash);
          toast.success("Transaction submitted! Waiting for confirmation...", {
            containerId: 'notification'
          });
  
          tx.wait(1).then(() => {
            toast.success("Tokens purchased successfully!", {
              containerId: 'notification'
            });
            updateTokenInfo();
            setAmount(0);
          });
        },
      });
  
    } catch (error) {
      console.error("Detailed error:", error);
  
      let errorMessage = "Purchase failed";
      if (error.message) {
        errorMessage += ": " + error.message;
      }
  
      toast.error(errorMessage, {
        containerId: 'notification'
      });
    } finally {
      setBuyLoading(false);
    }
  };
  
  // StakeForm component
  const StakeForm = ({ amount, setAmount, tokenBalance, handleSubmit, buttonText, disabled = false, loading }) => (
    <form onSubmit={handleSubmit}>
      <div className="w-full mt-[8px]">
        <p className="text-right">MAX: {noTokenLeft} FTRS</p>
        <section className="flex justify-end">
          <div className="flex items-center border border-black flex-[2] px-4 mr-[8px]">
            <input
              type="number"
              name="buy"
              id="buy"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-right no-arrows outline-none focus:outline-none border-none text-[24px] font-bold"
              required
            />
            <p className="ml-5 text-[24px] font-[100] tracking-[0.22512px] leading-[1.5]">
              FTRS
            </p>
          </div>
          <ButtonBase
            className="MuiTouchRipple-root"
            onClick={() => setAmount(noTokenLeft)}
            style={{
              backgroundColor: '#6cdf00',
              padding: "20px",
              paddingLeft: "24px",
              paddingRight: "24px",
              fontSize: "14px",
              color: "white",
              borderRadius: "5px",
              textTransform: "uppercase",
              fontWeight: 400,
              letterSpacing: "0.02857em",
              lineHeight: "1.75",
            }}
          >
            Max
          </ButtonBase>
        </section>
        <StakeButton type="submit" buttonText={buttonText} disabled={disabled} loading={loading} />
      </div>
    </form>
  );

  // Main component render
  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} containerId='notification' />
      <Navbar />
      {isWeb3Enabled ? (
        isCorrectNetwork ? (
          <div className="mt-[70px]">
            <article className="pb-[24px] my-[60px] mb-[80px] md:mb-[100px]">
              <h2 className="text-[50px] leading-[56px] font-[400]">
                FUTARES COIN
              </h2>
              <p className="text-[20px] font-[700] leading-[32px]">
                Grow Your Wealth with Futares Coin and Secure the Future.
              </p>
            </article>
            <main className="bg-white text-black rounded-[25px] w-full md:w-[450px] mx-auto p-[16px] pb-0">
              <div className="mb-[24px]">
                <FormHeader leading="Total Tokens" value="240000000 FTRS" />
                <FormHeader leading="Token's Price" value={ethers.formatUnits(price, "ether") + " BNB"} />
                <FormHeader leading="Total Purchased" value={`${noTokenPurchased} FTRS`} />
                <FormHeader leading="No of Tokens Left" value={`${noTokenLeft} FTRS`} />
              </div>
              <StakeForm
                amount={amount}
                setAmount={setAmount}
                tokenBalance={noTokenLeft}
                handleSubmit={handleBuy}
                buttonText="BUY"
                loading={buyLoading}
              />
            </main>
          </div>
        ) : (
          <div className="mt-[70px] text-center">
            <h1>Please switch to the BNB Testnet to use this application.</h1>
          </div>
        )
      ) : (
        <div className="mt-[70px] text-center">
          <h1>Please connect your wallet to Purchase the FTRS COIN.</h1>
          <h2>Making Life Easier.</h2>
        </div>
      )}
    </>
  );
};

export default Main;