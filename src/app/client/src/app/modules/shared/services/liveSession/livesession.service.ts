import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventEmitter } from 'events';

@Injectable({
  providedIn: 'root'
})
export class LivesessionService {
// url = 'http://localhost:8000/courseDetails';
// url = 'https://tranquil-chamber-71570.herokuapp.com/livesession';
url = '/v1/tenant/livesession';
courseDetails = [];
public updateEvent = new EventEmitter();
  constructor(public http: HttpClient) { }
   saveSessionDetails(session) {
     console.log('saving ', session);
    return this.http.post(this.url, session);
  }
  getSessionDetails() {
    console.log('getting session ')
   return this.http.get(this.url);
}
}
