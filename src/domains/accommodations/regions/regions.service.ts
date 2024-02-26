import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class RegionsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getRegions() {
    const regions = await this.prismaService.regions.findMany({
      orderBy: {
        label: 'asc',
      },
    });

    return regions;
  }
}
