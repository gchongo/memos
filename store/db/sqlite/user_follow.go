package sqlite

import (
	"context"
	"database/sql"
	"errors"

	storepkg "github.com/usememos/memos/store"
)

func (d *DB) UpsertUserFollow(ctx context.Context, follow *storepkg.UserFollow) error {
	_, err := d.db.ExecContext(ctx, `
		INSERT INTO user_follow (follower_id, followee_id, created_ts)
		VALUES (?, ?, strftime('%s', 'now'))
		ON CONFLICT(follower_id, followee_id) DO NOTHING`,
		follow.FollowerID, follow.FolloweeID,
	)
	return err
}

func (d *DB) DeleteUserFollow(ctx context.Context, delete *storepkg.DeleteUserFollow) error {
	_, err := d.db.ExecContext(ctx, `
		DELETE FROM user_follow
		WHERE follower_id = ? AND followee_id = ?`,
		delete.FollowerID, delete.FolloweeID,
	)
	return err
}

func (d *DB) HasUserFollow(ctx context.Context, followerID, followeeID int32) (bool, error) {
	var exists int
	err := d.db.QueryRowContext(ctx, `
		SELECT 1
		FROM user_follow
		WHERE follower_id = ? AND followee_id = ?
		LIMIT 1`,
		followerID, followeeID,
	).Scan(&exists)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (d *DB) CountUserFollowers(ctx context.Context, followeeID int32) (int32, error) {
	var count int32
	err := d.db.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM user_follow
		WHERE followee_id = ?`,
		followeeID,
	).Scan(&count)
	return count, err
}

func (d *DB) CountUserFollowing(ctx context.Context, followerID int32) (int32, error) {
	var count int32
	err := d.db.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM user_follow
		WHERE follower_id = ?`,
		followerID,
	).Scan(&count)
	return count, err
}

func (d *DB) ListFollowingUsernames(ctx context.Context, followerID int32) ([]string, error) {
	rows, err := d.db.QueryContext(ctx, `
		SELECT u.username
		FROM user_follow uf
		INNER JOIN user u ON u.id = uf.followee_id
		WHERE uf.follower_id = ?
		ORDER BY u.username ASC`,
		followerID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	usernames := []string{}
	for rows.Next() {
		var username string
		if err := rows.Scan(&username); err != nil {
			return nil, err
		}
		usernames = append(usernames, username)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return usernames, nil
}

func (d *DB) DeleteUserFollowsByUserID(ctx context.Context, userID int32) error {
	_, err := d.db.ExecContext(ctx, `
		DELETE FROM user_follow
		WHERE follower_id = ? OR followee_id = ?`,
		userID, userID,
	)
	return err
}
