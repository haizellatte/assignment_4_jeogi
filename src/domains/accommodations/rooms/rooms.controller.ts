import { Body, Controller, Param, ParseIntPipe, Post } from "@nestjs/common";
import { Partner, User } from "@prisma/client";
import { DPartner } from "src/decorators/partner.decorator";
import { Private } from "src/decorators/private.decorator";
import { DUser } from "src/decorators/user.decorator";
import day from "src/utils/day";
import { RoomsService } from "./rooms.service";

@Controller("/accommodations/:accommodationId/rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  //* room 예약
  @Post("/:roomId/reservations")
  @Private("user")
  makeReservations(
    @DUser() user: User,
    @Param("roomId", ParseIntPipe) roomId: number,
    @Body("date") date: string,
  ) {
    return this.roomsService.makeReservation(
      user.id,
      roomId,
      day(date).startOf("day").toDate(),
    );
  }

  //* 8. 체크인 시간 부여
  @Post("/:roomId/:reservationId/set-checkedat")
  @Private("partner")
  setUserCheckedAt(
    @DPartner() partner: Partner,
    @Param("roomId", ParseIntPipe) roomId: number,
    @Body("date") date: string,
  ) {
    return this.roomsService.setUserChekedAt(
      partner,
      roomId,
      day(date).startOf("day").toDate(),
    );
  }

  //* 9. 리뷰 작성
  @Post("/:roomId/:reservationId/review")
  @Private("user")
  createReview(
    @DUser() user: User,
    @Param("reservationId") reservationId: string,
    @Body("rating") rating: number,
    @Body("content") content?: string,
  ) {
    return this.roomsService.createReview(user, reservationId, rating, content);
  }

  //* 10. 예약 취소하기
  @Post("/:roomId/:reservationId/cancel")
  @Private("partner")
  @Private("user")
  cancelReservations(@Param("reservationId") reservationId: string) {
    return this.roomsService.cancelReservations(reservationId);
  }
}
