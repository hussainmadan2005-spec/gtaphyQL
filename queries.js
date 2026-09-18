
/**
 * 1. Basic user info — id and login.
 *    Simple query, no arguments.
 */
export const USER_INFO = `
  query UserInfo {
    user {
      id
      login
    }
  }
`;

/**
 * 2. All XP transactions for the user, ordered by date ascending.
 *    Nested "object" gives us the project name for per-project XP.
 *    "where" filters to only type = "xp" rows.
 *    "order_by" sorts oldest-first for the cumulative chart.
 *    The API automatically filters to the authenticated user based on JWT.
 */
export const XP_TRANSACTIONS = `
  query XpTransactions {
    transaction(
      where: { type: { _eq: "xp" } }
      order_by: { createdAt: asc }
      limit: 10000
    ) {
      id
      amount
      createdAt
      path
      object {
        name
        type
      }
    }
  }
`;

/**
 * 3. Current level — most recent "level" transaction.
 *    "order_by" desc + "limit 1" = single efficient row.
 *    The API automatically filters to the authenticated user based on JWT.
 */
export const CURRENT_LEVEL = `
  query CurrentLevel {
    transaction(
      where: { type: { _eq: "level" } }
      order_by: { createdAt: desc }
      limit: 1
    ) {
      amount
      createdAt
    }
  }
`;

/**
 * 4. Audit totals using Hasura aggregation.
 *    One request returns both "given" (up) and "received" (down) sums.
 *    This is much more efficient than fetching all rows.
 *    The API automatically filters to the authenticated user based on JWT.
 */
export const AUDIT_TOTALS = `
  query AuditTotals {
    given: transaction_aggregate(
      where: { type: { _eq: "up" } }
    ) {
      aggregate {
        sum {
          amount
        }
      }
    }
    received: transaction_aggregate(
      where: { type: { _eq: "down" } }
    ) {
      aggregate {
        sum {
          amount
        }
      }
    }
  }
`;

/**
 * 5. Project results with nested object info.
 *    "result" table has grade, objectId, userId, etc.
 *    Nesting "object" lets us filter by project type in JS.
 *    We order by updatedAt desc to get recent results first.
 *    The API automatically filters to the authenticated user based on JWT.
 */
export const PROJECT_RESULTS = `
  query ProjectResults {
    result(
      order_by: { updatedAt: desc }
      limit: 10000
    ) {
      id
      grade
      createdAt
      updatedAt
      object {
        id
        name
        type
      }
    }
  }
`;

/**
 * 6. Skill transactions — type starts with "skill_".
 *    We use _ilike for case-insensitive prefix matching.
 *    Results grouped and ranked in JavaScript.
 *    The API automatically filters to the authenticated user based on JWT.
 */
export const SKILL_TRANSACTIONS = `
  query SkillTransactions {
    transaction(
      where: { type: { _ilike: "skill_%" } }
      order_by: { amount: desc }
      limit: 1000
    ) {
      type
      amount
    }
  }
`;

/**
 * 7. Progress data for pass/fail calculations.
 *    Uses the progress table which is more reliable than result.
 *    isDone: true means the attempt is completed.
 *    The API automatically filters to the authenticated user based on JWT.
 */
export const USER_PROGRESS = `
  query UserProgress {
    progress(
      where: { isDone: { _eq: true } }
      limit: 10000
    ) {
      id
      grade
      createdAt
      updatedAt
      object {
        id
        name
        type
      }
    }
  }
`;
