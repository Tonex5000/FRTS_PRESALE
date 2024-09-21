import React, { useState, useEffect, useContext } from "react";
import { ButtonBase } from "@mui/material";
import { ethers } from "ethers";
import { BrowserProvider } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import { WalletContext } from './WalletContext';
import 'react-toastify/dist/ReactToastify.css';
import ContractABI from "./Constant/ContractABI";
import FormHeader from "./FormHeader";
import StakeButton from "./StakingButton";
import Navbar from "./Navbar2";

const CONTRACT_ADDRESS = "0xf401b25382AF3F06279c2C568D31d98171974B74";
const CONTRACT_ABI = ContractABI;

const Main = () => {
  const [amount, setAmount] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [noTokenLeft, setNoTokenLeft] = useState(0);
  const [noTokenPurchased, setNoTokenPurchased] = useState(0);
  const [buyLoading, setBuyLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const { account, isCorrectNetwork } = useContext(WalletContext);

  useEffect(() => {
    if (account && isCorrectNetwork) {
      initializeContract();
    } else {
      // Reset contract-related state when not on the correct network
      setContract(null);
      setTokenBalance(0);
      setNoTokenLeft(0);
      setNoTokenPurchased(0);
    }
  }, [account, isCorrectNetwork]);

  const initializeContract = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const newContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        if (typeof newContract.buyTokens !== 'function') {
          throw new Error("Contract does not have the required 'buyTokens' function");
        }
        
        setContract(newContract);
        await updateTokenInfo(newContract);
      } catch (error) {
        console.error("Error initializing contract:", error);
        toast.error(`Failed to initialize contract: ${error.message}`, {
          containerId: 'notification'
        });
      }
    } else {
      toast.error("Ethereum provider not found. Please install MetaMask or another wallet.", {
        containerId: 'notification'
      });
    }
  };

  const updateTokenInfo = async (contractInstance) => {
    try {
      const tokensLeft = await contractInstance.getTokensLeft();
      const tokensPurchased = await contractInstance.getTokensPurchased();

      setNoTokenLeft(ethers.formatUnits(tokensLeft, 18));
      setNoTokenPurchased(ethers.formatUnits(tokensPurchased, 18));
    } catch (error) {
      console.error("Error updating token info:", error);
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
    if (amount <= 0) {
      toast.error("Please enter a valid amount", {
        containerId: 'notification'
      });
      return;
    }
    if (!contract) {
      toast.error("Contract not initialized. Please try reconnecting your wallet.", {
        containerId: 'notification'
      });
      return;
    }
    setBuyLoading(true);
    
    try {
      const tokenPriceBnb = await contract.getTokenPriceInBnb();
      const tokenAmount = ethers.parseUnits(amount.toString(), 18);
      const value = tokenAmount * tokenPriceBnb / (ethers.parseUnits("1", 18));
      
      const tx = await contract.buyTokens(tokenAmount, { value });
      await tx.wait();
      
      toast.success("Tokens purchased successfully", {
        containerId: 'notification'
      });
      await updateTokenInfo(contract);
      setAmount(0);
    } catch (error) {
      console.error("Detailed error:", error);
      let errorMessage = "Purchase failed";
      
      if (error.reason) {
        errorMessage += ": " + error.reason;
      } else if (error.message) {
        errorMessage += ": " + error.message;
      }
      
      if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage += ". The transaction might revert. Check your input amount and contract state.";
      }
      
      toast.error(errorMessage, {
        containerId: 'notification'
      });
    } finally {
      setBuyLoading(false);
    }
  };

  // ... StakeForm component remains the same
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
        <StakeButton type="submit" buttonText={buttonText} disabled={disabled} Loading={loading} />
      </div>
    </form>
  );

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} containerId='notification' />
      <Navbar />
      {account ? (
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
                <FormHeader leading="Token's Price" value="0.015 USD" />
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