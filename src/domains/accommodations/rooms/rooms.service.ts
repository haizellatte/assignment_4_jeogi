import { BadRequestException, Injectable } from "@nestjs/common";
import {
  Accommodation,
  Partner,
  Prisma,
  Reservation,
  Review,
  Room,
  User,
} from "@prisma/client";
import { PrismaService } from "src/database/prisma/prisma.service";

@Injectable()
export class RoomsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createRoom(
    accommodationId: Accommodation["id"],
    dataWithoutAccommodationId: Prisma.RoomCreateWithoutAccommodationInput,
  ) {
    const data: Prisma.RoomUncheckedCreateInput = {
      accommodationId,
      ...dataWithoutAccommodationId,
    };
    const room = await this.prismaService.room.create({
      data,
    });

    return room;
  }

  async deleteRoom(roomId: Room["id"]) {
    const deleteRoom = await this.prismaService.room.delete({
      where: { id: roomId },
    });

    return deleteRoom;
  }

  async makeReservation(
    reservedById: Reservation["reservedById"],
    roomId: Reservation["roomId"],
    date: Reservation["date"],
  ) {
    const room = this.prismaService.reservation.update({
      //* extends로 31일까지의 예약을 다 만들어놨기 때문에 create가 아닌 ❗️update로 만든다.
      where: {
        roomId_date: { roomId, date },
      },
      data: {
        reservedAt: new Date(),
        reservedById,
      },
    });

    return room;
  }

  // todo : 8. 파트너가 예약된 숙소에 대해 게스트의 체크인 시간 할당
  async setUserChekedAt(
    partner: Pick<Partner, "id">,
    roomId: Reservation["roomId"],
    date: Reservation["date"],
  ) {
    const reservedRoomOfCheckedAtTime =
      await this.prismaService.reservation.update({
        where: {
          roomId_date: { roomId, date },
          room: {
            accommodation: {
              partnerId: partner.id,
            },
          },
        },
        data: {
          CheckedInAt: new Date(),
        },
      });

    return reservedRoomOfCheckedAtTime;
  }

  // todo : 9. 체크인한 (checkedAt이 존재한) reservaition에 대해 유저는 리뷰 생성 가능
  async createReview(
    user: Pick<User, "id">,
    reservationId: Reservation["id"],
    rating: Review["rating"],
    content?: Review["content"],
  ) {
    const checkedAtOfRoom = await this.prismaService.reservation.findUnique({
      where: {
        reservedById: user.id,
      },
      select: {
        CheckedInAt: true,
      },
      include: {
        room: {
          select: {
            reservations: {
              select: {
                CheckedInAt: true,
              },
            },
          },
        },
      },
    });

    if (!checkedAtOfRoom)
      throw new BadRequestException(
        "리뷰 작성을 위해 체크인시간 등록이 필요합니다.",
      );

    const data: { rating: Review["rating"]; content?: Review["content"] } = {
      rating: rating,
      content: content,
    };

    const review = await this.prismaService.review.create({
      where: {
        userId: user.id,
        reservationId: reservationId,
      },
      data: { ...data },
    });

    return review;
  }

  //todo : 10. 예약 취소하기 (유저/파트너 모두)
  async cancelReservations(reservationId: Reservation["id"]) {
    const reservation = await this.prismaService.reservation.findUnique({
      where: { id: reservationId },
      select: {
        reservedAt: true,
      },
    });

    //* 예약된 내용이 없다면 에러처리
    if (!reservation?.reservedAt) throw new BadRequestException();
    //* 있다면 예약 취소(삭제)
    const cancelReserved = await this.prismaService.reservation.delete({
      where: { id: reservationId },
    });

    return cancelReserved;
  }
}
