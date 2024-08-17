import { Observable } from "rxjs";

export interface GatewayService {
  // findMany(upstream: Observable<any>): Observable<any>;
  // getAllUsers(data: any): Observable<[]>;

  getAllCoinsBalance(data: any): Observable<any>;
  getBalance(data: any): Observable<any>;
  createAccount(data: any): Observable<any>;
  manualFiatDeposit(data: any): Observable<any>;
  getAllCurrency(data: any): Observable<any>;
  withdrawRequest(data: any): Observable<any>;
  adminWithdrawTransactionsListFiat(data: any): Observable<any>;
  depositTransactionsHistory(data: any): Observable<any>;
  withdrawTransactionsHistory(data: any): Observable<any>;
  withdrawCryptoRequest(data: any): Observable<any>;
  withdrawRequestApproval(data: any): Observable<any>;
  fiatWithdrawTransactionsHistory(data: any): Observable<any>;
  cryptoDepositTransactionsForAdmin(data: any): Observable<any>;
  cryptoWithdrawTransactionsForAdmin(data: any): Observable<any>;
  userFiatWithdrawTransactionsForAdmin(data: any): Observable<any>;
  userWithdrawAndDepositTotal(data: any): Observable<any>;
  depositTransactionHistoryOfAllCoins(data: any): Observable<any>;
  coinDetailsBySymbol(data: any): Observable<any>;
  activeCoinList(data: any): Observable<any>;
  currencyList(data: any): Observable<any>;
  updateCurrencyDetails(data: any): Observable<any>;
  updateWithdrawStateForAll(data: any): Observable<any>;
  updateAccountBalance(data: any): Observable<any>;
}
