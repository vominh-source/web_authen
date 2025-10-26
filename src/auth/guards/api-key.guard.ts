import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) {}
    canActivate(context: ExecutionContext): boolean  {
        const request = context.switchToHttp().getRequest();
        const apiKey=request.headers['x-api-key'];
        if(!apiKey){
            throw new UnauthorizedException('API key is missing');
        }
        const validKey=this.configService.get<string>('INTERNAL_API_KEY');
        if(apiKey!==validKey){
            throw new UnauthorizedException('Invalid API key');
        }
        return true;
    }
}
