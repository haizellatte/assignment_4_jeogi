import { faker } from "@faker-js/faker/locale/ko";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, User } from "@prisma/client";
import { compare, hash } from "bcrypt";
import { sign } from "jsonwebtoken";
import { nanoid } from "nanoid";
import { PrismaService } from "src/database/prisma/prisma.service";
import { UserLogInDto, UsersSignUpDto } from "./user.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(dto: UsersSignUpDto) {
    const { email, password } = dto;
    //* Prisma.UserCreateInput : prisma에서 User Model에서 필요한 데이터 value
    //* Prisma.UserCreateArgs : prisma에서 User Model에서 필요한 데이터 key:value --> {data :data}
    const sinUpData: Prisma.UserCreateInput = {
      id: nanoid(),
      email: email,
      encryptedPassword: await hash(password, 15),
      profile: {
        create: {
          nickname: faker.music.songName(),
        },
      },
    };

    const user = await this.prismaService.user.create({
      data: sinUpData,
      select: { id: true, email: true },
    });
    const accessToken = this.generateAccessToken(user);

    return accessToken;
  }

  async logIn(dto: UserLogInDto) {
    const { email, password } = dto;
    if (!email.trim()) throw new BadRequestException("No email");
    if (!password.trim()) throw new BadRequestException("No password");

    const user = await this.prismaService.user.findUnique({
      where: { email },
      select: { id: true, email: true, encryptedPassword: true },
    });
    if (!user) throw new NotFoundException("No user Found");

    const isCorrectPassword = await compare(password, user.encryptedPassword);
    if (!isCorrectPassword) throw new BadRequestException("Invalid password");

    const accessToken = this.generateAccessToken(user);
    return accessToken;
  }

  //! AccessToken을 만드는 함수
  generateAccessToken(user: Pick<User, "id" | "email">) {
    const { id: subject, email } = user;

    const secretKey = this.configService.getOrThrow<string>("JWT_SECRET_KEY");

    const accessToken = sign({ email, accountType: "user" }, secretKey, {
      subject,
      expiresIn: "5d",
    });

    return accessToken;
  }
}
