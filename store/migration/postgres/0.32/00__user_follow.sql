CREATE TABLE user_follow (
  follower_id INTEGER NOT NULL,
  followee_id INTEGER NOT NULL,
  created_ts  BIGINT  NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()),
  PRIMARY KEY (follower_id, followee_id),
  FOREIGN KEY (follower_id) REFERENCES "user"(id) ON DELETE CASCADE,
  FOREIGN KEY (followee_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_follow_followee_id ON user_follow(followee_id);
