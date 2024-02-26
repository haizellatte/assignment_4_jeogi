import { fakerKO } from "@faker-js/faker";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient, Room, User } from "@prisma/client";
import { nanoid } from "nanoid";
import day from "src/utils/day";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    this.setMiddlewares();

    // this.extends();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async setMiddlewares() {
    this.$use(async (params, next) => {
      const model = params.model;
      const action = params.action;
      const result = await next(params); //* next : extends의 query랑 같은 역할 ❗️

      //todo : room 생성 시 -> 룸에 대한 예약을 종료일(3/31일)까자 미리 다 생성 해 놓으려고 작업!
      if (model === "Room" && action === "create") {
        const room = result as Room;
        //* 👉 예약 생성해주기
        const startDate = day().startOf("day");
        const endDate = day("2024-03-31");
        const diffInDay = endDate.diff(startDate, "day") + 1;

        const promises = Array(diffInDay)
          .fill(0)
          .map((_, index) => {
            const date = startDate.add(index, "day").toDate();
            return this.reservation.create({
              data: {
                id: nanoid(),
                date,
                roomId: room.id,
              },
            });
          });

        await Promise.all(promises);
      }

      //todo : usert 생성 시 (회원가입 시) userProfile 자동 생성
      if (model === "User" && action === "create") {
        const user = result as User;

        await this.userProfile.create({
          data: { userId: user.id, nickname: fakerKO.animal.bear() },
        });
      }

      return result;
    });
  }

  // extends() {
  //   this.$extends({
  //     query: {
  //       user: {
  //         async create({ args, query }) {
  //           args.data = {
  //             ...args.data,
  //             profile: {
  //               create: {
  //                 nickname: faker.internet.displayName(),
  //               },
  //             },
  //           };
  //           return query(args);
  //         },
  //       },
  //       accommodation: {
  //         async findMany({ args, query }) {
  //           //! room 생성 시 -> 룸에 대한 예약을 3/31일까지 미리 다 생성 해 놓으려고 작업!
  //           const room = await query(args);
  //           const startDate = dayjs();
  //           const endDate = dayjs("2024-03-31");

  //           const dateDiff = endDate.diff(startDate, "date");
  //           console.log("dateDiff", dateDiff);

  //           /*
  //           todo 여기다가 예약 만들어두기
  //           * 1. 오늘 날짜 파악하고
  //           * 2. 3/31까지를 배열로 만들어서 돌리기
  //           */

  //           return room;
  //         },
  //       },
  //     },
  //   });
  // }
}
