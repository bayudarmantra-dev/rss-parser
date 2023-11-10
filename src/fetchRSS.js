import { XMLParser } from 'fast-xml-parser';

export class FetchRSS {
    constructor(url = false) {
        this.url = url;
        this.response = {};

        if (!this.url) {
            this.response = {
                status: 400,
                message: 'No URL provided'
            };

            return this.response;
        }
    }

    async get() {
        const parserOptions = {
            ignoreAttributes:false
        }

        const parser = new XMLParser(parserOptions);

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            },
        };

        try{
            const response = await fetch(this.url, options);
            const rawData = await response.text();

            let data = parser.parse(rawData);
            let feed = {};

            if(data.feed) feed = this.reformatData(data.feed);
            if(data.rss) feed = this.reformatData(data.rss);

            this.response = {
                status: 200,
                feed: data
            };
        }catch(err){
            this.response = {
                status: 500,
                message: err.message
            };
        }

        return this.response;
    }

    reformatData(d) {
        if(d.link && d.link.length) {
            d.link = d.link.map(this.fixLink);
        }
    
        /*
        Final xformation... 
        */
        let result = {
            feed: {}, 
            entries: {}
        }
        
        // feed is metadata about the feed
        if(d.channel) {
            result.feed = {
                title: d.channel.title,
                link: d.channel.link
            }
    
            result.entries = d.channel.item.map(i => {
                return {
                    title: i.title, 
                    link: i.link, 
                    published: i.pubDate,
                    content: i['content:encoded']
                }
            });
        } else {
            result.feed = {
                title: d.title
            }
    
            if(d.link) {
                let alt = d.link.filter(d => d.rel === 'alternate');
                if(alt.length) result.feed.link = alt[0]['href'];
                else {
                    // accept the link with _no_ rel
                    result.feed.link = d.link.filter(d => !d.rel)[0]['href'];
                }
            }
    
            result.entries = d.entry.map(e => {
    
                if(e.link) e.link = this.fixLink(e.link);
    
                if(e.content) {
                    let newContent = {};
                    newContent.text = e.content['#text'];
                    newContent.type = e.content['@_type'];
                    e.content = newContent;
                }
    
                return {
                    title: e.title, 
                    published: e.updated, 
                    content: e.content.text,
                    link: e.link.href
                }
    
            });
    
        }
    
        return result;
    }
    
    fixLink(l) {
        let result = {};
        if(l['@_href']) result.href = l['@_href'];
        if(l['@_rel']) result.rel = l['@_rel'];
        if(l['@_type']) result.type = l['@_type'];
        if(l['@_title']) result.type = l['@_title'];
        return result;
    }
}