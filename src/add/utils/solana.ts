import * as anchor from "@project-serum/anchor";
const dotenv = require('dotenv')
dotenv.config()
export let provider: anchor.AnchorProvider
export let wallet: anchor.Wallet
export let program: anchor.Program;

// 3KY is collection authority
const parseCollectionAuthorityFromEnv = () => {
  const COLLECTION_AUTH = process.env.COLLECTION_AUTHORITY
  if (COLLECTION_AUTH === undefined) {
    return undefined
  }
  return COLLECTION_AUTH.split(',').map(Number);
}
// 3AN is mint/metadata authority
const parseMintAuthorityFromEnv = () => {
  const MINT_AUTH = process.env.MINT_AUTHORITY
  if (MINT_AUTH === undefined) {
    return undefined
  }
  return MINT_AUTH.split(',').map(Number);
}

const prepareWallets = async () => {
  let collection_secret = parseCollectionAuthorityFromEnv()
  let mint_secret = parseMintAuthorityFromEnv()

  let providerUrl = process.env.PROVIDER_URL;
  console.log('providerUrl = ', providerUrl)
  if (collection_secret && mint_secret) {
    // @ts-ignore
    let connection: anchor.web3.Connection = new anchor.web3.Connection(providerUrl, "confirmed");
    // @ts-ignore
    let collection_wallet: anchor.Wallet =  new anchor.Wallet(anchor.web3.Keypair.fromSecretKey(new Uint8Array(collection_secret)))
    let mint_wallet: anchor.Wallet =  new anchor.Wallet(anchor.web3.Keypair.fromSecretKey(new Uint8Array(mint_secret)))

    return {
      collection_wallet, 
      mint_wallet, 
      connection
    };
  
  } else {
    throw "fill in env"
  }
}
export default prepareWallets;