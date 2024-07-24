import { Meme, Caption } from "../components/meme.mjs";
import { db } from "../db/db.mjs";

class MemeDAO {
	constructor() {}

	/**
	 * Get a random meme with seven captions, two correct and five wrong.
	 * can use excludedMemes to avoid repeating memes.
	 */
	getMemeWithSevenCaptions = (excludedMemes = [0]) => {
		return new Promise((resolve, reject) => {
			try {
				const placeholders = excludedMemes.map(() => "?").join(",");
				const randomMemeWithSevenCaptionsSQL = `
				WITH random_meme AS (
						SELECT id AS meme_id, file_name
						FROM memes
						WHERE id NOT IN (${placeholders})
						ORDER BY RANDOM()
						LIMIT 1
				),
				correct_captions AS (
						SELECT mc.meme_id, mc.caption_id, c.text, mc.score, rm.file_name
						FROM meme_captions mc
						JOIN captions c ON mc.caption_id = c.id
						JOIN random_meme rm ON mc.meme_id = rm.meme_id
						WHERE mc.meme_id = (SELECT meme_id FROM random_meme)
							AND mc.score > 0
							AND mc.caption_id <> 42
						ORDER BY RANDOM()
						LIMIT 2
				),
				wrong_captions AS (
						SELECT mc.meme_id, mc.caption_id, c.text, mc.score, rm.file_name
						FROM meme_captions mc
						JOIN captions c ON mc.caption_id = c.id
						JOIN random_meme rm ON mc.meme_id = rm.meme_id
						WHERE mc.meme_id = (SELECT meme_id FROM random_meme)
							AND mc.score = 0
							AND mc.caption_id <> 42
						ORDER BY RANDOM()
						LIMIT 5
				)
				SELECT
						meme_id,
						caption_id,
						text,
						score,
						file_name
				FROM correct_captions
				UNION ALL
				SELECT
						meme_id,
						caption_id,
						text,
						score,
						file_name
				FROM wrong_captions;
				`;
				db.all(randomMemeWithSevenCaptionsSQL, [...excludedMemes], (err, rows) => {
					if (err) {
						return reject(err);
					}
					if (!rows) {
						return resolve({ error: "Meme not found!" });
					}
					const memeId = rows[0].meme_id;
					const memeFileName = rows[0].file_name;
					const captions = rows.map((row) => {
						return new Caption(row.caption_id, row.text, row.score);
					});
					const meme = new Meme(memeId, memeFileName, captions);
					return resolve(meme);
				});
			} catch (error) {
				return reject(error);
			}
		});
	};


	getAllMemes = () => {
		return new Promise((resolve, reject) => {
			try {
				db.all("SELECT * FROM memes", [], (err, rows) => {
					if (err) {
						return reject(err);
					}
					if (!rows) {
						return resolve({ error: "Memes not found!" });
					}
					const memes = rows.map((meme) => {
						return new Meme(meme.id, meme.file_name);
					});
					return resolve(memes);
				});
			} catch (error) {
				return reject(error);
			}
		});
	};

	getScoreAndIdFromMemeAndCaption = (memeId, captionId) => {
		return new Promise((resolve, reject) => {
			try {
				const scoreFromMemeAndCaptionSQL = `
				SELECT score, id
				FROM meme_captions
				WHERE meme_id = ? AND caption_id = ?;
				`;
				db.get(scoreFromMemeAndCaptionSQL, [memeId, captionId], (err, row) => {
					if (err) {
						return reject(err);
					}
					if (!row) {
						return resolve({ error: "Score not found!" });
					}
					return resolve({score: row.score, id: row.id});
				});
			} catch (error) {
				return reject(error);
			}
		});
	};
}

export default MemeDAO;
