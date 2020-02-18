import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CourseFeedbackUtilityService {

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
        window.setTimeout(() => {
          resolve();
        }, 3000);
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
}
