import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { 
  COLLECTION_AUTH,
  MINT_AUTH,
  EYE_OF_ELERIAH_COLLECTION_MINT
} from './data/constants';
import {
  updateCollection,
  verifyCollection
} from './utils/utils'
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { programs } from "@metaplex/js";
import prepareWallets from "./utils/solana";
const { metadata: { MetadataData, MetadataProgram } } = programs;
import eye_of_eleriah_mints from './data/eyes.json'
import * as display from './utils/display'

// ! .zshrc file -> should be 3KY keypair
let provider = anchor.AnchorProvider.env()
anchor.setProvider(provider);

const create_collection = async () => {
  try {
    // init admin private key to sign transactions
    let {
      collection_wallet: collection_authority,
      mint_wallet: mint_authority,
      connection: connection
    } = await prepareWallets();

    // loop through all mints in collection
    for (let mint of eye_of_eleriah_mints) {
      console.log('-------------------------------')
      console.log(`${display.cyan}mint: `, mint)
      let mintPK = new PublicKey(mint)
      // extract metadata from mint
      const metadataPDA = await programs.metadata.Metadata.getPDA(mintPK);
      console.log(`${display.cyan}metadataPDA: `, metadataPDA.toString())

      // transaction for everything, payer is 3KY
      let trx = new anchor.web3.Transaction({feePayer: collection_authority.publicKey})

      // update metadata.collection to new collection_mint
      let updateCollectionIx = await updateCollection(
        connection,
        mintPK,
        mint_authority.publicKey, // authority
        EYE_OF_ELERIAH_COLLECTION_MINT // collection
      );
      trx.add(updateCollectionIx)
          
      // verify collection
      const verifyCollectionIx = await verifyCollection(
        metadataPDA, 
        collection_authority.publicKey, // collection authority
        collection_authority.publicKey, // payer
        EYE_OF_ELERIAH_COLLECTION_MINT,
      );
      trx.add(verifyCollectionIx)

      // check collection was added and verified
      const metadata = await connection.getAccountInfo(metadataPDA);
      if (!metadata) {
        throw `${display.red}failed to find metadata`
      }
      // try MetadataV2
      let [metadataData, _] = Metadata.fromAccountInfo(metadata);

      if (!metadataData.collection) {
        throw `${display.red}failed to add collection`
      }

      let recover_collection_key: PublicKey = new PublicKey(metadataData.collection.key);
      console.log(`${display.cyan}new collection: `, recover_collection_key.toString())

      // send and confirm Transaction, signed by collection_auth & mint_auth
      await collection_authority.signTransaction(trx)
      await mint_authority.signTransaction(trx)
      await provider.sendAndConfirm(trx, [collection_authority.payer, mint_authority.payer])
    }

  } catch (err) {
    console.log(`${display.red}${display.bomb}ERROR`, err)
  }
}
(async () => {
  try {
    await create_collection();
  } catch (e) {
    console.log(e);
  }
})();