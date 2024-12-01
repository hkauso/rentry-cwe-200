import crypto from "node:crypto";

// load paste
const rentry = {
    slug: process.env.RENTRY_SLUG,
    password: process.env.RENTRY_PASSWORD,
};

let text = (await get_text(rentry.slug)).content;

// stuff for sending ip hash to rentry page, not actually needed for attack
function hash(input) {
    return crypto
        .createHash("sha256")
        .update(input)
        .digest("hex")
        .substring(0, 10);
}

async function get_csrf() {
    const text = await (await fetch("https://rentry.co")).text();
    return text.split('name="csrfmiddlewaretoken" value="')[1].split('">')[0];
}

async function get_text(slug) {
    return await (await fetch(`https://rentry.co/api/raw/${slug}`)).json();
}

async function edit(csrf, slug, password, text) {
    return await (
        await fetch(`https://rentry.co/${slug}/edit`, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Referer: `https://rentry.co/${slug}/edit`, // What in the world do you think a "referer check" is going to stop? Look at how easy this is to fake
                Cookie: `csrftoken=${csrf}`,
            },
            body: [
                `csrfmiddlewaretoken=${csrf}`,
                `text=${encodeURIComponent(text)}`,
                `edit_code=${password}`,
                // useless fields for this
                "new_edit_code=",
                "new_url=",
                // extra useless fields
                "metadata=",
                "new_modify_code=",
            ].join("&"),
            method: "POST",
        })
    ).text();
}

// start server
Bun.serve({
    port: process.env.PORT || 8080,
    async fetch(req) {
        // get ip
        const ip_header = "CF-Connecting-IP";

        const ip = req.headers.get(ip_header);
        const csrf = await get_csrf(); // we need this to pass server validation

        // edit paste
        const ip_hash = hash(ip || "127.0.0.1"); // we're not just going to post user ips to the page, EVEN THOUGH IT COULD BE DONE
        if (!text.includes(ip_hash)) {
            const time = new Date().toISOString();
            text += `\n${time} ${ip_hash}`;

            await edit(csrf, rentry.slug, rentry.password, text);
        }

        // return
        return new Response(
            `<svg><text>IP: ${ip}, IP Hash: ${ip_hash}</text></svg>`,
            {
                headers: {
                    "Content-Type": "image/svg+xml", // so we can return text without browser making it clear
                },
            },
        );
    },
});
