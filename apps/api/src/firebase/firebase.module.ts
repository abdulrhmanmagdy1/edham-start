import { Global, Module } from '@nestjs/common';
import { DeviceTokenStore } from './device-token.store';
import { FirebaseService } from './firebase.service';

@Global()
@Module({
  providers: [FirebaseService, DeviceTokenStore],
  exports: [FirebaseService, DeviceTokenStore],
})
export class FirebaseModule {}
