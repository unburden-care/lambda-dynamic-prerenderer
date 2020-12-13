const https = require("https");

const PRERENDERER_ENDPOINT =
	"https://btgwjx5vxl.execute-api.us-east-1.amazonaws.com/dev/prerender";

/**
 * @description The third function to fire. Pre-render content if user is a bot.
 */
exports.handler = async (event, context, callback) => {
	const request = event.Records[0].cf.request;
	const response = event.Records[0].cf.response;

	const BASE_URL_RENDERER = PRERENDERER_ENDPOINT + "/?url=";
	const HOST = request.headers["host"][0].value;
	// const HOST = "supportby.blue";
	const PRERENDER_URL = request.headers["x-prerender-uri"][0].value;
	const SHOULD_PRERENDER = request.headers["x-should-prerender"][0].value;
	console.log(request, HOST, PRERENDER_URL, SHOULD_PRERENDER);

	// Avoid requests for files
	if (SHOULD_PRERENDER === "true" && !PRERENDER_URL.includes(".")) {
		// INFO: For various reasons, I've used http here, but feel free to change or improve this for your case
		const URL = BASE_URL_RENDERER + "http://" + HOST + PRERENDER_URL;
		console.log("Full rendering path", URL);

		try {
			const body = await composeCampaignPageTemplate(PRERENDER_URL);
			// const body = await downloadContent(URL);

			console.log("Rendering success", URL);
			console.log("body", body);

			const NEW_RESPONSE = {
				status: "200",
				statusDescription: "OK",
				headers: response.headers,
				body,
			};

			callback(null, NEW_RESPONSE);
		} catch (error) {
			console.log("Rendering error", URL);
			callback(null, response);
		}
	} else {
		callback(null, response);
	}
};

/**
 * @description Download content with Node https module
 */
const downloadContent = async function (url, callback) {
	return new Promise((resolve, reject) => {
		https
			.get(url, function (res) {
				let body = "";

				res.on("data", function (chunk) {
					body += chunk.toString();
				});

				res.on("end", function () {
					resolve(body);
				});
			})
			.on("error", function (e) {
				reject(e);
			});
	});
};

const composeCampaignPageTemplate = async function (campaignPath) {
	const url = `https://conversation.supportby.blue/api${campaignPath}`;

	const body = await downloadContent(url);

	const result = JSON.parse(body);

	return `<!DOCTYPE html>
	<html lang="en">
	  <head>
		<title>${result.data.title} | Blue</title>
		<meta
		  name="description"
		  content="${result.data.description}"
		/>
		<meta property="og:title" content="${result.data.title}" />
		<meta
		  property="og:description"
		  content="${result.data.description}"
		/>
		<meta
		  property="og:image"
		  content="http://supportby.blue.s3-website-us-east-1.amazonaws.com/campaign-share.png"
		/>
		<meta property="og:url" content="https://supportby.blue${campaignPath}" />
	  </head>
	  <body>
		<div id="blue-root"></div>
	  </body>
	</html>
	`;
};
