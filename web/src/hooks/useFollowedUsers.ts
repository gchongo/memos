import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const STORAGE_KEY = "memos-x-followed-usernames";

export const useFollowedUsers = () => {
  const [followedUsernames, setFollowedUsernames] = useLocalStorage<string[]>(STORAGE_KEY, []);

  const isFollowing = useCallback(
    (username: string) => followedUsernames.includes(username),
    [followedUsernames],
  );

  const follow = useCallback(
    (username: string) => {
      setFollowedUsernames((current) => (current.includes(username) ? current : [...current, username]));
    },
    [setFollowedUsernames],
  );

  const unfollow = useCallback(
    (username: string) => {
      setFollowedUsernames((current) => current.filter((name) => name !== username));
    },
    [setFollowedUsernames],
  );

  const toggleFollow = useCallback(
    (username: string) => {
      if (isFollowing(username)) {
        unfollow(username);
      } else {
        follow(username);
      }
    },
    [follow, isFollowing, unfollow],
  );

  return {
    followedUsernames,
    isFollowing,
    follow,
    unfollow,
    toggleFollow,
  };
};
