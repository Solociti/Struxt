import { Model, UserModelAction } from "../Model";
import { DeepPartial, mergeDeep } from "../utils";
import { TokenWallet } from "./TokenWallet";

export class TokenTransactions extends Model {
  /**
   * The unique ID of the transaction.
   */
  public uuid: string = "";

  /**
   * The project ID associated with the token transactions.
   */
  public projectId: string = "";

  /**
   * In case of usage, the chat ID associated with this transaction.
   */
  public chatId: string = "";

  /**
   * In case of usage, the message ID associated with this transaction.
   */
  public messageId: string = "";

  /**
   * In case of a purchase, the purchase ID associated with this transaction.
   */
  public purchaseId: string = "";

  /**
   * The number of monthly tokens added or removed in this transaction.
   */
  public monthlyTokens: number = 0;

  /**
   * The number of prepaid tokens added or removed in this transaction.
   */
  public prepaidTokens: number = 0;

  /**
   * The type of transaction.
   */
  public transactionType: "usage" | "purchase" | "adjustment" = "usage";

  /**
   * Optional notes about the transaction.
   *
   * This will be used for admin purposes to track refunds, adjustments, etc.
   */
  public notes: string = "";

  public created: Omit<UserModelAction, "active"> = {
    userId: "",
    displayName: "",
    date: Math.floor(Date.now() / 1000),
  };

  /**
   * The month the transaction was created in YYYY-MM format.
   */
  public createdMonth: string = TokenWallet.convertDate();

  constructor(data?: DeepPartial<TokenTransactions>) {
    super();

    if (data) {
      this.assign(data);
    }
  }

  assign(data: DeepPartial<TokenTransactions>) {
    mergeDeep(this, data);
  }

  clone(): TokenTransactions {
    return new TokenTransactions(JSON.parse(JSON.stringify(this)));
  }
}
