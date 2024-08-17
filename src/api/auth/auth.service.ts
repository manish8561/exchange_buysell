import { Global, Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { ClientGrpc } from "@nestjs/microservices";
import { Observable } from "rxjs";

interface UserService {
  findOne(data: any): Observable<any>;
  findMany(upstream: Observable<any>): Observable<any>;
  getAllUsers(data: any): Observable<[]>;
}

interface AdminService {
  findAdminOne(data: any): Observable<any>;
  findAdminMany(upstream: Observable<any>): Observable<any>;
}

@Global()
@Injectable()
export class AuthService implements OnModuleInit {
  private userService: UserService;
  private adminService: AdminService;
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    @Inject("USER_PACKAGE") private readonly client: ClientGrpc,
    @Inject("ADMIN_PACKAGE") private readonly clientAdmin: ClientGrpc
  ) {}

  onModuleInit() {
    this.userService = this.client.getService<UserService>("UserService");
    this.adminService =
      this.clientAdmin.getService<AdminService>("AdminService");
  }

  async verify(token: string) {
    const secret = await this.configService.get("JWT_SECRET");
    return await this.jwtService.verifyAsync(token, {
      secret,
    });
  }

  getById(id: string): Observable<any> {
    return this.userService.findOne({ id });
  }

  getAdminById(id: string): Observable<any> {
    return this.adminService.findAdminOne({ id });
  }
}
