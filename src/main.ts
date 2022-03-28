

async function Main(request: Request): Promise<Response> {


    var url = new URL(request.url);

    var pathname = url.pathname;
    //console.log(pathname);

    if (pathname == "/favicon.ico") return new Response("", { status: 301, headers: { "Location": "https://tv.cctv.com/favicon.ico" } });


    var videoData = await fetch(`https://tv.cctv.com${pathname}`).then(res => {
        return res.text();
    }).then(text => {
        //console.log(text);

        //var itemid1 = RegExp(/(var itemid1).*;/g).exec(text)![0];
        //console.log(itemid1);
        var exp = /(VIDE)([A-Za-z0-9]){20}([0-9]){6}/g;
        var itemId = exp.exec(pathname)![0];
        console.log(itemId);

        //var col1 = new RegExp(/(var column_id).*;/g).exec(text)![0];
        var columnId = new RegExp(/(TOPC)([0-9]){16}/).exec(text)![0];
        console.log(columnId);
        return { itemId, columnId, }

    });

    var videoList: VideoList = await fetch(`https://api.cntv.cn/video/getVideoListByTopicIdInfo?videoid=${videoData.itemId}&topicid=${videoData.columnId}&serviceId=tvcctv&type=0`).then(res => {
        return res.json();
    })
    var guid: string | undefined;
    videoList.data.forEach(v => {
        if (v.video_id == videoData.itemId)
            guid = v.guid;
    });

    if (!guid) throw new Error("not found");
    var videoInfo: VideoInfo = await fetch(`https://vdn.apps.cntv.cn/api/getHttpVideoInfo.do?pid=${guid}`).then(res => {
        return res.json();
    })
    //return ();
    var m3u8: string | undefined;
    await fetch(videoInfo.hls_url).then(res => {
        return res.text();
    }).then(text => {
        var texts = text.split("\n");
        texts.forEach(v => {
            if (v.endsWith("1200.m3u8"))
                m3u8 = v;
        });
    })
    if (!m3u8) throw new Error("no found 1200.m3u8");

    return new Response(`https://hls.cntv.kcdnvip.com${m3u8}`)
    //return new Response(`${new URL(videoInfo.hls_url).hostname}`);


}


addEventListener("fetch", (event) => {
    event.respondWith(
        Main(event.request).catch(
            (err) => new Response(err.stack, { status: 500 })
        )
    );
})