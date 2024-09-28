import React, { useState, useEffect } from 'react';
import { ethers, BrowserProvider } from 'ethers';
import ContractABI from './Constant/ContractABI';

const contractABI = ContractABI;

const contractAddress = "0xB6478FE0F82b2a6D41Dc4CCaE612C8b8382941BC"; // Replace with actual contract address

const TokenPresale = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [tokenPrice, setTokenPrice] = useState(null);
  const [tokensLeft, setTokensLeft] = useState(null);
  const [tokensPurchased, setTokensPurchased] = useState(null);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const init = async () => {
      setDebugInfo('Initializing...');
      if (typeof window.ethereum !== 'undefined') {
        try {
          setDebugInfo('Requesting account access...');
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          setDebugInfo('Creating Web3Provider...');
          const provider = new BrowserProvider(window.ethereum);
          setProvider(provider);

          setDebugInfo('Getting signer...');
          const signer = await provider.getSigner();
          setSigner(signer);

          setDebugInfo('Creating contract instance...');
          const contract = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(contract);

          setDebugInfo('Initialization complete. Updating contract data...');
          await updateContractData(contract);
        } catch (error) {
          console.error("Initialization error:", error);
          setStatus("Failed to connect. Check console for details.");
          setDebugInfo(`Initialization error: ${error.message}`);
        }
      } else {
        setStatus("Please install MetaMask to use this app.");
        setDebugInfo('MetaMask not detected');
      }
    };

    init();
  }, []);

  const updateContractData = async (contract) => {
    try {
      setDebugInfo('Updating token price...');
      const price = await contract.getTokenPriceInBnb();
      setTokenPrice(ethers.formatEther(price));

      setDebugInfo('Updating tokens left...');
      const left = await contract.getTokensLeft();
      setTokensLeft(ethers.formatEther(left));

      setDebugInfo('Updating tokens purchased...');
      const purchased = await contract.getTokensPurchased();
      setTokensPurchased(ethers.formatEther(purchased));

      setDebugInfo('Contract data updated successfully');
    } catch (error) {
      console.error("Error updating contract data:", error);
      setDebugInfo(`Error updating contract data: ${error.message}`);
    }
  };

  const handleBuyTokens = async () => {
    if (contract && amount) {
      try {
        setStatus('Processing transaction...');
        setDebugInfo('Preparing to buy tokens...');
        const amountInWei = ethers.parseEther(amount);
        const price = ethers.parseEther(tokenPrice);
        const value = amountInWei * price / ethers.parseEther('1');
        
        setDebugInfo(`Calling buyTokens with amount: ${amountInWei.toString()} and value: ${value.toString()}`);
        const tx = await contract.buyTokens(amountInWei, { value });
        
        setDebugInfo('Transaction sent. Waiting for confirmation...');
        await tx.wait();
        
        setStatus(`Successfully purchased ${amount} tokens!`);
        setDebugInfo('Transaction confirmed. Updating contract data...');
        await updateContractData(contract);
      } catch (error) {
        console.error("Error buying tokens:", error);
        setStatus("Transaction failed. Check console for details.");
        setDebugInfo(`Error buying tokens: ${error.message}`);
      }
    }
  };

  return (
    <div>
      <h1>Token Presale</h1>
      <p>Token Price: {tokenPrice ? `${tokenPrice} BNB` : 'Loading...'}</p>
      <p>Tokens Left: {tokensLeft ?? 'Loading...'}</p>
      <p>Tokens Purchased: {tokensPurchased ?? 'Loading...'}</p>
      <input
        type="number"
        placeholder="Amount of tokens"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleBuyTokens}>Buy Tokens</button>
      {status && <p>Status: {status}</p>}
      <div>
        <h3>Debug Information:</h3>
        <pre>{debugInfo}</pre>
      </div>
    </div>
  );
};

export default TokenPresale;