/**
 * game_date
 * game_score
 * meme_file_name
 * meme_caption_score
 * round_id
 * timeout
 */
export const gamesFromUsernameSQL = `
WITH user_games AS (
    SELECT g.id, g.date, g.score
    FROM games g
    JOIN users u ON u.id = g.user_id
    WHERE u.username = ? AND g.status = 'COMPLETED'
    ORDER BY g.date DESC
),
round_details AS (
    SELECT r.game_id, r.id AS round_id, r.timeout, mc.meme_id, mc.score AS meme_caption_score
    FROM rounds r
    JOIN meme_captions mc ON r.meme_caption_id = mc.id
    ORDER BY r.id ASC
)
SELECT 
    ug.id AS game_id,
    ug.date AS game_date,
    ug.score AS game_score,
    m.file_name AS meme_file_name,
    rd.meme_caption_score,
    rd.round_id,
    rd.timeout
FROM user_games ug
JOIN round_details rd ON ug.id = rd.game_id
JOIN memes m ON rd.meme_id = m.id
ORDER BY ug.date DESC, rd.round_id ASC;
`;

/**
 * REMEMBER TO ADD PLACEHOLDERS FOR EXCLUDED MEMES
 * const placeholders = excludedMemes.map(() => "?").join(",");
 * meme_id
 * caption_id
 * text
 * score
 */
// export const randomMemeWithSevenCaptionsSQL = `
// WITH random_meme AS (
//     SELECT id AS meme_id
//     FROM memes
//     WHERE id NOT IN (${placeholders})
//     ORDER BY RANDOM()
//     LIMIT 1
// ),
// correct_captions AS (
//     SELECT mc.meme_id, mc.caption_id, c.text, mc.score
//     FROM meme_captions mc
//     JOIN captions c ON mc.caption_id = c.id
//     WHERE mc.meme_id = (SELECT meme_id FROM random_meme)
//       AND mc.score > 0
//     ORDER BY RANDOM()
//     LIMIT 2
// ),
// wrong_captions AS (
//     SELECT mc.meme_id, mc.caption_id, c.text, mc.score
//     FROM meme_captions mc
//     JOIN captions c ON mc.caption_id = c.id
//     WHERE mc.meme_id = (SELECT meme_id FROM random_meme)
//       AND mc.score = 0
//     ORDER BY RANDOM()
//     LIMIT 5
// )
// SELECT
//     meme_id,
//     caption_id,
//     text,
//     score
// FROM correct_captions
// UNION ALL
// SELECT
//     meme_id,
//     caption_id,
//     text,
//     score
// FROM wrong_captions;
// `;

/**
 * Insert Round
 *
 */
export const insertRoundSQL = `
BEGIN TRANSACTION;

-- Step 1: Retrieve the meme_caption_id
WITH mc AS (
    SELECT id AS meme_caption_id 
    FROM meme_captions 
    WHERE meme_id = ? AND caption_id = ?
)
-- Step 2: Insert into rounds
INSERT INTO rounds (game_id, meme_caption_id, timeout)
SELECT ?, meme_caption_id, ?
FROM mc;

COMMIT;
`;

/**
 * caption_text
 * meme_caption_score
 */
export const captionAndScoreFromMemeIdSQL = `
SELECT 
    c.text AS caption_text,
    mc.score AS meme_caption_score
FROM
    memes m
JOIN
    meme_captions mc ON m.id = mc.meme_id
JOIN
    captions c ON mc.caption_id = c.id
WHERE
    m.id = ?
    AND mc.score > 0;
`;