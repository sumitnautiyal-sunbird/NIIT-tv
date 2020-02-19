import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CourseFeedbackUtilityService {

  private _statusTracker = new BehaviorSubject<any>(null);
  public feedbackStatusTracker = this._statusTracker.asObservable();
  public intervalID = null;

  constructor(private readonly http: HttpClient) { }

  get getDefaultFeedback(): object {
    return {
      feedbackTitle: 'Tell us what do you think about this unit ?',
    };
  }

  saveData(recordingData: object, dataStore = 'local') {
    return new Promise((resolve, reject) => {
      if (recordingData) {
        // window.localStorage.setItem('feedback_courseID', JSON.stringify({recording: 'Here recording data will be stored'}));
        resolve();
      } else {
        reject();
      }
    });
  }

  /**
   * Sends data to cloud. This function is essentially provided to send feedback recording to the google-cloud storage
   * and then start the complete process of keyword extraction
   * @param recordingData
   * @returns
   */
  sendDataToCloud(recordingData) {
    return new Promise((resolve, reject) => {
      const recordingFormData = this.getAudioFormData(recordingData);
      this.http.post('http://52.221.207.221:3200/camino/upload/feedback', recordingFormData).pipe(map((response) => {
        console.log('recieved response from feedback api');
        console.log(response);
        return response;
      })).subscribe(res => {
        resolve();
      }, err => {
        console.log('Error while hitting the api', err);
        reject();
      });
    });
  }

  getAudioFormData(AudioData) {
    const formData = new FormData();
    formData.append('feedback_files', AudioData.data, AudioData.Filename + '.' + AudioData.Fileextension);
    return formData;
  }

  startAnalysisPolling(filename) {
    // setinterval to start polling the file status
    this.intervalID = window.setInterval(() => {
      const url = `http://52.221.207.221:3200/camino/feedback/status/${filename}`;
      this.http.get(url).subscribe((res) => {
        console.log('response from status api ', res);
        if (res['status'].toString() === '200' && typeof res['data'] === 'number') {
          this._statusTracker.next(res['data']);
        } else {
          console.log('something else ', res);
          this._statusTracker.next(res);
          window.clearInterval(this.intervalID);
          if (res['status'].toString() === '200' && res['data'].status.toString() === '4') {
            this._statusTracker.next(null);
          }
        }
      }, err => {
        console.log('error while hitting feedback status api', err);
        window.clearInterval(this.intervalID);
        console.log('interval cleared');
        this._statusTracker.next(-1);
      });
    }, 3000);
  }

  detectSentiment(dataToVerify) {
    console.log('extracting sentiment from ', dataToVerify);
    let sentimentResult = '';
    if (dataToVerify.sentiment >= -0.2 && dataToVerify.sentiment <= 0.2) {
      sentimentResult = 'MODERATE';
    } else if (dataToVerify.sentiment < -0.2) {
      sentimentResult = 'NEGATIVE';
    } else {
      sentimentResult = 'POSITIVE';
    }
    return sentimentResult;
  }

  resetAnalyzer() {
    // emit undefined, means not yet analyzing and reset the variables if any
    this._statusTracker.next(undefined);
  }
}
