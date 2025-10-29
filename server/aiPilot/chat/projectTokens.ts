import { customError } from "common/custom-error/custom-error";
import { TokenTransactions } from "common/models/aiPilot/TokenTransactions";
import { TokenWallet } from "common/models/aiPilot/TokenWallet";
import { ProjectModel } from "common/models/projects/ProjectModel";
import { UserModel } from "common/models/user/UserModel";
import { mergeDeep } from "common/models/utils";
import { checkProjectExists } from "server/api/projects/getProject";
import { getCollection } from "server/database/mongodb";
import { createSimpleId } from "server/utils/createId";

/**
 * Get the AI Pilot feature flags for a project
 *
 * @param projectId
 * @returns
 */
export async function getAiPilotFeatureFlags(projectId: string) {
  const collection = await getCollection<ProjectModel>("projects");
  const doc = await collection.findOne(
    {
      projectId,
    },
    {
      projection: {
        "featureFlags.aiPilot": 1,
      },
    }
  );

  const defaultFlag = new ProjectModel().featureFlags.aiPilot;

  if (doc) {
    return mergeDeep(defaultFlag, doc.featureFlags.aiPilot);
  }
  return defaultFlag;
}

/**
 * Get the token wallet for a project
 *
 * @param projectId
 * @returns
 */
export async function getTokenWallet(
  projectId: string,
  user?: UserModel
): Promise<TokenWallet> {
  const collection = await getCollection<TokenWallet>("ai_pilot_token_wallet");

  const doc = await collection.findOne({
    projectId,
  });

  let wallet: TokenWallet;
  if (doc) {
    wallet = new TokenWallet(doc);
  } else {
    // check that the project exists
    const exists = await checkProjectExists(projectId);
    if (!exists) {
      throw customError(404, "Project not found");
    }

    // create a new wallet if none exists
    wallet = new TokenWallet({
      projectId,
      created: {
        userId: user?.id || "",
        displayName: user?.name || "System",
      },
    });

    await collection.updateOne(
      { projectId },
      { $set: wallet },
      { upsert: true }
    );
  }

  // check if we need to refill the monthly balance
  if (wallet.needsMonthlyRefill()) {
    const featureFlags = await getAiPilotFeatureFlags(projectId);

    const monthlyAllowance = featureFlags.settings.monthlyAllowance;
    const emergencyLimit = Math.floor(monthlyAllowance * 0.5);

    const { currentMonth, remainingMonthlyUsage } =
      wallet.calculateMonthlyRefill();

    // update the document in the database
    const result = await collection.updateOne(
      { projectId, lastRefillMonth: { $ne: currentMonth } },
      {
        $set: {
          monthlyAllowance,
          emergencyLimit,
          monthlyUsage: remainingMonthlyUsage,
          lastRefillMonth: currentMonth,
        },
      }
    );

    // update the wallet
    if (result.modifiedCount > 0) {
      wallet.monthlyAllowance = monthlyAllowance;
      wallet.emergencyLimit = emergencyLimit;
      wallet.monthlyUsage = remainingMonthlyUsage;

      wallet.lastRefillMonth = currentMonth;
    } else {
      const updatedDoc = await collection.findOne({ projectId });
      if (updatedDoc) {
        wallet = new TokenWallet(updatedDoc);
      }
    }
  }

  return wallet;
}

/**
 * Update the token wallet for a project
 *
 * @param projectId
 * @returns
 */
export async function updateTokenWallet(
  projectId: string,
  data: Partial<TokenWallet>
): Promise<TokenWallet> {
  const collection = await getCollection<TokenWallet>("ai_pilot_token_wallet");

  const wallet = await getTokenWallet(projectId);
  wallet.assign(data);

  const set: Partial<TokenWallet> = {};
  for (const key of Object.keys(data)) {
    (set as any)[key] = (wallet as any)[key];
  }

  const result = await collection.updateOne(
    {
      projectId,
    },
    {
      $set: data,
    }
  );

  if (result.modifiedCount > 0) {
    wallet.assign(data);
  } else {
    throw customError(500, "Failed to update token wallet");
  }

  return wallet;
}

/**
 * This function does not check if there are enough tokens available.
 *
 * It simply deducts the used tokens from the wallet in the correct order:
 * 1. Monthly Allowance
 * 2. Prepaid Balance
 * 3. Emergency Limit
 *
 * @param projectId
 * @param tokensUsed
 * @param user
 */
export async function trackProjectTokenUsage(
  projectId: string,
  ids: { chatId: string; messageId: string },
  tokensUsed: number,
  user: UserModel
): Promise<{ wallet: TokenWallet; transaction: TokenTransactions }> {
  const walletCollection = await getCollection<TokenWallet>(
    "ai_pilot_token_wallet"
  );
  const transactionCollection = await getCollection<any>(
    "ai_pilot_token_transactions"
  );

  const wallet = await getTokenWallet(projectId, user);

  const { fromMonthly, fromPrepaid } = wallet.splitTokens(tokensUsed);

  // create a new transaction
  const trx = new TokenTransactions({
    uuid: await createSimpleId("ai_pilot"),
    projectId,
    ...ids,
    monthlyTokens: -fromMonthly,
    prepaidTokens: -fromPrepaid,
    transactionType: "usage",
    created: {
      userId: user?.id || "",
      displayName: user?.name || "System",
    },
  });

  await transactionCollection.insertOne(trx);

  // update the wallet balances
  const result = await walletCollection.updateOne(
    { projectId },
    {
      $inc: {
        monthlyUsage: fromMonthly,
        prepaidBalance: -fromPrepaid,
      },
    }
  );

  if (result.modifiedCount > 0) {
    wallet.monthlyUsage += fromMonthly;
    wallet.prepaidBalance -= fromPrepaid;
  } else {
    throw customError(500, "Failed to update token wallet balances");
  }

  return { wallet, transaction: trx };
}
