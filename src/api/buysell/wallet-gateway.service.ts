import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { GatewayService } from "../../common/global/gateway.grpc.interface";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom, lastValueFrom } from "rxjs";
import { GATEWAY_SERVICE_NAME } from "src/constants";
import { ConfigService } from "@nestjs/config";
@Injectable()
export class WalletGatewayService implements OnModuleInit {
  private apiKey: string;
  private gatewayService: GatewayService;

  constructor(
    @Inject(GATEWAY_SERVICE_NAME)
    private readonly clientGateway: ClientGrpc,
    private readonly configService: ConfigService
  ) {
    this.apiKey = this.configService.get<string>("WALLET_API_KEY");
  }

  onModuleInit(): void {
    this.gatewayService =
      this.clientGateway.getService<GatewayService>(GATEWAY_SERVICE_NAME);
  }

  /**
   * get user wallet balance
   * @param clientId
   * @returns
   */
  public async getBalance(data: any): Promise<any> {
    const result = this.gatewayService.getBalance({
      apiKey: this.apiKey,
      ...data,
    });
    return await lastValueFrom(result);
  }

  /**
   * get user wallet balance
   * @param clientId
   * @returns
   */
  public async getAllCoinsBalance(clientId: string): Promise<any> {
    const data = {
      clientId,
      apiKey: this.apiKey,
    };
    const result = this.gatewayService.getAllCoinsBalance(data);
    return await firstValueFrom(result);
  }

  /**
   * lock unlock grpc function for wallet gateway
   * @param data
   * @returns
   */
  /* 
 */
  public async updateAccountBalance(data: any): Promise<any> {
    data.apiKey = this.apiKey;
    const result = this.gatewayService.updateAccountBalance(data);
    return await firstValueFrom(result);
  }
}
