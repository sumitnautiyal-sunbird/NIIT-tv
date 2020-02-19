import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnrolledcontentService {
public listofenrolledcourses = new BehaviorSubject<any>([]);
  constructor() { }
}
