export const NFT_PACKAGE_NAME = "nft";

export interface NftServiceClient {
  createNft(request: any);
  addGalleryImages(request: any);
  removeGalleryImages(request: any);
  getNftsList(request: any);
  updateNftType(request: any);
  updateFeatured(request: any);
  getNftsHistoryList(request: any);
  getNftByTitle(request: any);
  getNftCount(request: any);
}

export const NFT_SERVICE_NAME = "NftService";
