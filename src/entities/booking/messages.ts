// Messages for refused booking writes. Pure.
import { bookingErrorMessage, type BookingConfig, type BookingError } from "./rules";

export type WriteErrorCode = BookingError | "NOT_FOUND" | "NOT_ALLOWED" | "MEMBER_NOT_FOUND";

export function writeErrorMessage(error: WriteErrorCode, config: BookingConfig): string {
  switch (error) {
    case "NOT_FOUND":
      return "This booking no longer exists. Reload the page.";
    case "NOT_ALLOWED":
      return "This booking can't be changed that way any more. Reload the page.";
    case "MEMBER_NOT_FOUND":
      return "That member no longer exists.";
    default:
      return bookingErrorMessage(error, config);
  }
}
