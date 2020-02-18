import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlayresourceService {
public playresource = new BehaviorSubject<any>({content : {} , flag : false});
public allowSpeak = new BehaviorSubject<any>({option : 0 , flag : false});
  constructor() { }
}
