import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GetkeywordsService {

  keywords = {
    'search content for java.' : 'java',
    'search content for html.': 'html',
    'search content for maths.': 'maths',
    'help me with some videos of machine learning.': 'machine learning',
    'i want to search for spring boot.': 'spring boot',
  }
    constructor() { }
    getkeywords(key) {
      return this.keywords[key.toLowerCase()];
    }
}
