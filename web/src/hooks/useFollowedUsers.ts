import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userServiceClient } from "@/connect";
import useCurrentUser from "@/hooks/useCurrentUser";
import { userKeys } from "@/hooks/useUserQueries";

export const useFollowing = (userName?: string) => {
  return useQuery({
    queryKey: userKeys.following(userName ?? ""),
    queryFn: async () => {
      if (!userName) {
        throw new Error("User name is required");
      }
      const response = await userServiceClient.listFollowing({ parent: userName });
      return response.usernames;
    },
    enabled: Boolean(userName),
    staleTime: 1000 * 30,
  });
};

export const useFollowedUsers = () => {
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const { data: followedUsernames = [] } = useFollowing(currentUser?.name);

  const isFollowing = (username: string) => followedUsernames.includes(username);

  const invalidateFollowQueries = async (targetUsername: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: userKeys.following(currentUser?.name ?? "") }),
      queryClient.invalidateQueries({ queryKey: userKeys.userStats(`users/${targetUsername}`) }),
      queryClient.invalidateQueries({ queryKey: userKeys.stats() }),
    ]);
  };

  const followMutation = useMutation({
    mutationFn: async (username: string) => {
      await userServiceClient.followUser({ name: `users/${username}` });
    },
    onSuccess: async (_, username) => {
      await invalidateFollowQueries(username);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (username: string) => {
      await userServiceClient.unfollowUser({ name: `users/${username}` });
    },
    onSuccess: async (_, username) => {
      await invalidateFollowQueries(username);
    },
  });

  const follow = (username: string) => {
    if (!currentUser || isFollowing(username)) {
      return;
    }
    followMutation.mutate(username);
  };

  const unfollow = (username: string) => {
    if (!currentUser || !isFollowing(username)) {
      return;
    }
    unfollowMutation.mutate(username);
  };

  const toggleFollow = (username: string, _followerUsername?: string) => {
    if (isFollowing(username)) {
      unfollow(username);
    } else {
      follow(username);
    }
  };

  return {
    followedUsernames,
    isFollowing,
    follow,
    unfollow,
    toggleFollow,
  };
};
