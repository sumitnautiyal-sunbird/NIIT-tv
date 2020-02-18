import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChildcontentdetailsService {
public childrenContentDetails = new BehaviorSubject<any>([]);
  constructor() { }
}
