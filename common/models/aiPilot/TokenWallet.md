# Token Metering & Wallet System

This model provides a wallet system for tracking API or resource consumption within projects.
The system is designed for scaling and being auditable, utilizing a central `ProjectWallet`
document to maintain current state and a `TokenTransaction` log to preserve transaction history.

### Core Logic Features

- **Monthly Allowance:** Projects receive a fixed, recurring number of tokens each month.
- **Prepaid Tokens:** Supports purchasing extra tokens that are stored separately and have a long-term expiration.
- **Emergency Budget:** Allows projects to "borrow" a portion from next month's allowance if their monthly and prepaid tokens are depleted.
- **Spending Priority:** The system automatically consumes tokens in the correct order:
  1.  Monthly Tokens
  2.  Prepaid Tokens
  3.  Emergency (Borrowed) Tokens
