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

        const response = await fetch(this.url, options);
        const rawData = await response.text();

        let data = parser.parse(rawData);
        let feed = {};

        this.response = data;

        // if( JSON.stringify(data) === '{}' ) {
        //     this.response = {
        //         status: 500,
        //         message: 'Failed to parse RSS feed'
        //     };

        //     return this.response;
        // }

        // if(data.feed) feed = this.reformatData(data.feed);
        // if(data.rss) feed = this.reformatData(data.rss);

        this.response = {
            status: 200,
            feed: data
        };

        // try{
        //     const response = await fetch('https://www.vice.com/id_id/rss', options);
        //     const rawData = await response.text();

        //     let data = parser.parse(rawData);
        //     let feed = {};

        //     this.response = data;

        //     if( JSON.stringify(data) === '{}' ) {
        //         this.response = {
        //             status: 500,
        //             message: 'Failed to parse RSS feed'
        //         };

        //         return this.response;
        //     }

        //     if(data.feed) feed = this.reformatData(data.feed);
        //     if(data.rss) feed = this.reformatData(data.rss);

        //     this.response = {
        //         status: 200,
        //         feed: feed
        //     };
        // }catch(err){
        //     this.response = {
        //         status: 500,
        //         message: err.message
        //     };
        // }

        return this.response;
    }

    reformatData(d) {
        let result = [];
        let items = [];

        let entries = false;

        if( d.channel ) {
            entries = d.channel;
        }

        if( d.entry ) {
            entries = d.entry;
        }

        if( entries ) {
            result.push({
                metadata: {
                    title: entries.title ? entries.title : '',
                    link: entries.link ? entries.link : '',
                    description: entries.description ? entries.description : '',
                    image: entries.image.url ? entries.image.url : false,
                }
            });

            if( entries.item ) {
                entries.item.forEach((item) => {
                    items.push({
                        title: item.title ? item.title : '',
                        link: this.getLink(item),
                        description: item.description ? item.description : '',
                        pubDate: this.getPubDate(item),
                        thumbnail: this.getThumbnail(item),
                        category: this.getCategories(item)
                    });
                });

                result.push({
                    items: items
                });
            }
        }
        
        return result;
    }

    getLink( item ) {
        let link = '';

        if( typeof item.link === 'object' && item.link !== null ) {
            link = item.link.href;
        }else {
            link = item.link;
        }

        return link;
    }

    getThumbnail( item ) {
        let thumbnail = false;

        if( item.enclosure && item.enclosure['@_url'] ) {
            thumbnail = item.enclosure['@_url'];
        }

        if( item.img ) {
            thumbnail = item.img;
        }

        if( item['media:thumbnail'] ) {
            thumbnail = item['media:thumbnail']['@_url'];
        }

        if( item.thumbnail ) {
            thumbnail = item.thumbnail;
        }

        return thumbnail;
    }

    getPubDate( item ) {
        let pubDate = false;

        if( item.pubDate ) {
            pubDate = item.pubDate;
        }

        if( item.published ) {
            pubDate = item.published;
        }
        
        return pubDate;
    }

    getCategories( item ) {
        let categories = {};

        if( Array.isArray(item.category) ) {
            categories = item.category;
        }else {
            categories = [item.category];
        }

        return categories;
    }
}