import { Global, Module } from '@nestjs/common';
import { ZatcaService } from './zatca.service';

@Global()
@Module({
  providers: [ZatcaService],
  exports: [ZatcaService],
})
export class ZatcaModule {}
