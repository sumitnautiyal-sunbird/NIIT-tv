import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventEmitter } from 'events';

@Injectable({
  providedIn: 'root'
})
export class LivesessionService {
url = 'http://localhost:8000/courseDetails';
courseDetails = [];
public updateEvent = new EventEmitter();
  constructor(public http: HttpClient) { }
   saveSessionDetails(session) {
    return this.http.post(this.url, session);
  }
  getSessionDetails() {
   return this.http.get(this.url);
  }
  updateSessionDetails(session) {
    return this.http.post(this.url, session);
  }
}
