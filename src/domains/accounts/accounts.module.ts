import { Module } from '@nestjs/common';
import { PartnersModule } from './partners/partners.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule, PartnersModule],
})
export class AccountsModule {}
