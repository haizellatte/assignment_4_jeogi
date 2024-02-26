import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Partner, Prisma } from "@prisma/client";
import { compare, hash } from "bcrypt";
import { sign } from "jsonwebtoken";
import { nanoid } from "nanoid";
import { PrismaService } from "src/database/prisma/prisma.service";
import { PartnersLogInDto, PartnersSignUpDto } from "./partners.dto";

@Injectable()
export class PartnersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(dto: PartnersSignUpDto) {
    const { email, password, businessName, phoneNmber, staffName } = dto;
    const sinUpData: Prisma.PartnerCreateInput = {
      id: nanoid(),
      email: email,
      encryptedPassword: await hash(password, 15),
      businessName: businessName,
      phoneNmber: phoneNmber,
      staffName: staffName,
    };

    const partner = await this.prismaService.partner.create({
      data: sinUpData,
      select: { id: true, email: true, businessName: true },
    });
    const accessToken = this.generateAccessToken(partner);

    return accessToken;
  }

  async logIn(dto: PartnersLogInDto) {
    const { email, password } = dto;
    if (!email.trim()) throw new BadRequestException("No email");
    if (!password.trim()) throw new BadRequestException("No password");

    const partner = await this.prismaService.partner.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        encryptedPassword: true,
      },
    });
    if (!partner) throw new NotFoundException("No partner Found");

    const isCorrectPassword = await compare(
      password,
      partner.encryptedPassword,
    );
    if (!isCorrectPassword) throw new BadRequestException("Invalid password");

    const accessToken = this.generateAccessToken(partner);
    return accessToken;
  }

  //! AccessToken을 만드는 함수
  generateAccessToken(partner: Pick<Partner, "id" | "email">) {
    const { id: subject, email } = partner;

    const secretKey = this.configService.getOrThrow<string>("JWT_SECRET_KEY");

    const accessToken = sign({ email, accountType: "partner" }, secretKey, {
      subject,
      expiresIn: "5d",
    });

    return accessToken;
  }
}
