import * as dayjs from "dayjs";
import "dayjs/locale/ko";
import * as timezone from "dayjs/plugin/timezone";
import * as utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ko"); // use locale globally
dayjs.tz.setDefault("Asia/Seoul");

export default function day(...args: Parameters<typeof dayjs>) {
  return dayjs(...args);
}
