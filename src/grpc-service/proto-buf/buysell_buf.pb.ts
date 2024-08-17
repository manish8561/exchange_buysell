export const BUYSELL_PACKAGE_NAME = "buysell";

export interface BuySellServiceClient {
  getUsersList(request: any);
  getKycList(request: any);
  updateKycStatusById(request: any);
  getUserById(request: any);
  blockUserById(request: any);
  getUserListCsv(request: any);
  getUserFeedbackList(request: any);
  getTotalUser(request: any);
}

export const BUYSELL_SERVICE_NAME = "BuySellService";
