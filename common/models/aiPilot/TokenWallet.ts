import { getMonthDifference } from "common/format/date";
import { Model, UserModelAction } from "../Model";
import { DeepPartial, mergeDeep } from "../utils";

export class TokenWallet extends Model {
  /**
   * The project ID associated with the token tracking.
   *
   * `projectId + year + month` is unique.
   */
  public projectId: string = "";

  public monthlyAllowance: number = 500;
  public emergencyLimit: number = 250;

  /**
   * Current usage of the (use or lose) tokens for the month.
   *
   * Disable when this reaches the monthlyAllowance + emergencyLimit.
   *
   * Set to 0 at the beginning of each month.
   * If we used more than the allowance, subtract the overage from the allowance.
   */
  public monthlyUsage: number = 0;

  /**
   * The last time the monthly balance was refilled.
   */
  public lastRefillMonth: string = TokenWallet.convertDate();

  /**
   * Prepaid balance of tokens purchased by the user.
   */
  public prepaidBalance: number = 0;

  /**
   * Prepaid batches of tokens purchased by the user.
   */
  public prepaidBatches: {
    tokens: number;
    purchasedAt: number;
    expiresAt: number;
  }[] = [];

  public created: Omit<UserModelAction, "active"> = {
    userId: "",
    displayName: "",
    date: Math.floor(Date.now() / 1000),
  };

  constructor(data?: DeepPartial<TokenWallet>) {
    super();

    if (data) {
      this.assign(data);
    }
  }

  assign(data: DeepPartial<TokenWallet>) {
    mergeDeep(this, data);
  }

  clone(): TokenWallet {
    return new TokenWallet(JSON.parse(JSON.stringify(this)));
  }

  /**
   * Check if the wallet needs a monthly refill
   *
   * @param currentMonth
   * @returns
   */
  needsMonthlyRefill(currentMonth?: string): boolean {
    if (!currentMonth) {
      currentMonth = TokenWallet.convertDate();
    }
    return this.lastRefillMonth < currentMonth;
  }

  /**
   * Split the requested tokens between monthly and prepaid balances
   *
   * @param totalTokens
   * @returns
   */
  splitTokens(totalTokens: number): {
    fromMonthly: number;
    fromPrepaid: number;
  } {
    const availableMonthly = this.monthlyAllowance - this.monthlyUsage;

    let remainingTokens = totalTokens;
    let fromPrepaid = 0;
    let fromMonthly = 0;

    // 1. use the included monthly tokens first
    if (availableMonthly > 0) {
      const useMonthly = Math.min(availableMonthly, remainingTokens);

      fromMonthly += useMonthly;
      remainingTokens -= useMonthly;
    }

    // 2. use prepaid tokens next
    if (remainingTokens > 0 && this.prepaidBalance > 0) {
      const usePrepaid = Math.min(this.prepaidBalance, remainingTokens);

      fromPrepaid += usePrepaid;
      remainingTokens -= usePrepaid;
    }

    // 3. if we still have remaining tokens, use emergency monthly tokens
    // we don't need to calculate the available emergency tokens here,
    // because even if it exceeds the emergency limit, it should still be deducted.
    if (remainingTokens > 0) {
      fromMonthly += remainingTokens;
    }

    return { fromMonthly, fromPrepaid };
  }

  /**
   * Calculate the monthly refill details
   *
   * @returns
   */
  calculateMonthlyRefill(): {
    currentMonth: string;
    remainingMonthlyUsage: number;
  } {
    const currentMonth = TokenWallet.convertDate();

    const lastMonthUpdate = TokenWallet.parseDate(this.lastRefillMonth);
    const currentMonthDate = TokenWallet.parseDate(currentMonth);
    const mDiff = getMonthDifference(lastMonthUpdate, currentMonthDate);

    const eligibleUsage = mDiff * this.monthlyAllowance;
    const remainingMonthlyUsage = Math.max(
      0,
      this.monthlyUsage - eligibleUsage
    );

    return {
      currentMonth,
      remainingMonthlyUsage,
    };
  }

  /**
   * Check if there are tokens available for use
   *
   * @returns
   */
  hasTokensAvailable(): { general: boolean; emergency: boolean } {
    const generalAvailable =
      this.monthlyUsage < this.monthlyAllowance || this.prepaidBalance > 0;
    const emergencyAvailable =
      this.monthlyUsage < this.monthlyAllowance + this.emergencyLimit;

    return {
      general: generalAvailable,
      emergency: emergencyAvailable,
    };
  }

  static convertDate(date?: Date | number): string {
    let currentDate = date instanceof Date ? date : new Date();

    if (typeof date === "number" && date) {
      currentDate = new Date(0);
      currentDate.setUTCSeconds(date);
    }

    const year = currentDate.getUTCFullYear();
    const month = (currentDate.getUTCMonth() + 1).toString().padStart(2, "0");

    return `${year}-${month}`;
  }

  static parseDate(dateStr: string): Date {
    const [year, month] = dateStr.split("-").map((part) => parseInt(part));
    return new Date(Date.UTC(year, month - 1, 1));
  }
}
