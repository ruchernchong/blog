export type StackOverflowProfile = {
  badge_counts: {
    [tier: string]: number;
  };
  reputation: number;
};

export const getStackOverflowProfile =
  async (): Promise<StackOverflowProfile> => {
    const STACK_OVERFLOW_API_URL: string = "https://api.stackexchange.com/2.3";
    const USER_ID: number = 4031163;

    const params = new URLSearchParams({
      order: "desc",
      sort: "reputation",
      site: "stackoverflow",
    });

    const { items } = await fetch(
      `${STACK_OVERFLOW_API_URL}/users/${USER_ID}?${params}`,
    ).then((res) => res.json());

    return items[0];
  };
