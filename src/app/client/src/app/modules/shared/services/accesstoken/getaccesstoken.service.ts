import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpHeaders, HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GetaccesstokenService {

  constructor(public http: HttpClient) { }
    accesstoken(region, key): Observable<any> {
    const httpOptions = {
      headers:
        new HttpHeaders({
          'Content-type': 'application/json',
          'Ocp-Apim-Subscription-Key': key
        })
    };
    return this.http.post('https://' + region + '.api.cognitive.microsoft.com/sts/v1.0/issueToken', {}, httpOptions);
  }
}
