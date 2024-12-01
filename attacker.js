// this is an example of the attack done in a way the attacker might do it
Bun.serve({
    port: process.env.PORT || 8080,
    async fetch(req) {
        // get ip
        const ip_header = "CF-Connecting-IP";
        const ip = req.headers.get(ip_header);

        // at this point, we have the user's IP and are free to do whatever we want with it

        // return
        return new Response("<svg></svg>", {
            headers: {
                "Content-Type": "image/svg+xml",
            },
        });
    },
});
