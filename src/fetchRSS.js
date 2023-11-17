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

            this.response = data;

            if( JSON.stringify(data) === '{}' ) {
                this.response = {
                    status: 500,
                    message: 'Failed to parse RSS feed'
                };

                return this.response;
            }

            if(data.feed) feed = this.reformatData(data.feed);
            if(data.rss) feed = this.reformatData(data.rss);

            this.response = {
                status: 200,
                hash: await this.getHash(this.url),
                feed: feed
            };
        }catch(err){
            this.response = {
                status: 500,
                message: err.message
            };
        }

        return this.response;
    }

    async getHash(text) {
        const encodedText = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encodedText);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    reformatData(d) {
        let result = [];
        let items = [];

        let entries = false;
        let meta = false;

        if( d.channel ) {
            entries = d.channel;
        }

        if( d.entry ) {
            entries = d.entry;
        }

        if( d.title ) {
            meta = d;
        }else {
            meta = entries;
        }

        if( entries ) {
            result.push({
                metadata: {
                    title: meta.title ? meta.title : '',
                    link: this.getMetaLink(meta),
                    description: this.getMetaDescription(meta),
                    image: this.getMetaThumbnail(meta)
                }
            });

            let entryItems = entries.item ? entries.item : entries;

            if( entryItems ) {
                entryItems.forEach((item) => {
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

    getMetaLink( entries ) {
        let link = '';

        if( entries.link && entries.link.href ) {
            link = entries.link.href;
        }

        if( Array.isArray(entries.link) ) {
            entries.link.forEach((l) => {
                if( l['@_rel'] === 'alternate' ) {
                    link = l['@_href'];
                }
            });
        }else {
            link = entries.link;
        }

        return link;
    }

    getMetaDescription( entries ) {
        let description = '';

        if( entries.description ) {
            description = entries.description;
        }

        if( entries.subtitle ) {
            description = entries.subtitle;
        }

        return description;
    } 

    getMetaThumbnail( entries ) {
        let thumbnail = false;

        if( entries.image && entries.image.url ) {
            thumbnail = entries.image.url;
        }

        if( entries['media:thumbnail'] ) {
            thumbnail = entries['media:thumbnail']['@_url'];
        }

        if( entries.thumbnail ) {
            thumbnail = entries.thumbnail;
        }

        return thumbnail;
    }

    getLink( item ) {
        let link = '';

        if( typeof item.link === 'object' && item.link !== null ) {
            link = item.link.href;

            if( item.link['@_href'] ) {
                link = item.link['@_href'];
            }
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

        if( item['media:content'] ) {
            thumbnail = item['media:content']['@_url'];
        }

        if( item['media:group'] ) {
            thumbnail = item['media:group']['media:content'][0]['@_url'];
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

        if( !item.category ) {
            return categories;
        }

        if( Array.isArray(item.category) ) {
            categories = item.category;
        }else {
            categories = [item.category];
        }

        return categories;
    }
}