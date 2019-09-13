import {Command, options} from '@microsoft/bf-cli-command'

import { Http2ServerRequest } from 'http2';

const fetch = require("node-fetch");

export const http = async (request: RequestInfo): Promise<any> => {
  return new Promise(resolve => {
    fetch(request)
      .then((response: { json: () => void; }) => response.json())
      .then((body: unknown) => {
        resolve(body);
      });
  });
};


export default class Show extends Command {
  static description = 'Shows Bulletin board announcements'
  static options: options.Input<any> = {};
  static examples = [
    `$ bf bulletin:show   Shows bulletin board announcement

`,
  ]  


  async run() {
	  
    var endpoint = 'http://bfbulletin.azurewebsites.net/Api/Bulletin'
  
    var msg = await http(endpoint);
	// Raw Json
    // this.log(msg);
	/*
		{ title: 'Testing Announcement',
		  body: 'This is a test of BF CLI bulletin message board.',
		  publishDate: '2019-09-12T00:00:01Z',
		  tags: 'Test',
		  referenceUrl: 'https://aka.ms/bfcli',
		  seeAlso: 'https://dev.botframework.com/',
		  partitionKey: 'BFBV1',
		  rowKey: '662',
		  timestamp: '2019-09-12T23:15:59.9268372+00:00',
		  eTag: 'W/"datetime\'2019-09-12T23%3A15%3A59.9268372Z\'"' }	
	*/
	

    var title = msg["title"];
    var body = msg["body"];
    var date = msg["publishDate"];
    var tags = msg["tags"];
    var ref = msg["referenceUrl"];
	var also = msg["seeAlso"];
	
	this.log("-=<< " + title + " >>=-");
	this.log(body);
	this.log("---");
	this.log("Date     :\t" + date);
	this.log("Reference:\t" + ref);
	this.log("See Also :\t" + also);
	this.log("Tags     :\t" + tags);
	
	
  }
}
