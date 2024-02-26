import { ForbiddenException, Injectable } from "@nestjs/common";
import {
  Accommodation,
  AccommodationType,
  Partner,
  Prisma,
  Room,
} from "@prisma/client";
import * as fs from "fs/promises";
import { PrismaService } from "src/database/prisma/prisma.service";
import { RoomsService } from "./rooms/rooms.service";

@Injectable()
export class AccommodationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly roomsService: RoomsService,
  ) {}

  //todo : create
  async createAccommodation(data: Prisma.AccommodationUncheckedCreateInput) {
    const accommodation = await this.prismaService.accommodation.create({
      data,
    });
    return accommodation;
  }

  //todo : Get-many
  async getAccommodations(type?: AccommodationType) {
    const accommodation = await this.prismaService.accommodation.findMany({
      where: { type },
    });
    return accommodation;
  }

  //todo : Get-only
  async getAccommodation(accommodationId: number) {
    const accommodation = await this.prismaService.accommodation.findUnique({
      where: { id: accommodationId },
      include: {
        rooms: true,
      },
    });
    return accommodation;
  }

  //todo : add-Room
  async addRoomToAccommodation(
    partner: Pick<Partner, "id">,
    accommodationId: Accommodation["id"],
    data: Parameters<typeof this.roomsService.createRoom>[1],
  ) {
    //* 1. 지금 요청한 partner가 현재 accommodation의 소유자가 맞는지 확인
    const accommodation = await this.prismaService.accommodation.findUnique({
      where: { id: accommodationId, partnerId: partner.id },
    });

    //* 1-1. 아니면 돌아가~
    if (!accommodation) throw new ForbiddenException();

    //* 2. 맞다면 숙소에 방을 추가 --> rooms.service에서 create
    const room = await this.roomsService.createRoom(accommodationId, data);

    return room;
  }

  //todo : delete-Room
  async deleteRoomFromAccommodation(
    partner: Pick<Partner, "id">,
    accommodationId: Accommodation["id"],
    roomId: Room["id"],
  ) {
    //* 1. 지금 요청한 partner가 현재 accommodation의 소유자가 맞는지 확인
    const accommodation = await this.prismaService.accommodation.findUnique({
      where: {
        id: accommodationId,
        partnerId: partner.id,
      },
    });
    //* 1-1. 아니면 돌아가~
    if (!accommodation) throw new ForbiddenException();

    //* 2. 맞다면 RoomId에 해당하는 방 삭제
    const deleteRoom = await this.roomsService.deleteRoom(roomId);

    return deleteRoom;
  }

  //todo :이미지 업로드
  async addImageToAccommodation(
    partner: Pick<Partner, "id">,
    accommodationId: Accommodation["id"],
    file: Express.Multer.File,
  ) {
    const accommodation = await this.prismaService.accommodation.findUnique({
      where: { id: accommodationId, partnerId: partner.id },
    });
    if (!accommodation) throw new ForbiddenException();

    console.log(file);
    await fs.writeFile(`./public/${file.originalname}`, file.buffer);

    return "파일이 정상적으로 업로드되었습니다.";
  }
}

/*
! ✨ roomsData의 Type을 지정하는 2가지 방법
* 1. Parameters 사용
* 👉 예시) roomsData: Parameters<typeof this.roomsService.createRoom>[1];

* 2. Prisma.RoomCreateWithoutAccommodationInput 사용 (= Prisma 스키마에서 타입 가저오기)
* 👉 예시)  restRoomData: Prisma.RoomCreateWithoutAccommodationInput;
*/
