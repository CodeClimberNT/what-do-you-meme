class Meme {
	constructor(id, image, captions = []) {
		this.memeId = id;
		this.image = image;
		this.captions = captions;
	}
	setCaptions(captions) {
		this.captions = captions;
	}
	resetCaptionsScore() {
		this.captions.forEach((caption) => {
			caption.score = 0;
		});
	}
}

class Caption {
	constructor(id, caption, score) {
		this.captionId = id;
		this.caption = caption;
		this.score = score;
	}
}

export { Meme, Caption };
