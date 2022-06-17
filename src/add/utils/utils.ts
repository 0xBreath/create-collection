import * as anchor from "@project-serum/anchor";
import { Connection, programs } from "@metaplex/js";
import {
  PublicKey
} from "@solana/web3.js";
import {
  createUpdateMetadataAccountV2Instruction,
  DataV2,
  Metadata,
  Data
} from "@metaplex-foundation/mpl-token-metadata";
import { BN } from "bn.js";
const Transaction = programs.core.Transaction;
const { metadata: { MetadataProgram, MasterEdition } } = programs;

export async function updateCollection(
    connection: Connection,
    mint: PublicKey,
    authority: PublicKey,
    collection_mint: PublicKey
  ): Promise<anchor.web3.TransactionInstruction> {
  
    // update metadata account
    const metadata_info: Data = (await getMetadata(connection, mint)).data
    
    let metadata_instruction = await updateMetadata(
      mint,
      metadata_info,
      authority,
      collection_mint
    );
  
    return metadata_instruction;
}
  
export const updateMetadata = async (
    mintKey: anchor.web3.PublicKey,
    info: Data,
    creator: anchor.web3.PublicKey,
    collection: anchor.web3.PublicKey
): Promise<anchor.web3.TransactionInstruction> => {
    // Retrieve metadata
    const metadata = await programs.metadata.Metadata.getPDA(mintKey);
    let data: DataV2 = {
      name: info.name,
      symbol: info.symbol,
      uri: info.uri,
      sellerFeeBasisPoints: info.sellerFeeBasisPoints,
      creators: info.creators,
      collection: collection ? { key: collection, verified: false} : null,
      uses: null,
    }
  
    const instruction = createUpdateMetadataAccountV2Instruction(
      {
        metadata: metadata,
        updateAuthority: creator,
      },
      { updateMetadataAccountArgsV2: {
          data: data, 
          updateAuthority: creator,
          primarySaleHappened: false,
          isMutable: true
        } 
      }
    );
    
    return instruction;
};
  
export const verifyCollection = async (
    metadata: PublicKey,
    collectionAuthority: PublicKey,
    payer: PublicKey,
    collectionMint: PublicKey,
): Promise<programs.metadata.VerifyCollection> => {
    const collectionMasterEdition = await MasterEdition.getPDA(collectionMint)
    const collectionMetadata = await programs.metadata.Metadata.getPDA(collectionMint);
  
    const collectionIx = new programs.metadata.VerifyCollection(
      { feePayer: payer },
      {
        metadata: metadata,
        collectionAuthority: collectionAuthority,
        collectionMint: collectionMint,
        collectionMetadata: collectionMetadata,
        collectionMasterEdition: collectionMasterEdition,
      }
    );

    return collectionIx;
}

export const getMetadata = async (
    connection: anchor.web3.Connection,
    mint: anchor.web3.PublicKey
): Promise<Metadata> => {
      // Retrieve existing metadata
      const metadataPDA = await programs.metadata.Metadata.getPDA(mint);
      const metadata = await connection.getAccountInfo(
        metadataPDA
      );
      if (!metadata) {
        throw 'failed to find creature metadata'
      } else {
        // try MetadataV2
        let [metadataData, _] = Metadata.fromAccountInfo(metadata);
        return metadataData
      }
};